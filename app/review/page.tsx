'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, Form, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { FileSearchOutlined, ThunderboltOutlined } from '@ant-design/icons';

type Finding = {
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
};

type ReviewResponse = {
    source: 'local' | 'ollama';
    summary: string;
    findings: Finding[];
};

type ReviewFormValues = {
    language: string;
    code: string;
    useOllama?: boolean;
};

const severityColor = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
};

const sampleCode = `async function saveToken(token: any) {
  console.log('token', token);
  localStorage.setItem('token', token);
}`;

export default function Review() {
    const [form] = Form.useForm<ReviewFormValues>();
    const [result, setResult] = useState<ReviewResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const counts = useMemo(() => {
        return {
            high: result?.findings.filter((item) => item.severity === 'high').length || 0,
            medium: result?.findings.filter((item) => item.severity === 'medium').length || 0,
            low: result?.findings.filter((item) => item.severity === 'low').length || 0,
        };
    }, [result]);

    const onFinish = async (values: ReviewFormValues) => {
        setLoading(true);
        try {
            const res = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (!res.ok) {
                setResult({
                    source: 'local',
                    summary: data.message || '리뷰 요청에 실패했습니다.',
                    findings: [],
                });
                return;
            }

            setResult(data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: 24 }}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Code Review
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        코드를 붙여 넣고 로컬 휴리스틱 또는 Ollama 기반 리뷰를 실행합니다.
                    </Typography.Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Card title="Review Target" styles={{ body: { paddingBottom: 12 } }}>
                            <Form
                                form={form}
                                layout="vertical"
                                initialValues={{ language: 'TypeScript', code: sampleCode, useOllama: false }}
                                onFinish={onFinish}
                            >
                                <Form.Item label="Language" name="language">
                                    <Select
                                        options={[
                                            { value: 'TypeScript', label: 'TypeScript' },
                                            { value: 'JavaScript', label: 'JavaScript' },
                                            { value: 'Java', label: 'Java' },
                                            { value: 'Python', label: 'Python' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Code"
                                    name="code"
                                    rules={[{ required: true, message: '리뷰할 코드를 입력하세요.' }]}
                                >
                                    <Input.TextArea
                                        rows={18}
                                        spellCheck={false}
                                        style={{ fontFamily: 'var(--font-geist-mono), Consolas, monospace' }}
                                    />
                                </Form.Item>
                                <Form.Item name="useOllama" valuePropName="checked">
                                    <Checkbox>Use Ollama when available</Checkbox>
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<ThunderboltOutlined />} loading={loading}>
                                    Run Review
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                        <Card
                            title="Review Result"
                            extra={result ? <Tag>{result.source.toUpperCase()}</Tag> : null}
                            style={{ minHeight: 520 }}
                        >
                            {!result ? (
                                <Space direction="vertical" align="center" style={{ width: '100%', paddingTop: 120 }}>
                                    <FileSearchOutlined style={{ fontSize: 42, color: '#8c8c8c' }} />
                                    <Typography.Text type="secondary">리뷰를 실행하면 결과가 여기에 표시됩니다.</Typography.Text>
                                </Space>
                            ) : (
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    <Typography.Paragraph>{result.summary}</Typography.Paragraph>
                                    <Space wrap>
                                        <Tag color="red">High {counts.high}</Tag>
                                        <Tag color="orange">Medium {counts.medium}</Tag>
                                        <Tag color="blue">Low {counts.low}</Tag>
                                    </Space>
                                    {result.findings.map((finding, index) => (
                                        <Card key={`${finding.title}-${index}`} size="small">
                                            <Space direction="vertical" size={4}>
                                                <Tag color={severityColor[finding.severity]}>
                                                    {finding.severity.toUpperCase()}
                                                </Tag>
                                                <Typography.Text strong>{finding.title}</Typography.Text>
                                                <Typography.Text type="secondary">{finding.detail}</Typography.Text>
                                            </Space>
                                        </Card>
                                    ))}
                                </Space>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Space>
        </main>
    );
}
