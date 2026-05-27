import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withErrorHandler, badRequest, conflict, tooMany } from "@/lib/api-handler";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { ensureTrialSubscription } from "@/lib/subscription";
import { sanitizeText } from "@/lib/utils";
import { logger } from "@/lib/logger";

const RESERVED_SLUGS = new Set(["admin", "api", "dashboard", "login", "register", "store", "settings", "billing", "health", "static", "_next"]);

const schema = z.object({
  ownerName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  storeName: z.string().min(2).max(80),
  storeSlug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  phone: z.string().max(20).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) throw tooMany();

  const body = await req.json().catch(() => ({}));
  const data = schema.parse(body);

  if (RESERVED_SLUGS.has(data.storeSlug)) throw badRequest("Slug ini sudah dipakai sistem. Pilih yang lain.");

  const [emailExists, slugExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email.toLowerCase() }, select: { id: true } }),
    prisma.tenant.findUnique({ where: { slug: data.storeSlug }, select: { id: true } }),
  ]);
  if (emailExists) throw conflict("Email sudah terdaftar.");
  if (slugExists) throw conflict("Slug toko sudah digunakan.");

  const hash = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: sanitizeText(data.storeName, 80),
        slug: data.storeSlug,
        phone: data.phone ? sanitizeText(data.phone, 20) : null,
      },
    });
    const user = await tx.user.create({
      data: {
        name: sanitizeText(data.ownerName, 80),
        email: data.email.toLowerCase(),
        password: hash,
        role: "OWNER",
        tenantId: tenant.id,
      },
    });
    await tx.auditLog.create({
      data: { userId: user.id, tenantId: tenant.id, action: "REGISTER", entity: "Tenant", entityId: tenant.id },
    });
    return { tenant, user };
  });

  // Trial PRO 14 hari otomatis untuk tenant baru.
  await ensureTrialSubscription(result.tenant.id).catch((e) => logger.warn("ensureTrialSubscription failed", { error: String(e) }));

  logger.info("Tenant registered", { tenantId: result.tenant.id, slug: result.tenant.slug });
  return NextResponse.json({ success: true, tenantSlug: result.tenant.slug });
});
