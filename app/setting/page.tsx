import { Card, Descriptions, Space, Switch, Tag, Typography } from 'antd';

export default function Setting() {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'codellama';

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

                <Card title="AI Review Engine">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Ollama URL">{ollamaUrl}</Descriptions.Item>
                        <Descriptions.Item label="Model">{ollamaModel}</Descriptions.Item>
                        <Descriptions.Item label="Fallback">
                            <Tag color="blue">Local heuristic review</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Switch checked checkedChildren="Ready" unCheckedChildren="Off" disabled />
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card title="Review Rules">
                    <Space wrap>
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
