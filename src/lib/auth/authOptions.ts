import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { domainService, DomainService } from "@/lib/domainServer";
import { PasswordHasher } from "@/lib/passwordHasher";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          // Get domain from request headers for tenant validation
          // Try multiple header sources (HTTP/1.1 and HTTP/2)
          const host =
            (req?.headers?.host !== "eaip.flyclim.com"
              ? req?.headers?.host
              : null) ||
            req?.headers?.["x-forwarded-host"] ||
            req?.headers?.[":authority"] ||
            process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "").split("/")[0];

          console.log("Auth headers:", {
            host: req?.headers?.host,
            xForwardedHost: req?.headers?.["x-forwarded-host"],
            authority: req?.headers?.[":authority"],
            allHeaders: Object.keys(req?.headers || {}),
          });

          const domain = DomainService.extractDomain(host as string);
          console.log("Extracted domain for auth:", domain);
          // First find user without populate to avoid model registration issues
          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) return null;

          // Then manually fetch organization if it exists
          let organization = null;
          if (user.organization) {
            try {
              organization = await Organization.findById(user.organization);
            } catch (orgError) {
              console.log(
                "Could not fetch organization:",
                orgError instanceof Error ? orgError.message : "Unknown error"
              );
              // Continue without organization - it's not critical for authentication
            }
          }

          // Domain-specific login validation (only for tenant-specific domains)
          // Skip validation for main app domain (eaip.flyclim.com) and localhost
          const mainAppDomain = process.env.NEXTAUTH_URL?.replace(
            /^https?:\/\//,
            ""
          ).split("/")[0];
          const isMainAppDomain =
            domain === mainAppDomain || domain === "localhost" || !domain;

          console.log("Domain validation:", {
            requestDomain: domain,
            mainAppDomain,
            isMainAppDomain,
            willValidate: !isMainAppDomain,
          });

          if (domain && !isMainAppDomain) {
            const domainInfo = await domainService.getOrganizationByDomain(
              domain
            );

            if (domainInfo) {
              // Ensure user belongs to the organization associated with this domain
              const userOrgId =
                organization?._id?.toString() || user.organization?.toString();
              const domainOrgId = domainInfo.organizationId;

              if (!DomainService.validateUserAccess(userOrgId, domainOrgId)) {
                console.log(
                  `Domain login blocked: User org ${userOrgId} trying to login on domain org ${domainOrgId}`
                );
                throw new Error("CROSS_TENANT_LOGIN_DENIED");
              }
            }
          } else {
            console.log(
              "Skipping domain validation - logging in to main app domain"
            );
          }

          console.log("User found:", user);

          // Authenticate with transparent migration from SHA-256 to bcrypt
          const authResult = await PasswordHasher.authenticateAndMigrate(
            credentials.password,
            user.password
          );

          console.log("Password authentication:", {
            authenticated: authResult.authenticated,
            needsMigration: authResult.needsMigration,
          });

          if (!authResult.authenticated) return null;

          // If password needs migration from SHA-256 to bcrypt, update it
          if (authResult.needsMigration && authResult.newHash) {
            console.log("Migrating password to bcrypt for user:", user.email);
            user.password = authResult.newHash;
            await user.save();
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId:
              organization?._id?.toString() || user.organization?.toString(),
            organization: organization
              ? {
                  id: organization._id.toString(),
                  _id: organization._id.toString(),
                  name: organization.name,
                  domain: organization.domain,
                  status: organization.status,
                }
              : null,
            tenantDomain: domain, // Store the domain the user logged in from
          };
        } catch (error) {
          console.error("Auth error:", error);

          // Return specific error for cross-tenant login attempts
          if (
            error instanceof Error &&
            error.message === "CROSS_TENANT_LOGIN_DENIED"
          ) {
            return null;
          }

          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (28800 seconds) - SOC 2 compliant
    updateAge: 60 * 60, // Refresh session every hour
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true, // Prevents client-side JavaScript access (XSS protection)
        sameSite: 'lax', // CSRF protection (use 'strict' for higher security)
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.organization = (user as any).organization;
        token.tenantDomain = (user as any).tenantDomain;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).organizationId = token.organizationId as string;
        (session.user as any).organization = token.organization as any;
        (session.user as any).tenantDomain = token.tenantDomain as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
