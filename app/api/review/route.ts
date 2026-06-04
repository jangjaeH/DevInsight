import { NextResponse } from 'next/server';

type ReviewRequest = {
    code?: string;
    language?: string;
    useOllama?: boolean;
};

type ReviewFinding = {
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
};

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'codellama';

function createLocalReview(code: string, language: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const lines = code.split(/\r?\n/);

    if (code.length < 20) {
        findings.push({
            severity: 'low',
            title: '분석할 코드가 짧습니다',
            detail: '실제 리뷰 품질을 높이려면 함수 또는 파일 단위 코드를 입력하세요.',
        });
    }

    if (/console\.log\(/.test(code)) {
        findings.push({
            severity: 'low',
            title: '디버그 로그가 남아 있습니다',
            detail: '운영 코드라면 console.log 대신 로깅 정책에 맞는 logger를 사용하거나 제거하세요.',
        });
    }

    if (/\bany\b/.test(code)) {
        findings.push({
            severity: 'medium',
            title: '느슨한 타입 사용',
            detail: 'any는 타입 안정성을 크게 낮춥니다. 요청/응답 타입 또는 제네릭 타입으로 구체화하세요.',
        });
    }

    if (/password|secret|token/i.test(code) && /(console\.log|localStorage|sessionStorage)/.test(code)) {
        findings.push({
            severity: 'high',
            title: '민감 정보 노출 가능성',
            detail: '비밀번호, 시크릿, 토큰은 로그나 브라우저 저장소에 직접 남기지 않는 것이 안전합니다.',
        });
    }

    if (lines.some((line) => line.length > 120)) {
        findings.push({
            severity: 'low',
            title: '긴 라인이 있습니다',
            detail: '120자를 넘는 라인은 리뷰와 유지보수성이 떨어질 수 있어 적절히 분리하는 것이 좋습니다.',
        });
    }

    if (/(fetch|axios|query|create|update|delete)\(/.test(code) && !/\b(await|then|catch)\b/.test(code)) {
        findings.push({
            severity: 'medium',
            title: '비동기 처리 확인 필요',
            detail: '네트워크 또는 DB 호출은 await/then/catch와 오류 처리가 있는지 확인하세요.',
        });
    }

    if (language.toLowerCase().includes('typescript') && !/type |interface /.test(code)) {
        findings.push({
            severity: 'low',
            title: '명시적 타입이 부족합니다',
            detail: '입출력 객체와 주요 상태에 타입을 붙이면 변경 중 오류를 더 빨리 잡을 수 있습니다.',
        });
    }

    if (findings.length === 0) {
        findings.push({
            severity: 'low',
            title: '큰 위험 신호는 없습니다',
            detail: '자동 휴리스틱 기준으로는 즉시 보이는 문제를 찾지 못했습니다. 실제 실행 경로와 테스트는 별도로 확인하세요.',
        });
    }

    return findings;
}

async function createOllamaReview(code: string, language: string) {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            prompt: [
                'You are a senior code reviewer. Reply in Korean.',
                'Focus on bugs, security, maintainability, and missing tests.',
                `Language: ${language}`,
                'Code:',
                code,
            ].join('\n'),
        }),
    });

    if (!response.ok) {
        throw new Error('Ollama request failed.');
    }

    const data = await response.json() as { response?: string };
    return data.response || '';
}

export async function POST(req: Request) {
    const body = (await req.json()) as ReviewRequest;
    const code = body.code?.trim() || '';
    const language = body.language || 'TypeScript';

    if (!code) {
        return NextResponse.json({ message: '리뷰할 코드를 입력하세요.' }, { status: 400 });
    }

    if (body.useOllama) {
        try {
            const summary = await createOllamaReview(code, language);
            return NextResponse.json({
                source: 'ollama',
                summary,
                findings: createLocalReview(code, language),
            });
        } catch (err) {
            console.error(err);
            return NextResponse.json({
                source: 'local',
                summary: 'Ollama 연결에 실패해 로컬 휴리스틱 리뷰로 대체했습니다.',
                findings: createLocalReview(code, language),
            });
        }
    }

    return NextResponse.json({
        source: 'local',
        summary: '로컬 휴리스틱 기준으로 리뷰했습니다.',
        findings: createLocalReview(code, language),
    });
}
