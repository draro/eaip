import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define protected routes
        const protectedRoutes = ['/documents', '/versions', '/exports'];
        const { pathname } = req.nextUrl;

        // Check if the current path is protected
        const isProtectedRoute = protectedRoutes.some(route =>
          pathname.startsWith(route) && pathname !== '/documents' && pathname !== '/versions' && pathname !== '/exports'
        ) || pathname.startsWith('/documents/') || pathname.startsWith('/versions/') || pathname.startsWith('/exports/');

        // Allow access to public routes
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