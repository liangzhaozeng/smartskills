import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>,
  providers: [
    {
      id: "oidc",
      name: "SSO",
      type: "oauth",
      wellKnown:
        process.env.OIDC_ISSUER + "/.well-known/openid-configuration",
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        (session.user as { id: string }).id = user.id;
        (session.user as { role: string }).role = (user as unknown as { role: string }).role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
