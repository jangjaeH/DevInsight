import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd';

type OllamaStatus = {
    ok: boolean;
    url: string;
    model: string;
    models: string[];
    hasConfiguredModel?: boolean;
    message?: string;
};

async function getOllamaStatus(): Promise<OllamaStatus> {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'codellama';

    try {
        const response = await fetch(`${url}/api/tags`, { cache: 'no-store' });
        if (!response.ok) {
            return { ok: false, url, model, models: [], message: `Ollama responded with ${response.status}.` };
        }

        const data = await response.json() as { models?: Array<{ name?: string }> };
        const models = data.models?.map((item) => item.name).filter((name): name is string => Boolean(name)) || [];

        return {
            ok: true,
            url,
            model,
            models,
            hasConfiguredModel: models.some((name) => name === model || name.startsWith(`${model}:`)),
        };
    } catch {
        return { ok: false, url, model, models: [], message: 'Ollama server is not reachable.' };
    }
}

export default async function Setting() {
    const status = await getOllamaStatus();

    return (
        <main style={{ padding: 24 }}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Setting
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        현재 서버 환경 기준의 리뷰 엔진 설정입니다.
                    </Typography.Text>
                </div>

                {!status.ok ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Ollama is not connected"
                        description="Ollama가 실행 중이 아니거나 OLLAMA_URL 설정에 연결할 수 없습니다. 리뷰는 로컬 휴리스틱으로 대체됩니다."
                    />
                ) : !status.hasConfiguredModel ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Configured model is not installed"
                        description={`Ollama는 연결됐지만 ${status.model} 모델을 찾지 못했습니다.`}
                    />
                ) : (
                    <Alert type="success" showIcon message="Ollama is ready" />
                )}

                <Card title="AI Review Engine">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Ollama URL">{status.url}</Descriptions.Item>
                        <Descriptions.Item label="Configured Model">{status.model}</Descriptions.Item>
                        <Descriptions.Item label="Connection">
                            <Tag color={status.ok ? 'green' : 'orange'}>{status.ok ? 'Connected' : 'Fallback'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Installed Models">
                            {status.models.length > 0 ? (
                                <Space wrap>
                                    {status.models.map((model) => (
                                        <Tag key={model}>{model}</Tag>
                                    ))}
                                </Space>
                            ) : (
                                <Typography.Text type="secondary">No models detected</Typography.Text>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card title="Review Rules">
                    <Space wrap>
                        <Tag>Language mismatch guard</Tag>
                        <Tag>Security exposure</Tag>
                        <Tag>Type safety</Tag>
                        <Tag>Async handling</Tag>
                        <Tag>Debug logs</Tag>
                        <Tag>Maintainability</Tag>
                    </Space>
                </Card>
            </Space>
        </main>
    );
}
