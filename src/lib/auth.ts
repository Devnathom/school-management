import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { teacher: true },
        });
        if (!user) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.teacher
            ? `${user.teacher.prefix}${user.teacher.firstName} ${user.teacher.lastName}`
            : "ผู้ดูแลระบบ",
          role: user.role,
          teacherId: user.teacherId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; teacherId?: string | null };
        token.role = u.role ?? "TEACHER";
        token.teacherId = u.teacherId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const t = token as { role?: string; teacherId?: string | null };
        session.user.role = t.role ?? "TEACHER";
        session.user.teacherId = t.teacherId ?? null;
      }
      return session;
    },
  },
});
