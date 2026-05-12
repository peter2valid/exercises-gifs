import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components and Route Handlers
  const { data: { session } } = await supabase.auth.getSession();

  const url = new URL(req.url);
  const path = url.pathname;

  // 1. PUBLIC ROUTES: Always accessible
  const isAuthPage = path.startsWith('/auth');
  const isPublicApi = path.startsWith('/api/public');
  const isStatic = path.match(/\.(.*)$/); // Basic check for static assets

  // 2. REDIRECT: If logged in and trying to access /auth, go to /home
  if (session && isAuthPage && path !== '/auth/callback') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // 3. PROTECT: If NOT logged in and trying to access private pages, go to /auth
  // Private pages are everything EXCEPT /auth, /api/public, and static files
  if (!session && !isAuthPage && !isPublicApi && !isStatic && path !== '/') {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
