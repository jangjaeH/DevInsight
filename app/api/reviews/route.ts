import { NextResponse } from 'next/server';
import { getReviewHistoryDashboard } from '@/lib/reviewHistory';

export async function GET() {
    try {
        return NextResponse.json(await getReviewHistoryDashboard());
    } catch {
        return NextResponse.json(
            { message: '리뷰 이력을 조회하지 못했습니다.' },
            { status: 500 }
        );
    }
}
