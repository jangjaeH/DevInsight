import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getReviewHistoryDashboard } from '@/lib/reviewHistory';
import { isValidToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    if (!isValidToken(req.cookies.get('token')?.value)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        return NextResponse.json(await getReviewHistoryDashboard());
    } catch {
        return NextResponse.json(
            { message: '리뷰 이력을 조회하지 못했습니다.' },
            { status: 500 }
        );
    }
}
