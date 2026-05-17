// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

    // 1. If logged in and on the login page, route based on role
    if (isAuthPage && isAuth) {
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 2. If accessing /admin but role is NOT "ADMIN", kick them to home
    if (isAdminPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true, 
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/checkout/:path*', '/login'],
};
