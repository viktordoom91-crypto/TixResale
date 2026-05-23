// middleware.ts (or proxy.ts)
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Extract the NextAuth token directly from the request cookies
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const path = req.nextUrl.pathname;
  
  // 2. Define the protected paths
  const isAdminPath = path.startsWith('/admin');
  const isAuthPath = path.startsWith('/login');

  // 3. Handle Admin Routing Security
  if (isAdminPath) {
    // If there is no token (not logged in) OR the token role is NOT 'admin'
    // 🛠 Make sure the role string matches exactly what your DB outputs (e.g., 'admin' vs 'ADMIN')
    if (!token || token.role !== 'admin') {
      // Redirect unauthorized users to the homepage seamlessly
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 4. (Optional) Prevent logged-in users from accessing the login page
  if (isAuthPath && token) {
    if (token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 5. Allow all other requests to proceed normally
  return NextResponse.next();
}

// 🚀 MATCHERS: Only run this proxy on specific routes to save performance
export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
};
