import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button, Card, Col, Row, Space, Steps, Typography } from 'antd';
import Link from 'next/link';
import { BarChartOutlined, ClusterOutlined, SettingOutlined } from '@ant-design/icons';

export default async function Home() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) {
        redirect('/login');
    }

    return (
        <main style={{ padding: 24 }}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <section>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        DevInsight
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        로컬 AI와 정적 분석을 결합해 코드 리뷰 결과를 빠르게 정리합니다.
                    </Typography.Text>
                </section>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                        <Card title="Run Review" extra={<ClusterOutlined />}>
                            <Typography.Paragraph type="secondary">
                                코드 조각을 붙여 넣고 위험도, 타입 안정성, 보안 노출 가능성을 확인합니다.
                            </Typography.Paragraph>
                            <Link href="/review">
                                <Button type="primary">Open Review</Button>
                            </Link>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Track Quality" extra={<BarChartOutlined />}>
                            <Typography.Paragraph type="secondary">
                                리뷰 점수와 발견 항목을 대시보드에서 확인하고 개선 흐름을 봅니다.
                            </Typography.Paragraph>
                            <Link href="/dashboard">
                                <Button>Open Dashboard</Button>
                            </Link>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Configure AI" extra={<SettingOutlined />}>
                            <Typography.Paragraph type="secondary">
                                Ollama URL, 모델명, 리뷰 기준 등 운영 설정을 정리합니다.
                            </Typography.Paragraph>
                            <Link href="/setting">
                                <Button>Open Settings</Button>
                            </Link>
                        </Card>
                    </Col>
                </Row>

                <Card title="Workflow">
                    <Steps
                        current={1}
                        items={[
                            { title: 'Input', description: '분석할 코드를 선택합니다.' },
                            { title: 'Review', description: '로컬 규칙 또는 Ollama로 리뷰합니다.' },
                            { title: 'Act', description: '위험 항목을 수정하고 다시 검증합니다.' },
                        ]}
                    />
                </Card>
            </Space>
        </main>
    );
}
