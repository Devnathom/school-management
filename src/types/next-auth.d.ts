import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      teacherId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    teacherId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    teacherId?: string | null;
  }
}
