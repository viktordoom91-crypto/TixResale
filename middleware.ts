// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Extract token using the secret you added to Vercel
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const path = req.nextUrl.pathname;

  // 2. Protect Admin Routes
  if (path.startsWith('/admin')) {
    // Check if token exists and has the admin role (case-insensitive)
    if (!token || token.role?.toLowerCase() !== 'admin') {
      // If they aren't an admin, send them to the homepage
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 3. Allow valid requests through
  return NextResponse.next();
}

// 🚀 Matcher ensures this ONLY runs on the admin route to save performance
export const config = {
  matcher: ['/admin/:path*'],
};
