import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/src/lib/db";
import sendVerificationRequest from "@/src/lib/email";
import { NextAuthOptions } from "next-auth";
import { ExtendedAdapterUser } from "../types/ExtendedAdapterUser";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(client, {
    databaseName: process.env.MONGODB_AUTH_DB_NAME,
  }),
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { username, password } = credentials;
        const res = await fetch(
          `${process.env.NEXTAUTH_URL}/getUserByLoginWithCredentials`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          },
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const userId = data.user._id;
          const adapterUser = data.user as ExtendedAdapterUser;
          adapterUser.id = userId;
          return adapterUser;
        }
        return null;
      },
    }),
    // ...add more providers here
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM, // địa chỉ gửi mail, ví dụ: "noreply@yourapp.com"
      sendVerificationRequest, // hàm gửi email xác minh
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản GitHub với email đã tồn tại
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản Google với email đã tồn tại
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID || "",
      clientSecret: process.env.FACEBOOK_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản Facebook với email đã tồn tại
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adapterUser = user as ExtendedAdapterUser;
        token.id = adapterUser.id;
        token.name = `${adapterUser.firstName} ${adapterUser.lastName}`;
        token.email = adapterUser.email;
        token.picture = adapterUser.image;
        token.username = adapterUser.username;
        token.emailVerified = adapterUser.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
