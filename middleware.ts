import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/home', '/review', '/dashboard', '/setting'];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    const { pathname } = request.nextUrl;

    if (token && pathname === '/login') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/home/:path*', '/review/:path*', '/dashboard/:path*', '/setting/:path*', '/login'],
};
