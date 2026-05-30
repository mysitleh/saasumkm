import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, forbidden, badRequest, notFound } from "@/lib/api-handler";
import { isPlatformAdmin } from "@/lib/admin";
import { activatePlan, cancelSubscription } from "@/lib/subscription";
import { BOOLEAN_FEATURE_LIST, type BooleanFeature } from "@/lib/features";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** GET — list all tenants with subscription + quick stats (admin only). */
export const GET = withErrorHandler(async (req: Request) => {
  if (!(await isPlatformAdmin())) throw forbidden("Akses khusus platform admin.");

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { products: true, orders: true, outlets: true, users: true } },
    },
  });

  const rows = tenants
    .filter((t) => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isActive: t.isActive,
      isPlatformAdmin: t.isPlatformAdmin ?? false,
      createdAt: t.createdAt.toISOString(),
      plan: t.subscription?.plan ?? "BASIC",
      status: t.subscription?.status ?? "NONE",
      trialEndsAt: t.subscription?.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: t.subscription?.currentPeriodEnd?.toISOString() ?? null,
      featureOverrides: t.featureOverrides ? JSON.parse(t.featureOverrides) : {},
      counts: t._count,
    }));

  return NextResponse.json({ tenants: rows });
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setPlan"), tenantId: z.string(), plan: z.enum(["BASIC", "PRO", "BUSINESS"]) }),
  z.object({ action: z.literal("cancel"), tenantId: z.string() }),
  z.object({ action: z.literal("extendTrial"), tenantId: z.string(), days: z.number().int().min(1).max(365) }),
  z.object({ action: z.literal("grantFull"), tenantId: z.string() }),
  z.object({ action: z.literal("clearOverrides"), tenantId: z.string() }),
  z.object({
    action: z.literal("setOverride"),
    tenantId: z.string(),
    feature: z.string(),
    value: z.boolean(),
  }),
  z.object({ action: z.literal("toggleActive"), tenantId: z.string(), active: z.boolean() }),
]);

/** POST — perform an admin action on a tenant. */
export const POST = withErrorHandler(async (req: Request) => {
  if (!(await isPlatformAdmin())) throw forbidden("Akses khusus platform admin.");
  const body = actionSchema.parse(await req.json());

  const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
  if (!tenant) throw notFound("Tenant tidak ditemukan.");

  switch (body.action) {
    case "setPlan": {
      await activatePlan(body.tenantId, body.plan);
      break;
    }
    case "cancel": {
      await cancelSubscription(body.tenantId).catch(() => null);
      break;
    }
    case "extendTrial": {
      const base = tenant.id;
      const sub = await prisma.subscription.findUnique({ where: { tenantId: base } });
      const from = sub?.trialEndsAt && sub.trialEndsAt > new Date() ? sub.trialEndsAt : new Date();
      const newEnd = new Date(from.getTime() + body.days * 24 * 60 * 60 * 1000);
      await prisma.subscription.upsert({
        where: { tenantId: base },
        update: { status: "TRIAL", plan: "PRO", trialEndsAt: newEnd, currentPeriodEnd: newEnd },
        create: {
          tenantId: base,
          plan: "PRO",
          status: "TRIAL",
          trialEndsAt: newEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: newEnd,
        },
      });
      break;
    }
    case "grantFull": {
      // Unlock every boolean feature regardless of plan ("layanan full").
      const full = Object.fromEntries(BOOLEAN_FEATURE_LIST.map((f) => [f, true]));
      await prisma.tenant.update({
        where: { id: body.tenantId },
        data: { featureOverrides: JSON.stringify(full) },
      });
      break;
    }
    case "clearOverrides": {
      await prisma.tenant.update({ where: { id: body.tenantId }, data: { featureOverrides: null } });
      break;
    }
    case "setOverride": {
      if (!BOOLEAN_FEATURE_LIST.includes(body.feature as BooleanFeature)) {
        throw badRequest("Feature tidak dikenal.");
      }
      const current = tenant.featureOverrides ? JSON.parse(tenant.featureOverrides) : {};
      current[body.feature] = body.value;
      await prisma.tenant.update({
        where: { id: body.tenantId },
        data: { featureOverrides: JSON.stringify(current) },
      });
      break;
    }
    case "toggleActive": {
      await prisma.tenant.update({ where: { id: body.tenantId }, data: { isActive: body.active } });
      break;
    }
  }

  await prisma.auditLog.create({
    data: {
      tenantId: body.tenantId,
      action: `ADMIN_${body.action.toUpperCase()}`,
      entity: "Tenant",
      entityId: body.tenantId,
      meta: JSON.stringify(body),
    },
  });
  logger.info("Admin action", { ...body });

  return NextResponse.json({ success: true });
});
