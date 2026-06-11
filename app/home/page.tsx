'use client';

import Link from 'next/link';
import {
    Badge,
    Button,
    Card,
    Col,
    Flex,
    Progress,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    BarChartOutlined,
    CheckCircleOutlined,
    ClusterOutlined,
    FileSearchOutlined,
    RocketOutlined,
    SettingOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

type ReviewRow = {
    key: string;
    target: string;
    language: string;
    score: number;
    findings: number;
    status: 'pass' | 'watch' | 'action';
    updatedAt: string;
};

const summaryCards = [
    { title: '오늘 리뷰', value: 18, suffix: '건', icon: <FileSearchOutlined />, color: '#1677ff' },
    { title: '통과율', value: 82, suffix: '%', icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '조치 필요', value: 5, suffix: '건', icon: <ThunderboltOutlined />, color: '#faad14' },
];

const recentReviews: ReviewRow[] = [
    {
        key: 'review-api',
        target: 'app/api/review/route.ts',
        language: 'TypeScript',
        score: 86,
        findings: 2,
        status: 'watch',
        updatedAt: '오늘 13:20',
    },
    {
        key: 'login-api',
        target: 'app/api/login/route.ts',
        language: 'TypeScript',
        score: 91,
        findings: 1,
        status: 'pass',
        updatedAt: '오늘 12:45',
    },
    {
        key: 'mes-work-order',
        target: 'MPS010Service.saveMesWorkOrder',
        language: 'Java',
        score: 74,
        findings: 4,
        status: 'action',
        updatedAt: '어제 18:10',
    },
];

const healthItems = [
    { label: 'Local rules', status: '정상', badge: 'success' as const },
    { label: 'Ollama fallback', status: '대기', badge: 'processing' as const },
    { label: 'Review queue', status: '3건', badge: 'warning' as const },
];

const statusLabel = {
    pass: { text: '통과', color: 'green' },
    watch: { text: '관찰', color: 'blue' },
    action: { text: '조치 필요', color: 'orange' },
};

const recentReviewColumns: ColumnsType<ReviewRow> = [
    {
        title: '대상',
        dataIndex: 'target',
        key: 'target',
        render: (target: string, row) => (
            <Space orientation="vertical" size={0}>
                <Typography.Text strong>{target}</Typography.Text>
                <Typography.Text type="secondary">{row.language}</Typography.Text>
            </Space>
        ),
    },
    {
        title: '품질 점수',
        dataIndex: 'score',
        key: 'score',
        width: 180,
        render: (score: number) => <Progress percent={score} size="small" strokeColor={score >= 85 ? '#52c41a' : '#1677ff'} />,
    },
    {
        title: '이슈',
        dataIndex: 'findings',
        key: 'findings',
        width: 90,
        render: (findings: number) => <Tag color={findings > 3 ? 'orange' : 'blue'}>{findings}건</Tag>,
    },
    {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: ReviewRow['status']) => <Tag color={statusLabel[status].color}>{statusLabel[status].text}</Tag>,
    },
    {
        title: '업데이트',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
    },
];

export default function Home() {
    return (
        <main style={{ padding: 24 }}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <div>
                        <Typography.Title level={2} style={{ marginBottom: 4 }}>
                            DevInsight Home
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            코드 리뷰 실행, 품질 추적, AI 설정 상태를 한 화면에서 확인하는 작업 허브입니다.
                        </Typography.Text>
                    </div>
                    <Space wrap>
                        <Link href="/review">
                            <Button type="primary" icon={<ClusterOutlined />}>
                                리뷰 실행
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button icon={<BarChartOutlined />}>대시보드</Button>
                        </Link>
                    </Space>
                </Flex>

                <Row gutter={[16, 16]}>
                    {summaryCards.map((item) => (
                        <Col xs={24} md={8} key={item.title}>
                            <Card>
                                <Statistic
                                    title={item.title}
                                    value={item.value}
                                    suffix={item.suffix}
                                    prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={16}>
                        <Card
                            title="최근 리뷰"
                            extra={
                                <Link href="/review">
                                    <Button type="link" icon={<RocketOutlined />}>
                                        새 리뷰
                                    </Button>
                                </Link>
                            }
                        >
                            <Table
                                columns={recentReviewColumns}
                                dataSource={recentReviews}
                                pagination={false}
                                size="middle"
                                scroll={{ x: 720 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                            <Card title="운영 상태">
                                <Space orientation="vertical" size={14} style={{ width: '100%' }}>
                                    {healthItems.map((item) => (
                                        <Flex key={item.label} justify="space-between" align="center">
                                            <Typography.Text>{item.label}</Typography.Text>
                                            <Badge status={item.badge} text={item.status} />
                                        </Flex>
                                    ))}
                                </Space>
                            </Card>
                            <Card title="다음 작업">
                                <Space orientation="vertical" size={12}>
                                    <Typography.Text>1. 리뷰 대상 코드를 붙여넣고 언어를 확인합니다.</Typography.Text>
                                    <Typography.Text>2. High/Medium 항목을 우선 조치합니다.</Typography.Text>
                                    <Typography.Text>3. 설정 화면에서 Ollama 연결 상태를 점검합니다.</Typography.Text>
                                </Space>
                                <Link href="/setting">
                                    <Button style={{ marginTop: 16 }} icon={<SettingOutlined />}>
                                        설정 확인
                                    </Button>
                                </Link>
                            </Card>
                        </Space>
                    </Col>
                </Row>
            </Space>
        </main>
    );
}
