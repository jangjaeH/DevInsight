'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, Form, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { FileSearchOutlined, ThunderboltOutlined } from '@ant-design/icons';

type Finding = {
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    line?: number;
};

type ReviewResponse = {
    source: 'local' | 'ollama';
    summary: string;
    detectedLanguage?: string;
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

const severityLabel = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

const lineBackground = {
    high: '#fff1f0',
    medium: '#fff7e6',
    low: '#e6f4ff',
};

const lineBorder = {
    high: '#ff4d4f',
    medium: '#faad14',
    low: '#1677ff',
};

const sampleCode = `async function saveToken(token: string) {
  console.log('token', token);
  localStorage.setItem('token', token);
}`;

function CodePreview({ code, findings }: { code: string; findings: Finding[] }) {
    const lines = code.split(/\r?\n/);
    const findingByLine = new Map<number, Finding>();

    findings.forEach((finding) => {
        if (!finding.line) return;
        const current = findingByLine.get(finding.line);
        if (!current || finding.severity === 'high' || (finding.severity === 'medium' && current.severity === 'low')) {
            findingByLine.set(finding.line, finding);
        }
    });

    return (
        <div
            style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
                fontFamily: 'var(--font-mono), Consolas, monospace',
                fontSize: 13,
            }}
        >
            {lines.map((line, index) => {
                const lineNumber = index + 1;
                const finding = findingByLine.get(lineNumber);

                return (
                    <div
                        key={`${lineNumber}-${line}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '48px 1fr',
                            background: finding ? lineBackground[finding.severity] : '#fff',
                            borderLeft: finding ? `4px solid ${lineBorder[finding.severity]}` : '4px solid transparent',
                            minHeight: 28,
                        }}
                    >
                        <span
                            style={{
                                padding: '4px 8px',
                                color: '#8c8c8c',
                                background: finding ? 'rgba(255,255,255,0.45)' : '#fafafa',
                                textAlign: 'right',
                                userSelect: 'none',
                            }}
                        >
                            {lineNumber}
                        </span>
                        <span style={{ padding: '4px 10px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {line || ' '}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Review() {
    const [form] = Form.useForm<ReviewFormValues>();
    const [result, setResult] = useState<ReviewResponse | null>(null);
    const [reviewedCode, setReviewedCode] = useState(sampleCode);
    const [warning, setWarning] = useState<string | null>(null);
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
        setWarning(null);
        setReviewedCode(values.code);

        try {
            const res = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (!res.ok) {
                setResult(null);
                setWarning(data.message || '리뷰 요청에 실패했습니다.');
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
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Card title="Review Target" styles={{ body: { paddingBottom: 12 } }}>
                            <Form
                                form={form}
                                layout="vertical"
                                initialValues={{ language: 'TypeScript', code: sampleCode, useOllama: true }}
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
                                        rows={14}
                                        spellCheck={false}
                                        style={{ fontFamily: 'var(--font-mono), Consolas, monospace' }}
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

                        {result ? (
                            <Card title="Highlighted Lines" style={{ marginTop: 16 }}>
                                <CodePreview code={reviewedCode} findings={result.findings} />
                            </Card>
                        ) : null}
                    </Col>
                    <Col xs={24} lg={10}>
                        <Card
                            title="Review Result"
                            extra={result ? <Tag>{result.source.toUpperCase()}</Tag> : null}
                            style={{ minHeight: 520 }}
                        >
                            {warning ? (
                                <Alert type="warning" showIcon message={warning} />
                            ) : !result ? (
                                <Space direction="vertical" align="center" style={{ width: '100%', paddingTop: 120 }}>
                                    <FileSearchOutlined style={{ fontSize: 42, color: '#8c8c8c' }} />
                                    <Typography.Text type="secondary">리뷰를 실행하면 결과가 여기에 표시됩니다.</Typography.Text>
                                </Space>
                            ) : (
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    <Alert type="info" showIcon message={result.summary} />
                                    <Space wrap>
                                        {result.detectedLanguage ? <Tag>Detected {result.detectedLanguage}</Tag> : null}
                                        <Tag color="red">High {counts.high}</Tag>
                                        <Tag color="orange">Medium {counts.medium}</Tag>
                                        <Tag color="blue">Low {counts.low}</Tag>
                                    </Space>
                                    {result.findings.map((finding, index) => (
                                        <Card key={`${finding.title}-${index}`} size="small">
                                            <Space direction="vertical" size={6}>
                                                <Space wrap>
                                                    <Tag color={severityColor[finding.severity]}>
                                                        {severityLabel[finding.severity]}
                                                    </Tag>
                                                    {finding.line ? <Tag>Line {finding.line}</Tag> : null}
                                                </Space>
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
