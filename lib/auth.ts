import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Landlord from "@/models/Landlord";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const landlord = await Landlord.findOne({
          email: credentials.email.toLowerCase(),
        });

        if (landlord) {
          const valid = await bcrypt.compare(
            credentials.password,
            landlord.passwordHash
          );
          if (!valid) return null;
          return {
            id: landlord._id.toString(),
            email: landlord.email,
            name: landlord.name,
          };
        }

        const demoEmail = process.env.LANDLORD_EMAIL;
        const demoPassword = process.env.LANDLORD_PASSWORD;
        if (
          demoEmail &&
          demoPassword &&
          credentials.email === demoEmail &&
          credentials.password === demoPassword
        ) {
          return {
            id: "demo-landlord",
            email: demoEmail,
            name: "Demo Landlord",
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
