import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider is only available in development
    ...(process.env.NODE_ENV !== "production"
      ? [
          CredentialsProvider({
            name: "Demo Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "admin@example.com" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              let user = await prisma.user.findUnique({
                where: { email: credentials.email },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: credentials.email,
                    name: credentials.email.split("@")[0],
                    role: "MEMBER",
                  },
                });
              }

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              };
            },
          }),
        ]
      : []),
    // Add OIDC provider when configured
    ...(process.env.OIDC_ISSUER
      ? [
          {
            id: "oidc",
            name: "SSO",
            type: "oauth" as const,
            wellKnown:
              process.env.OIDC_ISSUER + "/.well-known/openid-configuration",
            clientId: process.env.OIDC_CLIENT_ID,
            clientSecret: process.env.OIDC_CLIENT_SECRET,
            authorization: { params: { scope: "openid email profile" } },
            idToken: true,
            profile(profile: Record<string, string>) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
          },
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
