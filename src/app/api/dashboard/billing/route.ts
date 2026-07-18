import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { activatePlan, cancelSubscription } from "@/lib/subscription";
import type { Plan } from "@/lib/features";
import { logger } from "@/lib/logger";

const planSchema = z.object({
  plan: z.enum(["BASIC", "PRO", "BUSINESS"]),
  action: z.enum(["activate", "cancel"]).default("activate"),
});

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const sub = await prisma.subscription.findUnique({ where: { tenantId: session.user.tenantId } });
  return NextResponse.json({ subscription: sub });
});

/**
 * Endpoint billing sederhana:
 * - "activate": aktifkan plan (mock — di production wajib lewati gateway billing).
 * - "cancel": tandai subscription cancelled.
 *
 * Hanya OWNER yang boleh.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden("Hanya pemilik yang bisa mengubah paket.");

  const body = planSchema.parse(await req.json());
  if (body.action === "cancel") {
    await cancelSubscription(session.user.tenantId);
    logger.info("Subscription cancelled", { tenantId: session.user.tenantId });
    return NextResponse.json({ success: true });
  }

  if (process.env.NODE_ENV === "production") {
    throw forbidden("Aktivasi paket hanya dapat dilakukan setelah pembayaran terverifikasi.");
  }

  const plan: Plan = body.plan;
  await activatePlan(session.user.tenantId, plan);
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      action: "ACTIVATE_PLAN",
      entity: "Subscription",
      entityId: session.user.tenantId,
      meta: JSON.stringify({ plan }),
    },
  });
  logger.info("Subscription activated", { tenantId: session.user.tenantId, plan });
  return NextResponse.json({ success: true, plan });
});
