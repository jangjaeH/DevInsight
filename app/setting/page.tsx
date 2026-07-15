'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

type OllamaStatus = {
    ok: boolean;
    url: string;
    model: string;
    models: string[];
    hasConfiguredModel?: boolean;
    message?: string;
};

const initialStatus: OllamaStatus = {
    ok: false,
    url: '-',
    model: '-',
    models: [],
    message: '상태를 확인하는 중입니다.',
};

export default function Setting() {
    const [status, setStatus] = useState<OllamaStatus>(initialStatus);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStatus = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ollama/status', { cache: 'no-store' });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Ollama 상태를 확인하지 못했습니다.');
                return;
            }

            setStatus(data);
        } catch {
            setError('Ollama 상태 조회 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    return (
        <main style={{ padding: 24 }}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Settings
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        현재 서버 환경 기준의 코드 리뷰 엔진 상태를 확인합니다.
                    </Typography.Text>
                </div>

                {error ? (
                    <Alert type="error" showIcon title={error} />
                ) : !status.ok ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Ollama is not connected"
                        description={status.message || 'Ollama가 실행 중이 아니거나 OLLAMA_URL 설정에 연결할 수 없습니다. 리뷰는 로컬 휴리스틱으로 대체됩니다.'}
                    />
                ) : !status.hasConfiguredModel ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Configured model is not installed"
                        description={`Ollama에는 연결되었지만 ${status.model} 모델을 찾지 못했습니다.`}
                    />
                ) : (
                    <Alert type="success" showIcon title="Ollama is ready" />
                )}

                <Card
                    title="AI Review Engine"
                    extra={
                        <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshStatus}>
                            Refresh
                        </Button>
                    }
                >
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
            </Space>
        </main>
    );
}
