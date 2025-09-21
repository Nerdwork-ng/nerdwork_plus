import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { CustomJWT } from "./lib/types/auth";
import { User } from "./lib/types";
import { googleAuth } from "./actions/auth.actions";

const isDevelopment = process.env.NODE_ENV === "development";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  debug: isDevelopment,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        return true;
      }
      return false;
    },
    async jwt({ token, account, trigger, session }) {
      if (account?.provider === "google") {
        if (!account?.id_token) {
          return token;
        }

        const response = await googleAuth(account.id_token);

        if (!response || response.success === false || !response.data) {
          console.error("Backend response was unsuccessful or missing data.");
          return null;
        }

        const { token: backendToken, user, cProfile, rProfile } = response.data;

        return {
          ...token,
          token: backendToken,
          user,
          cProfile,
          rProfile,
        };
      }

      // Handle the update trigger from the client
      if (trigger === "update") {
        if (session?.cProfile !== undefined) {
          token.cProfile = session.cProfile;
        }
        if (session?.rProfile !== undefined) {
          token.rProfile = session.rProfile;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const customToken = token as CustomJWT;

      if (customToken.user && customToken.token !== undefined) {
        session.user = {
          id: customToken.user.id,
          email: customToken.user.email,
          username: customToken.user.username,
          firstName: customToken.user.firstName,
          lastName: customToken.user.lastName,
          profilePicture: customToken.picture,
          cProfile: customToken.cProfile,
          rProfile: customToken.rProfile,
        };

        session.token = customToken.token;
        session.cProfile = customToken.cProfile;
        session.rProfile = customToken.rProfile;
      } else {
        console.warn(
          "Session token is missing user data or API token. Session will be incomplete."
        );
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});

declare module "next-auth" {
  interface Session {
    user: {
      id: User["id"];
      email?: User["email"];
      firstName?: User["firstName"];
      lastName?: User["lastName"];
      username?: User["username"];
      profilePicture?: User["profilePicture"];
      cProfile?: User["cProfile"];
      rProfile?: User["rProfile"];
    } & DefaultSession["user"];
    token?: string;
    cProfile?: boolean;
    rProfile?: boolean;
  }
}
