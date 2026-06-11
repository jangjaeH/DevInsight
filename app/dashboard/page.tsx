'use client';

import {
    Alert,
    Badge,
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
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    FileSearchOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';

type ReviewStatus = 'done' | 'watch' | 'blocked';

type ReviewRow = {
    key: string;
    file: string;
    owner: string;
    score: number;
    high: number;
    medium: number;
    status: ReviewStatus;
    updatedAt: string;
};

const reviewRows: ReviewRow[] = [
    {
        key: 'review-page',
        file: 'app/review/page.tsx',
        owner: 'Frontend',
        score: 88,
        high: 0,
        medium: 2,
        status: 'done',
        updatedAt: '오늘 13:40',
    },
    {
        key: 'review-route',
        file: 'app/api/review/route.ts',
        owner: 'API',
        score: 84,
        high: 0,
        medium: 3,
        status: 'watch',
        updatedAt: '오늘 13:20',
    },
    {
        key: 'mes-work-order',
        file: 'MPS010Service.saveMesWorkOrder',
        owner: 'Backend',
        score: 69,
        high: 1,
        medium: 4,
        status: 'blocked',
        updatedAt: '어제 18:10',
    },
    {
        key: 'app-shell',
        file: 'components/layout/AppShell.tsx',
        owner: 'Frontend',
        score: 93,
        high: 0,
        medium: 1,
        status: 'done',
        updatedAt: '오늘 12:05',
    },
];

const statusMeta = {
    done: { label: '완료', color: 'green', badge: 'success' as const },
    watch: { label: '관찰', color: 'blue', badge: 'processing' as const },
    blocked: { label: '조치 필요', color: 'orange', badge: 'warning' as const },
};

const riskDistribution = [
    { label: 'High', count: 1, percent: 12, color: '#ff4d4f' },
    { label: 'Medium', count: 10, percent: 46, color: '#faad14' },
    { label: 'Low', count: 11, percent: 42, color: '#1677ff' },
];

const gateItems = [
    { label: '중복 리뷰 제거', status: '완료', badge: 'success' as const },
    { label: '콘솔/런타임 오류 정리', status: '완료', badge: 'success' as const },
    { label: 'Home/Dashboard UI 완성', status: '진행 중', badge: 'processing' as const },
    { label: 'PR 리뷰', status: '대기', badge: 'default' as const },
];

const reviewColumns: ColumnsType<ReviewRow> = [
    {
        title: '리뷰 대상',
        dataIndex: 'file',
        key: 'file',
        render: (file: string, row) => (
            <Space orientation="vertical" size={0}>
                <Typography.Text strong>{file}</Typography.Text>
                <Typography.Text type="secondary">{row.owner}</Typography.Text>
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
                strokeColor={score >= 90 ? '#52c41a' : score >= 80 ? '#1677ff' : '#faad14'}
            />
        ),
    },
    {
        title: 'High',
        dataIndex: 'high',
        key: 'high',
        width: 80,
        render: (high: number) => <Tag color={high > 0 ? 'red' : 'green'}>{high}</Tag>,
    },
    {
        title: 'Medium',
        dataIndex: 'medium',
        key: 'medium',
        width: 90,
        render: (medium: number) => <Tag color={medium > 2 ? 'orange' : 'blue'}>{medium}</Tag>,
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
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
    },
];

export default function Dashboard() {
    return (
        <main style={{ padding: 24 }}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <div>
                        <Typography.Title level={2} style={{ marginBottom: 4 }}>
                            Quality Dashboard
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            리뷰 품질, 조치 필요 항목, 운영 게이트 상태를 한 화면에서 추적합니다.
                        </Typography.Text>
                    </div>
                    <Tag color="blue" style={{ padding: '4px 10px' }}>
                        Last sync 오늘 13:40
                    </Tag>
                </Flex>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="리뷰 파일" value={24} suffix="개" prefix={<FileSearchOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="평균 점수" value={84} suffix="점" prefix={<SafetyCertificateOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="조치 필요" value={5} suffix="건" prefix={<ExclamationCircleOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card>
                            <Statistic title="완료 게이트" value={3} suffix="/4" prefix={<CheckCircleOutlined />} />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={8}>
                        <Card title="품질 게이트">
                            <Flex align="center" gap={20} wrap="wrap">
                                <Progress type="dashboard" percent={75} strokeColor="#52c41a" />
                                <Space orientation="vertical" size={12} style={{ flex: 1, minWidth: 220 }}>
                                    {gateItems.map((item) => (
                                        <Flex key={item.label} justify="space-between" align="center">
                                            <Typography.Text>{item.label}</Typography.Text>
                                            <Badge status={item.badge} text={item.status} />
                                        </Flex>
                                    ))}
                                </Space>
                            </Flex>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="위험도 분포">
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
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="상태 요약">
                            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                                <Alert
                                    type="warning"
                                    showIcon
                                    title="High 1건은 배포 전 조치가 필요합니다."
                                    description="MES 작업지시 중복 입력 가능성을 우선 확인하세요."
                                />
                                <Flex justify="space-between" align="center">
                                    <Space>
                                        <ClockCircleOutlined />
                                        <Typography.Text>평균 처리 시간</Typography.Text>
                                    </Space>
                                    <Typography.Text strong>18분</Typography.Text>
                                </Flex>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Card title="최근 리뷰 테이블">
                    <Table
                        columns={reviewColumns}
                        dataSource={reviewRows}
                        pagination={false}
                        size="middle"
                        scroll={{ x: 860 }}
                    />
                </Card>
            </Space>
        </main>
    );
}
