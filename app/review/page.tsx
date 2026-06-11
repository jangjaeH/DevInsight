'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, Empty, Form, Input, Radio, Row, Select, Space, Tag, Typography, Upload } from 'antd';
import { FileSearchOutlined, ThunderboltOutlined, UploadOutlined } from '@ant-design/icons';
import { getLanguageFromFileName } from '@/lib/reviewLanguage';

type Finding = {
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    line?: number;
};

type ReviewResponse = {
    source: 'local' | 'ollama';
    summary: string;
    warning?: string;
    detectedLanguage?: string;
    findings: Finding[];
    reviewId?: number;
};

type ReviewFormValues = {
    language: string;
    code?: string;
    reviewRequest?: string;
    useOllama?: boolean;
    targetName?: string;
};

type ReviewMode = 'upload' | 'manual';

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

const sampleCode = `type ReviewPayload = {
  code: string;
  language: string;
};

async function requestReview(payload: ReviewPayload) {
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Review request failed.');
  }

  return response.json();
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
    const [reviewedCode, setReviewedCode] = useState('');
    const [warning, setWarning] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [reviewMode, setReviewMode] = useState<ReviewMode>('upload');

    const counts = useMemo(() => {
        return {
            high: result?.findings.filter((item) => item.severity === 'high').length || 0,
            medium: result?.findings.filter((item) => item.severity === 'medium').length || 0,
            low: result?.findings.filter((item) => item.severity === 'low').length || 0,
        };
    }, [result]);

    const onFinish = async (values: ReviewFormValues) => {
        const code = values.code?.trim() || '';

        if (!code) {
            setResult(null);
            setWarning(reviewMode === 'upload' ? '리뷰할 코드 파일을 업로드하세요.' : '수동 입력 코드를 작성하세요.');
            return;
        }

        setLoading(true);
        setWarning(null);
        setReviewedCode(code);

        try {
            const res = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    ...values,
                    code,
                    targetName: reviewMode === 'upload' ? values.targetName : values.targetName || 'Manual input',
                }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setResult(null);
                setWarning(data?.message || '리뷰 요청에 실패했습니다.');
                return;
            }

            setResult(data);
        } catch {
            setResult(null);
            setWarning('리뷰 요청 중 오류가 발생했습니다. 네트워크 또는 서버 상태를 확인해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: 24 }}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Code Review
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        코드 파일을 업로드해 리뷰를 실행하고, 필요할 때만 수동 입력으로 보조합니다.
                    </Typography.Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Card title="Review Target" styles={{ body: { paddingBottom: 12 } }}>
                            <Form
                                form={form}
                                layout="vertical"
                                initialValues={{ language: 'TypeScript', code: '', useOllama: true }}
                                onFinish={onFinish}
                            >
                                <Form.Item label="Review Mode">
                                    <Radio.Group
                                        value={reviewMode}
                                        optionType="button"
                                        buttonStyle="solid"
                                        onChange={(event) => {
                                            const mode = event.target.value as ReviewMode;
                                            setReviewMode(mode);
                                            setResult(null);
                                            setWarning(null);

                                            if (mode === 'upload') {
                                                form.setFieldsValue({ code: '', targetName: undefined });
                                                setUploadedFileName(null);
                                            } else {
                                                form.setFieldsValue({ code: '', targetName: 'Manual input' });
                                            }
                                        }}
                                        options={[
                                            { label: 'File Upload', value: 'upload' },
                                            { label: 'Manual Input', value: 'manual' },
                                        ]}
                                    />
                                </Form.Item>
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
                                {reviewMode === 'upload' ? (
                                    <Form.Item label="Code File" required>
                                        <Upload.Dragger
                                            accept=".ts,.tsx,.js,.jsx,.java,.py,.txt"
                                            maxCount={1}
                                            showUploadList={uploadedFileName ? { showRemoveIcon: true } : false}
                                            beforeUpload={(file) => {
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    const code = typeof reader.result === 'string' ? reader.result : '';
                                                    const language = getLanguageFromFileName(file.name);

                                                    form.setFieldsValue({
                                                        code,
                                                        targetName: file.name,
                                                        ...(language ? { language } : {}),
                                                    });
                                                    setUploadedFileName(file.name);
                                                    setWarning(null);
                                                };
                                                reader.readAsText(file);
                                                return false;
                                            }}
                                            onRemove={() => {
                                                setUploadedFileName(null);
                                                form.setFieldsValue({ code: '', targetName: undefined });
                                            }}
                                        >
                                            <p style={{ marginBottom: 8 }}>
                                                <UploadOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                                            </p>
                                            <Typography.Text strong>코드 파일을 업로드하세요</Typography.Text>
                                            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                                                TypeScript, JavaScript, Java, Python, txt 파일을 지원합니다.
                                            </Typography.Text>
                                        </Upload.Dragger>
                                        {uploadedFileName ? (
                                            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                선택된 파일: {uploadedFileName}
                                            </Typography.Text>
                                        ) : null}
                                    </Form.Item>
                                ) : null}
                                <Form.Item name="targetName" hidden>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="code" hidden={reviewMode === 'upload'}>
                                    <Input.TextArea
                                        rows={reviewMode === 'upload' ? 1 : 14}
                                        spellCheck={false}
                                        placeholder={sampleCode}
                                        style={{ fontFamily: 'var(--font-mono), Consolas, monospace' }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Review Request"
                                    name="reviewRequest"
                                    tooltip="비워 두면 기본 리뷰 기준만 적용합니다."
                                >
                                    <Input.TextArea
                                        rows={3}
                                        maxLength={1200}
                                        showCount
                                        placeholder="예: 보안 위주로 봐줘, 성능 병목만 확인해줘, React 상태 관리 관점에서 리뷰해줘"
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
                                <Alert type="warning" showIcon title={warning} />
                            ) : !result ? (
                                <Empty
                                    image={<FileSearchOutlined style={{ fontSize: 42, color: '#8c8c8c' }} />}
                                    description="리뷰를 실행하면 결과가 여기에 표시됩니다."
                                    style={{ paddingTop: 120 }}
                                />
                            ) : (
                                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                                    {result.warning ? <Alert type="warning" showIcon title={result.warning} /> : null}
                                    <Alert type="info" showIcon title={result.summary} />
                                    <Space wrap>
                                        {result.reviewId ? <Tag color="green">Saved #{result.reviewId}</Tag> : null}
                                        {result.detectedLanguage ? <Tag>Detected {result.detectedLanguage}</Tag> : null}
                                        <Tag color="red">High {counts.high}</Tag>
                                        <Tag color="orange">Medium {counts.medium}</Tag>
                                        <Tag color="blue">Low {counts.low}</Tag>
                                    </Space>
                                    {result.findings.map((finding, index) => (
                                        <Card key={`${finding.severity}-${finding.line || 'global'}-${finding.title}-${index}`} size="small">
                                            <Space orientation="vertical" size={6}>
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
