import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const { hostname, pathname } = req.nextUrl;

    // Skip processing for localhost and development
    if (hostname === 'localhost' || hostname.includes('localhost')) {
      return NextResponse.next();
    }

    // Check if this is a custom domain (not our main domain)
    const isCustomDomain = !hostname.includes('eaip-system.com') &&
                          !hostname.includes('vercel.app') &&
                          !hostname.includes('netlify.app');

    if (isCustomDomain) {
      // Handle custom domain routing
      try {
        // Look up organization by domain
        const response = await fetch(`${req.nextUrl.origin}/api/organizations/by-domain?domain=${hostname}`, {
          headers: {
            'x-middleware-request': 'true'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.organization) {
            // Set organization context for custom domain
            const requestHeaders = new Headers(req.headers);
            requestHeaders.set('x-organization-domain', hostname);
            requestHeaders.set('x-organization-id', data.organization._id);
            requestHeaders.set('x-organization-name', data.organization.name);

            // Rewrite to public eAIP for custom domains
            if (pathname === '/' || pathname.startsWith('/public')) {
              const url = req.nextUrl.clone();
              url.pathname = `/public/${data.organization.domain}`;
              return NextResponse.rewrite(url, {
                request: {
                  headers: requestHeaders,
                }
              });
            }

            return NextResponse.next({
              request: {
                headers: requestHeaders,
              }
            });
          }
        }
      } catch (error) {
        console.error('Error looking up organization by domain:', error);
      }

      // If organization not found, show 404 or redirect
      return new NextResponse('Organization not found', { status: 404 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define protected routes
        const protectedRoutes = ['/documents', '/versions', '/exports', '/admin', '/dashboard', '/profile'];
        const { pathname } = req.nextUrl;

        // Allow public routes
        const publicRoutes = ['/', '/auth', '/public', '/eaip'];
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Check if the current path is protected
        const isProtectedRoute = protectedRoutes.some(route =>
          pathname.startsWith(route)
        );

        // Allow access to non-protected routes
        if (!isProtectedRoute) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|exports|auth).*)',
  ],
};