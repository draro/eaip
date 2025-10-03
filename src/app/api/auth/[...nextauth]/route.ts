import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { domainService, DomainService } from "@/lib/domainServer";
import crypto from "crypto";
function hashPassword(password: string) {
  return crypto
    .createHash("sha256")
    .update(password + "eAIP_salt_2025")
    .digest("hex");
}
const handler = NextAuth({
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
          const host = req?.headers?.host || req?.headers?.['x-forwarded-host'];
          const domain = DomainService.extractDomain(host as string);

          // First find user without populate to avoid model registration issues
          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) return null;

          // Then manually fetch organization if it exists
          let organization = null;
          if (user.organization) {
            try {
              organization = await Organization.findById(user.organization);
            } catch (orgError) {
              console.log('Could not fetch organization:', orgError instanceof Error ? orgError.message : 'Unknown error');
              // Continue without organization - it's not critical for authentication
            }
          }

          // Domain-specific login validation
          if (domain && domain !== 'localhost') {
            const domainInfo = await domainService.getOrganizationByDomain(domain);

            if (domainInfo) {
              // Ensure user belongs to the organization associated with this domain
              const userOrgId = organization?._id?.toString() || user.organization?.toString();
              const domainOrgId = domainInfo.organizationId;

              if (!DomainService.validateUserAccess(userOrgId, domainOrgId)) {
                console.log(`Domain login blocked: User org ${userOrgId} trying to login on domain org ${domainOrgId}`);
                throw new Error('CROSS_TENANT_LOGIN_DENIED');
              }
            }
          }

          console.log("User found:", user);

          const hashedInput = hashPassword(credentials.password);
          const isPasswordValid = hashedInput === user.password;

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: organization?._id?.toString() || user.organization?.toString(),
            organization: organization ? {
              id: organization._id.toString(),
              _id: organization._id.toString(),
              name: organization.name,
              domain: organization.domain,
              status: organization.status
            } : null,
            tenantDomain: domain, // Store the domain the user logged in from
          };
        } catch (error) {
          console.error("Auth error:", error);

          // Return specific error for cross-tenant login attempts
          if (error instanceof Error && error.message === 'CROSS_TENANT_LOGIN_DENIED') {
            return null;
          }

          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.organization = (user as any).organization;
        token.tenantDomain = (user as any).tenantDomain;
      }
      return token;
    },
    async session({ session, token }) {
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
});

export { handler as GET, handler as POST };
