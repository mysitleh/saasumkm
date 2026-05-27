import "next-auth";
declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string|null; email?: string|null; image?: string|null; role: string; tenantId: string|null; tenantSlug: string|null; };
  }
}
