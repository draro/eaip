import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { DomainService } from '@/lib/domain';

export default withAuth(
  async function middleware(req) {
    const { hostname, pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log(`[Middleware] Request: ${hostname}${pathname}`);

    // Skip processing for localhost and development
    if (hostname === 'localhost' || hostname.includes('localhost')) {
      return NextResponse.next();
    }

    // Simple domain extraction
    const cleanDomain = hostname.toLowerCase().replace(/^www\./, '');

    // Check if this is a custom domain (not our main application domains)
    const mainAppDomain = process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '').split('/')[0] || 'eaip.flyclim.com';
    const isMainDomain = hostname === mainAppDomain ||
                        hostname === 'localhost' ||
                        hostname.includes('localhost') ||
                        hostname.includes('vercel.app') ||
                        hostname.includes('netlify.app');

    console.log(`[Middleware] Domain check:`, {
      hostname,
      cleanDomain,
      mainAppDomain,
      isMainDomain
    });

    // Handle tenant-specific domain routing
    if (!isMainDomain && cleanDomain !== 'localhost') {
      try {
        // For custom domains, use an API call to lookup organization
        // Note: In production, you might want to cache this or use a faster lookup method
        const domainLookupUrl = new URL('/api/organizations/by-domain', req.nextUrl.origin);
        domainLookupUrl.searchParams.set('domain', cleanDomain);

        const domainResponse = await fetch(domainLookupUrl.toString(), {
          headers: { 'x-middleware-request': 'true' }
        });

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();

          if (domainData.success && domainData.organization) {
            // Set organization context headers
            const requestHeaders = new Headers(req.headers);
            requestHeaders.set('x-tenant-domain', cleanDomain);
            requestHeaders.set('x-tenant-org-id', domainData.organization._id);
            requestHeaders.set('x-tenant-org-name', domainData.organization.name);

            // For authenticated users, validate they belong to this organization
            if (token) {
              const userOrgId = token.organizationId as string;
              const domainOrgId = domainData.organization._id;

              // Block cross-tenant access
              if (!DomainService.validateUserAccess(userOrgId, domainOrgId) && !pathname.startsWith('/auth/signin')) {
                console.log(`Access denied: User org ${userOrgId} accessing domain org ${domainOrgId}`);

                // Redirect to domain-specific login
                const loginUrl = new URL('/auth/signin', req.url);
                loginUrl.searchParams.set('error', 'unauthorized');
                loginUrl.searchParams.set('callbackUrl', pathname);

                return NextResponse.redirect(loginUrl);
              }
            }

            // Custom domains ONLY serve public pages
            // Redirect all custom domain traffic to public eAIP pages
            const url = req.nextUrl.clone();

            // Map root to public organization page
            if (pathname === '/') {
              url.pathname = `/public/${cleanDomain}`;
              console.log(`Custom domain rewrite: ${hostname}${pathname} → ${url.pathname}`);
              return NextResponse.rewrite(url, {
                request: { headers: requestHeaders }
              });
            }

            // Allow direct access to public routes
            if (pathname.startsWith('/public')) {
              return NextResponse.rewrite(url, {
                request: { headers: requestHeaders }
              });
            }

            // Allow API calls for public data
            if (pathname.startsWith('/api/public')) {
              return NextResponse.next({
                request: { headers: requestHeaders }
              });
            }

            // Block all other routes on custom domains (admin, dashboard, auth, etc.)
            // Users must access the main app domain (eaip.flyclim.com) for these features
            console.log(`Custom domain ${cleanDomain} blocked access to: ${pathname}`);
            return new NextResponse(
              JSON.stringify({
                error: 'Access Denied',
                message: `This custom domain only provides public eAIP access. For administration, please visit the main application at ${process.env.NEXTAUTH_URL || 'https://eaip.flyclim.com'}`,
                code: 'CUSTOM_DOMAIN_PUBLIC_ONLY'
              }),
              {
                status: 403,
                headers: { 'content-type': 'application/json' }
              }
            );
          }
        }

        // Domain not found in our system
        return new NextResponse(
          JSON.stringify({
            error: 'Domain not configured',
            message: `The domain ${cleanDomain} is not associated with any organization.`,
            code: 'DOMAIN_NOT_FOUND'
          }),
          {
            status: 404,
            headers: { 'content-type': 'application/json' }
          }
        );

      } catch (error) {
        console.error('Domain lookup error:', error);
        return new NextResponse(
          JSON.stringify({
            error: 'Domain lookup failed',
            message: 'Unable to resolve domain configuration.',
            code: 'DOMAIN_LOOKUP_ERROR'
          }),
          {
            status: 500,
            headers: { 'content-type': 'application/json' }
          }
        );
      }
    }

    // Main domain handling - no special tenant validation needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Define route categories
        const publicRoutes = [
          '/public',
          '/eaip',
          '/api/public',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/_next',
          '/favicon.ico'
        ];

        const protectedRoutes = [
          '/admin',
          '/dashboard',
          '/documents',
          '/versions',
          '/exports',
          '/profile',
          '/organization',
          '/api/admin',
          '/api/documents',
          '/api/users'
        ];

        // Allow public routes without authentication
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Check if route requires authentication
        const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));

        if (requiresAuth) {
          // Require valid token for protected routes
          if (!token) {
            return false;
          }

          // Additional role-based checks
          if (pathname.startsWith('/admin') && token.role !== 'super_admin') {
            return false;
          }

          return true;
        }

        // Default: allow access to unspecified routes
        return true;
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