import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      emailVerified?: Date;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username?: string;
    emailVerified?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    emailVerified?: Date;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    username?: string;
  }
}
