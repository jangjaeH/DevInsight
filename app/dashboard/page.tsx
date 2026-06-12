'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
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
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    FileSearchOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';

type ReviewStatus = 'pass' | 'watch' | 'action';

type ReviewItem = {
    id: number;
    targetName: string;
    language: string;
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

const statusMeta = {
    pass: { label: '통과', color: 'green', badge: 'success' as const },
    watch: { label: '관찰', color: 'blue', badge: 'processing' as const },
    action: { label: '조치 필요', color: 'orange', badge: 'warning' as const },
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function Dashboard() {
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
                    setError(payload.message || '리뷰 집계를 조회하지 못했습니다.');
                    return;
                }

                setData(payload);
            } catch {
                setError('리뷰 집계 조회 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, []);

    const totalFindings = data.stats.highTotal + data.stats.mediumTotal + data.stats.lowTotal;
    const riskDistribution = useMemo(() => {
        const denominator = totalFindings || 1;

        return [
            { label: 'High', count: data.stats.highTotal, percent: Math.round((data.stats.highTotal / denominator) * 100), color: '#ff4d4f' },
            { label: 'Medium', count: data.stats.mediumTotal, percent: Math.round((data.stats.mediumTotal / denominator) * 100), color: '#faad14' },
            { label: 'Low', count: data.stats.lowTotal, percent: Math.round((data.stats.lowTotal / denominator) * 100), color: '#1677ff' },
        ];
    }, [data, totalFindings]);

    const gatePercent = data.stats.totalReviews === 0
        ? 0
        : Math.round((data.stats.passCount / data.stats.totalReviews) * 100);

    const columns: ColumnsType<ReviewItem> = [
        {
            title: '리뷰 대상',
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
            title: '점수',
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
            title: 'High',
            dataIndex: 'highCount',
            key: 'highCount',
            width: 80,
            render: (high: number) => <Tag color={high > 0 ? 'red' : 'green'}>{high}</Tag>,
        },
        {
            title: 'Medium',
            dataIndex: 'mediumCount',
            key: 'mediumCount',
            width: 90,
            render: (medium: number) => <Tag color={medium > 0 ? 'orange' : 'green'}>{medium}</Tag>,
        },
        {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: ReviewStatus) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag>,
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
                            Quality Dashboard
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            저장된 리뷰 이력 기준으로 품질, 위험도, 조치 상태를 추적합니다.
                        </Typography.Text>
                    </div>
                    <Tag color="blue" style={{ padding: '4px 10px' }}>
                        Stored reviews {data.stats.totalReviews}
                    </Tag>
                </Flex>

                {error ? <Alert type="error" showIcon title={error} /> : null}

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="리뷰 파일" value={data.stats.totalReviews} suffix="개" prefix={<FileSearchOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="평균 점수" value={data.stats.averageScore} suffix="점" prefix={<SafetyCertificateOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="조치 필요" value={data.stats.actionCount} suffix="건" prefix={<ExclamationCircleOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="통과 리뷰" value={data.stats.passCount} suffix="건" prefix={<CheckCircleOutlined />} loading={loading} />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={8}>
                        <Card title="품질 게이트">
                            <Spin spinning={loading}>
                                {data.stats.totalReviews > 0 ? (
                                    <Flex align="center" gap={20} wrap="wrap">
                                        <Progress type="dashboard" percent={gatePercent} strokeColor="#52c41a" />
                                        <Space orientation="vertical" size={12} style={{ flex: 1, minWidth: 220 }}>
                                            <Flex justify="space-between" align="center">
                                                <Typography.Text>통과 리뷰</Typography.Text>
                                                <Badge status="success" text={`${data.stats.passCount}건`} />
                                            </Flex>
                                            <Flex justify="space-between" align="center">
                                                <Typography.Text>관찰/조치 대상</Typography.Text>
                                                <Badge status={data.stats.actionCount > 0 ? 'warning' : 'processing'} text={`${data.stats.totalReviews - data.stats.passCount}건`} />
                                            </Flex>
                                        </Space>
                                    </Flex>
                                ) : (
                                    <Empty description="품질 게이트를 계산할 리뷰 이력이 없습니다." />
                                )}
                            </Spin>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="위험도 분포">
                            <Spin spinning={loading}>
                                {totalFindings > 0 ? (
                                    <Space orientation="vertical" size={14} style={{ width: '100%' }}>
                                        {riskDistribution.map((item) => (
                                            <div key={item.label}>
                                                <Flex justify="space-between" align="center">
                                                    <Typography.Text>{item.label}</Typography.Text>
                                                    <Typography.Text type="secondary">{item.count}건</Typography.Text>
                                                </Flex>
                                                <Progress percent={item.percent} showInfo={false} strokeColor={item.color} />
                                            </div>
                                        ))}
                                    </Space>
                                ) : (
                                    <Empty description="발견 항목이 없습니다." />
                                )}
                            </Spin>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="상태 요약">
                            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                                <Alert
                                    type={data.stats.highTotal > 0 ? 'warning' : 'success'}
                                    showIcon
                                    title={data.stats.highTotal > 0 ? 'High 항목 조치가 필요합니다.' : 'High 항목이 없습니다.'}
                                    description={`High ${data.stats.highTotal}건, Medium ${data.stats.mediumTotal}건, Low ${data.stats.lowTotal}건`}
                                />
                                <Flex justify="space-between" align="center">
                                    <Space>
                                        <ClockCircleOutlined />
                                        <Typography.Text>최근 리뷰</Typography.Text>
                                    </Space>
                                    <Typography.Text strong>
                                        {data.recentReviews[0] ? formatDate(data.recentReviews[0].createdAt) : '-'}
                                    </Typography.Text>
                                </Flex>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Card title="최근 리뷰 테이블">
                    <Spin spinning={loading}>
                        {data.recentReviews.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={data.recentReviews}
                                rowKey="id"
                                pagination={false}
                                size="middle"
                                scroll={{ x: 900 }}
                            />
                        ) : (
                            <Empty description="저장된 리뷰 이력이 없습니다." />
                        )}
                    </Spin>
                </Card>
            </Space>
        </main>
    );
}
