import { NextResponse } from 'next/server';

type SupportedLanguage = 'TypeScript' | 'JavaScript' | 'Java' | 'Python';
type Severity = 'high' | 'medium' | 'low';

type ReviewRequest = {
    code?: string;
    language?: SupportedLanguage;
    useOllama?: boolean;
    reviewRequest?: string;
};

type ReviewFinding = {
    severity: Severity;
    title: string;
    detail: string;
    line?: number;
};

type LanguageDetection = {
    language: SupportedLanguage | 'Unknown';
    confidence: 'high' | 'medium' | 'low';
};

type OllamaReview = {
    findings?: Array<{
        severity?: string;
        title?: string;
        detail?: string;
        line?: number;
    }>;
};

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:1.5b';
const MAX_OLLAMA_RETRIES = 3;

function jsonResponse(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
    });
}

function detectLanguage(code: string): LanguageDetection {
    const trimmed = code.trim();

    if (/^\s*(from\s+\w+\s+import|import\s+\w+|def\s+\w+\(|class\s+\w+[:(])/m.test(trimmed)) {
        return { language: 'Python', confidence: 'high' };
    }

    if (/\b(public|private|protected)\s+(class|interface|enum)\b|\bSystem\.out\.println\(|\bpublic\s+static\s+void\s+main\s*\(/.test(trimmed)) {
        return { language: 'Java', confidence: 'high' };
    }

    if (/\b(type|interface)\s+\w+\b|:\s*(string|number|boolean|unknown|never|Record<|Array<)|\bas\s+(const|string|number|boolean|\w+)/.test(trimmed)) {
        return { language: 'TypeScript', confidence: 'high' };
    }

    if (/\b(const|let|var|function|import|export|=>)\b/.test(trimmed)) {
        return { language: 'JavaScript', confidence: 'medium' };
    }

    return { language: 'Unknown', confidence: 'low' };
}

function isLanguageMismatch(selected: SupportedLanguage, detected: LanguageDetection) {
    if (detected.language === 'Unknown' || detected.confidence === 'low') {
        return false;
    }

    if (selected === detected.language) {
        return false;
    }

    if (selected === 'TypeScript' && detected.language === 'JavaScript') {
        return false;
    }

    return true;
}

function findLine(lines: string[], pattern: RegExp) {
    const index = lines.findIndex((line) => pattern.test(line));
    return index >= 0 ? index + 1 : undefined;
}

function createLocalReview(code: string, language: SupportedLanguage): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const lines = code.split(/\r?\n/);

    if (code.length < 20) {
        findings.push({
            severity: 'low',
            title: '분석할 코드가 짧습니다',
            detail: '함수나 파일 단위의 코드를 입력하면 더 정확한 리뷰를 받을 수 있습니다.',
            line: 1,
        });
    }

    if (/console\.log\(/.test(code)) {
        findings.push({
            severity: 'low',
            title: '디버그 로그가 남아 있습니다',
            detail: '운영 코드라면 console.log 대신 로깅 정책에 맞는 logger를 사용하거나 제거하세요.',
            line: findLine(lines, /console\.log\(/),
        });
    }

    if (/\bany\b/.test(code)) {
        findings.push({
            severity: 'medium',
            title: '느슨한 타입 사용',
            detail: 'any는 타입 안정성을 낮춥니다. 요청, 응답, 상태 객체 타입을 구체화하세요.',
            line: findLine(lines, /\bany\b/),
        });
    }

    if (/password|secret|token/i.test(code) && /(console\.log|localStorage|sessionStorage)/.test(code)) {
        findings.push({
            severity: 'high',
            title: '민감 정보 노출 가능성',
            detail: '토큰이나 비밀번호를 로그 또는 브라우저 저장소에 직접 남기지 않는 것이 안전합니다.',
            line: findLine(lines, /(console\.log|localStorage|sessionStorage)/),
        });
    }

    const longLineIndex = lines.findIndex((line) => line.length > 120);
    if (longLineIndex >= 0) {
        findings.push({
            severity: 'low',
            title: '긴 라인이 있습니다',
            detail: '120자를 넘는 라인은 리뷰와 유지보수가 어려울 수 있어 적절히 분리하는 것이 좋습니다.',
            line: longLineIndex + 1,
        });
    }

    if (/(fetch|axios|query|create|update|delete)\(/.test(code) && !/\b(await|then|catch)\b/.test(code)) {
        findings.push({
            severity: 'medium',
            title: '비동기 처리 확인 필요',
            detail: '네트워크 또는 DB 호출에 await, then, catch와 오류 처리가 있는지 확인하세요.',
            line: findLine(lines, /(fetch|axios|query|create|update|delete)\(/),
        });
    }

    if (language === 'TypeScript' && !/type |interface |:\s*(string|number|boolean|unknown|never)/.test(code)) {
        findings.push({
            severity: 'low',
            title: '명시적 타입이 부족합니다',
            detail: '입출력 객체와 주요 상태에 타입을 붙이면 변경 중 오류를 더 빨리 잡을 수 있습니다.',
            line: 1,
        });
    }

    if (findings.length === 0) {
        findings.push({
            severity: 'low',
            title: '즉시 보이는 위험 신호는 없습니다',
            detail: '자동 리뷰 기준으로는 명확한 문제를 찾지 못했습니다. 실제 실행 경로와 테스트는 별도로 확인하세요.',
        });
    }

    return findings;
}

function normalizeSeverity(value: unknown): Severity | undefined {
    const severity = String(value || '').trim().toLowerCase();

    if (severity === 'high' || severity.includes('높음') || severity.includes('심각')) {
        return 'high';
    }

    if (severity === 'medium' || severity.includes('중간') || severity.includes('보통')) {
        return 'medium';
    }

    if (severity === 'low' || severity.includes('낮음')) {
        return 'low';
    }

    return undefined;
}

function normalizeFindings(value: OllamaReview, totalLines: number): ReviewFinding[] {
    return (value.findings || [])
        .map((item) => ({
            severity: normalizeSeverity(item.severity),
            title: item.title,
            detail: item.detail,
            line: item.line,
        }))
        .filter((item) => item.severity && item.title && item.detail)
        .slice(0, 6)
        .map((item) => ({
            severity: item.severity as Severity,
            title: String(item.title),
            detail: String(item.detail),
            line: typeof item.line === 'number' && item.line >= 1 && item.line <= totalLines ? item.line : undefined,
        }));
}

function extractJsonObject(text: string) {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || trimmed;

    try {
        return JSON.parse(candidate) as OllamaReview;
    } catch {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return JSON.parse(candidate.slice(start, end + 1)) as OllamaReview;
        }

        throw new Error('Ollama response did not contain JSON.');
    }
}

function createFallbackOllamaFinding(response: string): ReviewFinding[] {
    const detail = response.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim();

    if (!detail) {
        return [{
            severity: 'low',
            title: 'Ollama 응답이 비어 있습니다',
            detail: 'Ollama가 응답했지만 리뷰 내용을 생성하지 못했습니다. 코드를 조금 더 구체적으로 입력한 뒤 다시 시도하세요.',
        }];
    }

    return [{
        severity: 'medium',
        title: 'Ollama 리뷰 결과',
        detail: detail.length > 500 ? `${detail.slice(0, 500)}...` : detail,
    }];
}

function createLineNumberedCode(code: string) {
    return code
        .split(/\r?\n/)
        .map((line, index) => `${index + 1}: ${line}`)
        .join('\n');
}

function normalizeReviewRequest(value?: string) {
    return value?.trim().slice(0, 1200) || '';
}

function createReviewPrompt(
    code: string,
    language: SupportedLanguage,
    reviewRequest: string,
    retryCount: number,
    previousResponse?: string
) {
    const schema = '{"findings":[{"severity":"high|medium|low","title":"짧은 한국어 제목","detail":"한두 문장의 한국어 설명","line":1}]}';
    const customReviewSection = reviewRequest
        ? [
            '사용자 추가 리뷰 요청:',
            reviewRequest,
            '이 요청을 기본 리뷰 기준보다 우선 반영하되, 명백한 버그, 보안, 테스트 누락은 함께 지적하세요.',
        ].join('\n')
        : '';

    if (retryCount > 0) {
        return [
            '이전 응답은 코드 펜스 또는 설명 때문에 JSON으로 파싱되지 않았습니다.',
            '이번에는 설명 없이 JSON 객체만 반환하세요.',
            `정확한 스키마: ${schema}`,
            'line은 아래 라인 번호가 붙은 코드의 실제 문제 라인입니다.',
            customReviewSection,
            previousResponse ? `이전 응답: ${previousResponse.slice(0, 1200)}` : '',
            `언어: ${language}`,
            '라인 번호가 붙은 코드:',
            createLineNumberedCode(code),
        ].filter(Boolean).join('\n');
    }

    return [
        '아래 코드를 리뷰하고 JSON으로만 답하세요.',
        `정확한 스키마: ${schema}`,
        '버그, 보안, 유지보수성, 누락된 테스트를 우선하세요.',
        '최대 6개 항목만 반환하세요.',
        'line은 아래 라인 번호가 붙은 코드의 실제 문제 라인입니다.',
        customReviewSection,
        `언어: ${language}`,
        '라인 번호가 붙은 코드:',
        createLineNumberedCode(code),
    ].filter(Boolean).join('\n');
}

async function requestOllamaReview(prompt: string) {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.1,
                num_predict: 2048,
            },
            system: [
                '당신은 한국어로만 답하는 시니어 코드 리뷰어입니다.',
                '반드시 JSON만 반환하세요. 마크다운, 설명 문장, 코드블록은 반환하지 마세요.',
                'title과 detail은 반드시 자연스러운 한국어로 작성하세요.',
                'severity는 high, medium, low 중 하나만 사용하세요.',
                'line은 문제가 있는 1부터 시작하는 코드 라인 번호입니다. 특정 라인이 없으면 생략하세요.',
            ].join('\n'),
            prompt,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama request failed with ${response.status}.`);
    }

    const data = await response.json() as { response?: string };
    return data.response || '';
}

async function createOllamaFindings(code: string, language: SupportedLanguage, reviewRequest: string) {
    const totalLines = code.split(/\r?\n/).length;
    let lastResponse = '';

    for (let retryCount = 0; retryCount < MAX_OLLAMA_RETRIES; retryCount += 1) {
        lastResponse = await requestOllamaReview(createReviewPrompt(code, language, reviewRequest, retryCount, lastResponse));

        try {
            const findings = normalizeFindings(extractJsonObject(lastResponse), totalLines);
            if (findings.length > 0) {
                return findings;
            }
        } catch {
            // Retry with a stricter repair prompt. If all retries fail, preserve the Ollama output as a card.
        }
    }

    return createFallbackOllamaFinding(lastResponse);
}

export async function POST(req: Request) {
    const body = (await req.json()) as ReviewRequest;
    const code = body.code?.trim() || '';
    const language = body.language || 'TypeScript';
    const reviewRequest = normalizeReviewRequest(body.reviewRequest);

    if (!code) {
        return jsonResponse({ message: '리뷰할 코드를 입력하세요.' }, 400);
    }

    const detected = detectLanguage(code);
    if (isLanguageMismatch(language, detected)) {
        return jsonResponse(
            {
                message: `선택한 언어는 ${language}이지만 코드가 ${detected.language}로 보입니다. 언어를 ${detected.language}로 변경한 뒤 다시 리뷰하세요.`,
                detectedLanguage: detected.language,
            },
            422
        );
    }

    if (body.useOllama) {
        try {
            return jsonResponse({
                source: 'ollama',
                summary: 'Ollama 리뷰 결과입니다.',
                detectedLanguage: detected.language,
                findings: await createOllamaFindings(code, language, reviewRequest),
            });
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : '알 수 없는 오류';

            return jsonResponse({
                source: 'local',
                summary: `Ollama 호출 실패로 로컬 리뷰로 대체했습니다. 원인: ${message}`,
                detectedLanguage: detected.language,
                findings: createLocalReview(code, language),
            });
        }
    }

    return jsonResponse({
        source: 'local',
        summary: '로컬 휴리스틱 리뷰 결과입니다.',
        detectedLanguage: detected.language,
        findings: createLocalReview(code, language),
    });
}
