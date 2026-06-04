import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons';

const recentReviews = [
    { name: 'login/page.tsx', score: 72, status: 'needs review', severity: 'medium' },
    { name: 'api/login/route.ts', score: 81, status: 'pass', severity: 'low' },
    { name: 'layout/AntdLayout.tsx', score: 88, status: 'pass', severity: 'low' },
];

export default function Dashboard() {
    return (
        <main style={{ padding: 24 }}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 4 }}>
                        Dashboard
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        리뷰 현황, 위험도, 품질 게이트를 한 화면에서 확인합니다.
                    </Typography.Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card>
                            <Statistic title="Reviewed Files" value={12} prefix={<FileSearchOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card>
                            <Statistic title="Open Findings" value={5} prefix={<ExclamationCircleOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card>
                            <Statistic title="Passed Gates" value={8} prefix={<CheckCircleOutlined />} />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={10}>
                        <Card title="Quality Score">
                            <Progress type="dashboard" percent={78} strokeColor="#1677ff" />
                            <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
                                최근 리뷰 기준 평균 점수입니다. 중간 위험도 이상 항목이 줄면 점수가 상승합니다.
                            </Typography.Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} lg={14}>
                        <Card title="Recent Reviews">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {recentReviews.map((review) => (
                                    <Card key={review.name} size="small">
                                        <Row align="middle" gutter={[12, 12]}>
                                            <Col flex="auto">
                                                <Typography.Text strong>{review.name}</Typography.Text>
                                                <div>
                                                    <Typography.Text type="secondary">{review.status}</Typography.Text>
                                                </div>
                                            </Col>
                                            <Col>
                                                <Tag color={review.severity === 'medium' ? 'orange' : 'blue'}>
                                                    {review.severity}
                                                </Tag>
                                            </Col>
                                            <Col style={{ width: 120 }}>
                                                <Progress percent={review.score} size="small" />
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </main>
    );
}
