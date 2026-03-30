import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = ['/auth/login', '/auth/register', '/auth/callback', '/admin-auth'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Get auth tokens from cookies or check localStorage (client-side)
    // Since middleware runs on the server, we'll check for the presence of auth data
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Protected paths that require authentication
    const protectedPaths = ['/profile', '/watch', '/admin'];
    const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));

    // Admin-only routes
    const adminRoutes = ['/admin'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // If trying to access a protected route without auth
    if (isProtectedRoute && !accessToken && !refreshToken) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // For admin routes, we need to check the user role
    // This is a simplified check - in production, you'd verify the JWT token
    if (isAdminRoute && accessToken) {
        // In a real implementation, decode the JWT and check the role
        // For now, we'll let the page component handle the role check
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
    ],
};
