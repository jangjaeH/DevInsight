'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Empty,
    Flex,
    Progress,
    Row,
    Space,
    Spin,
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

type ReviewStatus = 'pass' | 'watch' | 'action';

type ReviewItem = {
    id: number;
    targetName: string;
    language: string;
    detectedLanguage?: string;
    source: string;
    lineCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    score: number;
    status: ReviewStatus;
    createdAt: string;
};

type ReviewDashboardResponse = {
    stats: {
        totalReviews: number;
        averageScore: number;
        highTotal: number;
        mediumTotal: number;
        lowTotal: number;
        passCount: number;
        actionCount: number;
    };
    recentReviews: ReviewItem[];
};

const emptyDashboard: ReviewDashboardResponse = {
    stats: {
        totalReviews: 0,
        averageScore: 0,
        highTotal: 0,
        mediumTotal: 0,
        lowTotal: 0,
        passCount: 0,
        actionCount: 0,
    },
    recentReviews: [],
};

const statusLabel = {
    pass: { text: '통과', color: 'green' },
    watch: { text: '관찰', color: 'blue' },
    action: { text: '조치 필요', color: 'orange' },
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function Home() {
    const [data, setData] = useState<ReviewDashboardResponse>(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReviews = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/reviews', { cache: 'no-store' });
                const payload = await response.json();

                if (!response.ok) {
                    setError(payload.message || '리뷰 이력을 조회하지 못했습니다.');
                    return;
                }

                setData(payload);
            } catch {
                setError('리뷰 이력 조회 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, []);

    const summaryCards = useMemo(() => [
        {
            title: '전체 리뷰',
            value: data.stats.totalReviews,
            suffix: '건',
            icon: <FileSearchOutlined />,
            color: '#1677ff',
        },
        {
            title: '평균 점수',
            value: data.stats.averageScore,
            suffix: '점',
            icon: <CheckCircleOutlined />,
            color: '#52c41a',
        },
        {
            title: '조치 필요',
            value: data.stats.actionCount,
            suffix: '건',
            icon: <ThunderboltOutlined />,
            color: '#faad14',
        },
    ], [data]);

    const columns: ColumnsType<ReviewItem> = [
        {
            title: '대상',
            dataIndex: 'targetName',
            key: 'targetName',
            render: (targetName: string, row) => (
                <Space orientation="vertical" size={0}>
                    <Typography.Text strong>{targetName}</Typography.Text>
                    <Typography.Text type="secondary">
                        {row.language} / {row.source.toUpperCase()} / {row.lineCount} lines
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: '품질 점수',
            dataIndex: 'score',
            key: 'score',
            width: 180,
            render: (score: number) => (
                <Progress
                    percent={score}
                    size="small"
                    strokeColor={score >= 90 ? '#52c41a' : score >= 75 ? '#1677ff' : '#faad14'}
                />
            ),
        },
        {
            title: '이슈',
            key: 'findings',
            width: 140,
            render: (_, row) => (
                <Space size={4} wrap>
                    <Tag color={row.highCount > 0 ? 'red' : 'default'}>H {row.highCount}</Tag>
                    <Tag color={row.mediumCount > 0 ? 'orange' : 'default'}>M {row.mediumCount}</Tag>
                    <Tag color={row.lowCount > 0 ? 'blue' : 'default'}>L {row.lowCount}</Tag>
                </Space>
            ),
        },
        {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: ReviewStatus) => <Tag color={statusLabel[status].color}>{statusLabel[status].text}</Tag>,
        },
        {
            title: '업데이트',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 130,
            render: formatDate,
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <div>
                        <Typography.Title level={2} style={{ marginBottom: 4 }}>
                            DevInsight Home
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            저장된 코드 리뷰 이력과 품질 상태를 한 화면에서 확인합니다.
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

                {error ? <Alert type="error" showIcon title={error} /> : null}

                <Row gutter={[16, 16]}>
                    {summaryCards.map((item) => (
                        <Col xs={24} md={8} key={item.title}>
                            <Card>
                                <Statistic
                                    title={item.title}
                                    value={item.value}
                                    suffix={item.suffix}
                                    prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                                    loading={loading}
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
                            <Spin spinning={loading}>
                                {data.recentReviews.length > 0 ? (
                                    <Table
                                        columns={columns}
                                        dataSource={data.recentReviews}
                                        rowKey="id"
                                        pagination={false}
                                        size="middle"
                                        scroll={{ x: 760 }}
                                    />
                                ) : (
                                    <Empty description="저장된 리뷰 이력이 없습니다." />
                                )}
                            </Spin>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                            <Card title="운영 상태">
                                <Space orientation="vertical" size={14} style={{ width: '100%' }}>
                                    <Flex justify="space-between" align="center">
                                        <Typography.Text>Review history DB</Typography.Text>
                                        <Badge status={error ? 'error' : 'success'} text={error ? '확인 필요' : '정상'} />
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Typography.Text>Stored reviews</Typography.Text>
                                        <Badge status={data.stats.totalReviews > 0 ? 'processing' : 'default'} text={`${data.stats.totalReviews}건`} />
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Typography.Text>High findings</Typography.Text>
                                        <Badge status={data.stats.highTotal > 0 ? 'warning' : 'success'} text={`${data.stats.highTotal}건`} />
                                    </Flex>
                                </Space>
                            </Card>
                            <Card title="다음 작업">
                                <Space orientation="vertical" size={12}>
                                    <Typography.Text>1. 코드 입력 또는 파일 업로드로 리뷰를 실행합니다.</Typography.Text>
                                    <Typography.Text>2. 저장된 결과는 Home/Dashboard에 자동 반영됩니다.</Typography.Text>
                                    <Typography.Text>3. High/Medium 항목을 우선 조치합니다.</Typography.Text>
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
