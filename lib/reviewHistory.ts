import crypto from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';

export type ReviewFindingRecord = {
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    line?: number;
};

export type SaveReviewHistoryInput = {
    targetName?: string;
    language: string;
    detectedLanguage?: string;
    source: string;
    reviewRequest?: string;
    code: string;
    findings: ReviewFindingRecord[];
};

export type ReviewHistoryItem = {
    id: number;
    targetName: string;
    language: string;
    detectedLanguage?: string;
    source: string;
    reviewRequest?: string;
    codePreview: string;
    lineCount: number;
    findings: ReviewFindingRecord[];
    highCount: number;
    mediumCount: number;
    lowCount: number;
    score: number;
    status: 'pass' | 'watch' | 'action';
    createdAt: string;
};

type ReviewHistoryRow = RowDataPacket & {
    id: number;
    target_name: string;
    language: string;
    detected_language: string | null;
    source: string;
    review_request: string | null;
    code_preview: string;
    line_count: number;
    findings_json: string;
    high_count: number;
    medium_count: number;
    low_count: number;
    score: number;
    created_at: Date;
};

type SummaryRow = RowDataPacket & {
    total_reviews: number;
    avg_score: number | null;
    high_total: number | null;
    medium_total: number | null;
    low_total: number | null;
    pass_count: number;
    action_count: number;
};

let tableReady: Promise<void> | null = null;

function normalizeTargetName(value?: string) {
    const target = value?.trim();
    return target ? target.slice(0, 255) : 'Manual input';
}

function countLines(code: string) {
    if (!code.trim()) {
        return 0;
    }

    return code.split(/\r?\n/).length;
}

function createCodePreview(code: string) {
    return code.trim().slice(0, 2000);
}

function createCodeHash(code: string) {
    return crypto.createHash('sha256').update(code).digest('hex');
}

function countFindings(findings: ReviewFindingRecord[]) {
    return findings.reduce(
        (acc, finding) => {
            if (finding.severity === 'high') {
                acc.highCount += 1;
            } else if (finding.severity === 'medium') {
                acc.mediumCount += 1;
            } else {
                acc.lowCount += 1;
            }

            return acc;
        },
        { highCount: 0, mediumCount: 0, lowCount: 0 }
    );
}

function calculateScore(highCount: number, mediumCount: number, lowCount: number) {
    return Math.max(0, 100 - highCount * 25 - mediumCount * 10 - lowCount * 3);
}

function getStatus(highCount: number, mediumCount: number): ReviewHistoryItem['status'] {
    if (highCount > 0) {
        return 'action';
    }

    if (mediumCount > 0) {
        return 'watch';
    }

    return 'pass';
}

function parseFindings(value: string): ReviewFindingRecord[] {
    try {
        const findings = JSON.parse(value);
        return Array.isArray(findings) ? findings : [];
    } catch {
        try {
            const decoded = Buffer.from(value, 'base64').toString('utf8');
            const findings = JSON.parse(decoded);
            return Array.isArray(findings) ? findings : [];
        } catch {
            return [];
        }
    }
}

function serializeFindings(findings: ReviewFindingRecord[]) {
    return Buffer.from(JSON.stringify(findings), 'utf8').toString('base64');
}

function mapHistoryRow(row: ReviewHistoryRow): ReviewHistoryItem {
    const findings = parseFindings(row.findings_json);

    return {
        id: row.id,
        targetName: row.target_name,
        language: row.language,
        detectedLanguage: row.detected_language || undefined,
        source: row.source,
        reviewRequest: row.review_request || undefined,
        codePreview: row.code_preview,
        lineCount: row.line_count,
        findings,
        highCount: row.high_count,
        mediumCount: row.medium_count,
        lowCount: row.low_count,
        score: row.score,
        status: getStatus(row.high_count, row.medium_count),
        createdAt: row.created_at.toISOString(),
    };
}

export async function ensureReviewHistoryTable() {
    if (!tableReady) {
        tableReady = db.query(`
            CREATE TABLE IF NOT EXISTS code_review_history (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                target_name VARCHAR(255) NOT NULL,
                language VARCHAR(32) NOT NULL,
                detected_language VARCHAR(32) NULL,
                source VARCHAR(20) NOT NULL,
                review_request TEXT NULL,
                code_preview TEXT NOT NULL,
                code_hash CHAR(64) NOT NULL,
                line_count INT NOT NULL DEFAULT 0,
                findings_json LONGTEXT NOT NULL,
                high_count INT NOT NULL DEFAULT 0,
                medium_count INT NOT NULL DEFAULT 0,
                low_count INT NOT NULL DEFAULT 0,
                score INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_code_review_history_created_at (created_at),
                INDEX idx_code_review_history_score (score),
                INDEX idx_code_review_history_language (language)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `).then(() => undefined);
        tableReady = tableReady.then(() => db.query(`
            ALTER TABLE code_review_history
            CONVERT TO CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `).then(() => undefined));
    }

    return tableReady;
}

export async function saveReviewHistory(input: SaveReviewHistoryInput) {
    await ensureReviewHistoryTable();

    const { highCount, mediumCount, lowCount } = countFindings(input.findings);
    const score = calculateScore(highCount, mediumCount, lowCount);
    const [result] = await db.query<ResultSetHeader>(
        `
            INSERT INTO code_review_history (
                target_name,
                language,
                detected_language,
                source,
                review_request,
                code_preview,
                code_hash,
                line_count,
                findings_json,
                high_count,
                medium_count,
                low_count,
                score
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            normalizeTargetName(input.targetName),
            input.language,
            input.detectedLanguage || null,
            input.source,
            input.reviewRequest?.trim() || null,
            createCodePreview(input.code),
            createCodeHash(input.code),
            countLines(input.code),
            serializeFindings(input.findings),
            highCount,
            mediumCount,
            lowCount,
            score,
        ]
    );

    return result.insertId;
}

export async function getReviewHistoryDashboard(limit = 8) {
    await ensureReviewHistoryTable();

    const [summaryRows] = await db.query<SummaryRow[]>(`
        SELECT
            COUNT(*) AS total_reviews,
            AVG(score) AS avg_score,
            SUM(high_count) AS high_total,
            SUM(medium_count) AS medium_total,
            SUM(low_count) AS low_total,
            SUM(CASE WHEN high_count = 0 AND medium_count = 0 THEN 1 ELSE 0 END) AS pass_count,
            SUM(CASE WHEN high_count > 0 THEN 1 ELSE 0 END) AS action_count
        FROM code_review_history
    `);

    const [recentRows] = await db.query<ReviewHistoryRow[]>(
        `
            SELECT
                id,
                target_name,
                language,
                detected_language,
                source,
                review_request,
                code_preview,
                line_count,
                findings_json,
                high_count,
                medium_count,
                low_count,
                score,
                created_at
            FROM code_review_history
            ORDER BY created_at DESC, id DESC
            LIMIT ?
        `,
        [limit]
    );

    const summary = summaryRows[0] || {
        total_reviews: 0,
        avg_score: null,
        high_total: null,
        medium_total: null,
        low_total: null,
        pass_count: 0,
        action_count: 0,
    };

    return {
        stats: {
            totalReviews: Number(summary.total_reviews || 0),
            averageScore: Math.round(Number(summary.avg_score || 0)),
            highTotal: Number(summary.high_total || 0),
            mediumTotal: Number(summary.medium_total || 0),
            lowTotal: Number(summary.low_total || 0),
            passCount: Number(summary.pass_count || 0),
            actionCount: Number(summary.action_count || 0),
        },
        recentReviews: recentRows.map(mapHistoryRow),
    };
}
