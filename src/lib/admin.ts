import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Platform admin (SUPERADMIN) gate.
 *
 * A user is a platform admin if EITHER:
 *   1. Their email is in PLATFORM_ADMIN_EMAILS (comma-separated env), OR
 *   2. Their tenant has `isPlatformAdmin = true`.
 *
 * This keeps the very first admin bootstrappable via env without a DB write,
 * while allowing additional admins to be flagged per-tenant later.
 */
export function adminEmailsFromEnv(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isPlatformAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  const email = session.user.email.toLowerCase();
  if (adminEmailsFromEnv().includes(email)) return true;

  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { isPlatformAdmin: true },
    });
    if (tenant?.isPlatformAdmin) return true;
  }
  return false;
}

/** Throws-style guard for server components/actions. Returns the session email. */
export async function requirePlatformAdmin(): Promise<string> {
  const ok = await isPlatformAdmin();
  if (!ok) throw new Error("FORBIDDEN_NOT_ADMIN");
  const session = await auth();
  return session!.user.email!;
}
