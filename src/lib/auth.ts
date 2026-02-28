import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials) {
      const p = loginSchema.safeParse(credentials);
      if (!p.success) return null;
      const user = await prisma.user.findUnique({ where: { email: p.data.email }, include: { tenant: true } });
      if (!user || !user.isActive) return null;
      if (!await bcrypt.compare(p.data.password, user.password)) return null;
      await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id } });
      return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenantSlug: user.tenant?.slug ?? null } as any;
    }
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; token.tenantId = (user as any).tenantId; token.tenantSlug = (user as any).tenantSlug; }
      return token;
    },
    async session({ session, token }) {
      if (token) { session.user.id = token.id as string; session.user.role = token.role as string; session.user.tenantId = token.tenantId as string|null; session.user.tenantSlug = token.tenantSlug as string|null; }
      return session;
    }
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" }
});
