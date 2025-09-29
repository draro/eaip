import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Organization from "@/models/Organization"; // Import Organization model
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          // First find user without populate to avoid model registration issues
          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) return null;

          // Then manually fetch organization if it exists
          let organization = null;
          if (user.organization) {
            try {
              organization = await Organization.findById(user.organization);
            } catch (orgError) {
              console.log('Could not fetch organization:', orgError.message);
              // Continue without organization - it's not critical for authentication
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
          };
        } catch (error) {
          console.error("Auth error:", error);
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
        token.role = user.role;
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.organization = user.organization;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organization = token.organization as any;
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
