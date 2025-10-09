import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DomainService } from "@/lib/domain";

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Get hostname from X-Forwarded-Host (Nginx proxy) or fall back to req.nextUrl.hostname
    const forwardedHost =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    const hostname = forwardedHost || req.nextUrl.hostname;

    console.log(`[Middleware] Request: ${hostname}${pathname}`, {
      "x-forwarded-host": req.headers.get("x-forwarded-host"),
      host: req.headers.get("host"),
      "nextUrl.hostname": req.nextUrl.hostname,
    });

    // Skip internal middleware requests to prevent infinite loops
    if (req.headers.get("x-middleware-request") === "true") {
      console.log("[Middleware] Skipping internal middleware request");
      return NextResponse.next();
    }

    // Skip processing for localhost and development
    if (
      hostname === "localhost" ||
      hostname.includes("localhost") ||
      hostname.includes("0.0.0.0") ||
      hostname.includes("127.0.0.1")
    ) {
      console.log("[Middleware] Skipping localhost/internal IP");
      return NextResponse.next();
    }

    // Simple domain extraction
    const cleanDomain = hostname.toLowerCase().replace(/^www\./, "");

    // Check if this is a custom domain (not our main application domains)
    const mainAppDomain =
      process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
      "eaip.flyclim.com";
    const isMainDomain =
      hostname === mainAppDomain ||
      hostname === "eaip.flyclim.com" || // Always treat eaip.flyclim.com as main domain
      hostname === "localhost" ||
      hostname.includes("localhost") ||
      hostname.includes("vercel.app") ||
      hostname.includes("netlify.app");

    console.log(`[Middleware] Domain check:`, {
      hostname,
      cleanDomain,
      mainAppDomain,
      isMainDomain,
    });

    // Handle tenant-specific domain routing
    if (!isMainDomain && cleanDomain !== "localhost") {
      try {
        // For internal API calls, always use HTTP (not HTTPS) to avoid SSL issues
        // Use the container's internal port (3000) for Docker compatibility
        const requestUrl = new URL(req.url);
        // Force http:// protocol for internal container-to-container communication
        const internalOrigin = `http://${requestUrl.hostname}:3000`;
        const domainLookupUrl = new URL(
          "/api/organizations/by-domain",
          internalOrigin
        );
        domainLookupUrl.searchParams.set("domain", cleanDomain);

        console.log(
          "[Middleware] Fetching org data from:",
          domainLookupUrl.toString()
        );

        const domainResponse = await fetch(domainLookupUrl.toString(), {
          headers: { "x-middleware-request": "true" },
        });

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();

          if (domainData.success && domainData.organization) {
            // Set organization context headers
            const requestHeaders = new Headers(req.headers);
            requestHeaders.set("x-tenant-domain", cleanDomain);
            requestHeaders.set("x-tenant-org-id", domainData.organization._id);
            requestHeaders.set(
              "x-tenant-org-name",
              domainData.organization.name
            );

            // For authenticated users, validate they belong to this organization
            if (token) {
              const userOrgId = token.organizationId as string;
              const domainOrgId = domainData.organization._id;

              // Block cross-tenant access
              if (
                !DomainService.validateUserAccess(userOrgId, domainOrgId) &&
                !pathname.startsWith("/auth/signin")
              ) {
                console.log(
                  `Access denied: User org ${userOrgId} accessing domain org ${domainOrgId}`
                );

                // Redirect to domain-specific login
                const loginUrl = new URL("/auth/signin", req.url);
                loginUrl.searchParams.set("error", "unauthorized");
                loginUrl.searchParams.set("callbackUrl", pathname);

                return NextResponse.redirect(loginUrl);
              }
            }

            // Custom domains ONLY serve public pages
            // Redirect all custom domain traffic to public eAIP pages
            const url = req.nextUrl.clone();
            const orgDomain = domainData.organization.domain;

            // Map root to public organization page
            if (pathname === "/") {
              url.pathname = `/public/${orgDomain}`;
              console.log(
                `[Custom Domain] Root rewrite: ${hostname}/ → ${url.pathname}`
              );
              return NextResponse.rewrite(url, {
                request: { headers: requestHeaders },
              });
            }

            // Map document IDs directly to public document pages
            // Pattern: /{documentId} → /public/{domain}/{documentId}
            const documentIdPattern = /^\/([a-f0-9]{24})$/i; // MongoDB ObjectId pattern
            if (documentIdPattern.test(pathname)) {
              url.pathname = `/public/${orgDomain}${pathname}`;
              console.log(
                `[Custom Domain] Document rewrite: ${hostname}${pathname} → ${url.pathname}`
              );
              return NextResponse.rewrite(url, {
                request: { headers: requestHeaders },
              });
            }

            // Handle /public routes on custom domains
            if (pathname.startsWith("/public")) {
              // If accessing /public/{orgDomain} on custom domain, redirect to root
              if (pathname === `/public/${orgDomain}`) {
                console.log(
                  `[Custom Domain] Redirect /public/${orgDomain} → /`
                );
                return NextResponse.redirect(new URL("/", req.url));
              }

              // If accessing /public/{orgDomain}/{documentId}, redirect to /{documentId}
              const publicDocPattern = new RegExp(
                `^/public/${orgDomain.replace(".", "\\.")}/([a-f0-9]{24})$`,
                "i"
              );
              const match = pathname.match(publicDocPattern);
              if (match) {
                const docId = match[1];
                console.log(
                  `[Custom Domain] Redirect /public/${orgDomain}/${docId} → /${docId}`
                );
                return NextResponse.redirect(new URL(`/${docId}`, req.url));
              }

              console.log(
                `[Custom Domain] Public route passthrough: ${pathname}`
              );
              return NextResponse.rewrite(url, {
                request: { headers: requestHeaders },
              });
            }

            // Allow API calls for public data
            if (pathname.startsWith("/api/public")) {
              console.log(`[Custom Domain] API passthrough: ${pathname}`);
              return NextResponse.next({
                request: { headers: requestHeaders },
              });
            }

            // Block all other routes on custom domains (admin, dashboard, auth, etc.)
            // Users must access the main app domain (eaip.flyclim.com) for these features
            console.log(
              `Custom domain ${cleanDomain} blocked access to: ${pathname}`
            );
            return new NextResponse(
              JSON.stringify({
                error: "Access Denied",
                message: `This custom domain only provides public eAIP access. For administration, please visit the main application at ${
                  process.env.NEXTAUTH_URL || "https://eaip.flyclim.com"
                }`,
                code: "CUSTOM_DOMAIN_PUBLIC_ONLY",
              }),
              {
                status: 403,
                headers: { "content-type": "application/json" },
              }
            );
          }
        }

        // Domain not found in our system
        return new NextResponse(
          JSON.stringify({
            error: "Domain not configured",
            message: `The domain ${cleanDomain} is not associated with any organization.`,
            code: "DOMAIN_NOT_FOUND",
          }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Domain lookup error:", error);
        return new NextResponse(
          JSON.stringify({
            error: "Domain lookup failed",
            message: "Unable to resolve domain configuration.",
            code: "DOMAIN_LOOKUP_ERROR",
          }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
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
          "/public",
          "/eaip",
          "/api/public",
          "/auth/signin",
          "/auth/signup",
          "/auth/error",
          "/_next",
          "/favicon.ico",
        ];

        const protectedRoutes = [
          "/admin",
          "/dashboard",
          "/documents",
          "/versions",
          "/exports",
          "/profile",
          "/organization",
          "/api/admin",
          "/api/documents",
          "/api/users",
        ];

        // Allow public routes without authentication
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        // Check if route requires authentication
        const requiresAuth = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (requiresAuth) {
          // Require valid token for protected routes
          if (!token) {
            return false;
          }

          // Additional role-based checks
          if (pathname.startsWith("/admin") && token.role !== "super_admin") {
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|exports|auth).*)",
  ],
};
