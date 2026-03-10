// biome-ignore-all lint/style/noNonNullAssertion: no need
import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";
import dbConnect from "./mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await dbConnect();
      const existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name,
          role: "spectator",
        });
      }

      return true;
    },
    async session({ session }: { session: Session }) {
      await dbConnect();
      const dbUser = await User.findOne({ email: session.user?.email });

      if (dbUser) {
        session.user.role = dbUser.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/umpire",
  },
};
