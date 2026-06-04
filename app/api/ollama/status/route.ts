import { NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'codellama';

type OllamaTagsResponse = {
    models?: Array<{ name?: string }>;
};

export async function GET() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({
                ok: false,
                url: OLLAMA_URL,
                model: OLLAMA_MODEL,
                models: [],
                message: `Ollama server responded with ${response.status}.`,
            });
        }

        const data = await response.json() as OllamaTagsResponse;
        const models = data.models?.map((item) => item.name).filter(Boolean) || [];

        return NextResponse.json({
            ok: true,
            url: OLLAMA_URL,
            model: OLLAMA_MODEL,
            models,
            hasConfiguredModel: models.some((name) => name === OLLAMA_MODEL || name?.startsWith(`${OLLAMA_MODEL}:`)),
        });
    } catch {
        return NextResponse.json({
            ok: false,
            url: OLLAMA_URL,
            model: OLLAMA_MODEL,
            models: [],
            message: 'Ollama server is not reachable.',
        });
    }
}
