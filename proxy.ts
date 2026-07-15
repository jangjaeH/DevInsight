import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidToken } from '@/lib/auth';

const protectedRoutes = ['/home', '/review', '/dashboard', '/setting'];

export function proxy(request: NextRequest) {
    const authenticated = isValidToken(request.cookies.get('token')?.value);
    const { pathname } = request.nextUrl;

    if (authenticated && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!authenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/home/:path*', '/review/:path*', '/dashboard/:path*', '/setting/:path*', '/login'],
};
