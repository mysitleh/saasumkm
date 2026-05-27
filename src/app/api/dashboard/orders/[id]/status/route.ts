import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, notFound, badRequest } from "@/lib/api-handler";
import { sendWhatsApp, buildPaidMessage, buildStatusUpdateMessage } from "@/lib/notifications";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { hasFeature } from "@/lib/features";
import { earnPoints } from "@/lib/loyalty";
import { logger } from "@/lib/logger";

const TRANSITIONS: Record<string, string[]> = {
  WAITING_PAYMENT: ["PAID_MANUAL", "CANCELLED"],
  PAID_MANUAL: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED"],
};

const schema = z.object({
  status: z.enum(["PAID_MANUAL", "PROCESSING", "COMPLETED", "CANCELLED"]),
});

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler<Ctx>(async (req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;
  const { status: newStatus } = schema.parse(await req.json());

  const order = await prisma.order.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { tenant: true },
  });
  if (!order) throw notFound("Order tidak ditemukan.");

  if (!(TRANSITIONS[order.status] ?? []).includes(newStatus)) {
    throw badRequest(`Transisi status ${order.status} → ${newStatus} tidak valid.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: {
        status: newStatus,
        paidAt: newStatus === "PAID_MANUAL" ? new Date() : undefined,
      },
    });
    // Restore stok bila order dibatalkan dari status menunggu pembayaran.
    if (newStatus === "CANCELLED" && order.status === "WAITING_PAYMENT") {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        action: "UPDATE_ORDER_STATUS",
        entity: "Order",
        entityId: id,
        meta: JSON.stringify({ from: order.status, to: newStatus }),
      },
    });
    return o;
  });

  // Best-effort WA notif (gated by Pro+).
  if (await hasFeature(session.user.tenantId, "whatsappNotif")) {
    const msg =
      newStatus === "PAID_MANUAL"
        ? buildPaidMessage({ name: order.tenant.name, slug: order.tenant.slug }, order)
        : buildStatusUpdateMessage(
            { name: order.tenant.name, slug: order.tenant.slug },
            order,
            ORDER_STATUS_LABELS[newStatus] ?? newStatus,
          );
    sendWhatsApp(order.customerPhone, msg).catch((e) => logger.warn("WA notif fail", { err: String(e) }));
  }

  // Loyalty: earn points when order is paid.
  if (newStatus === "PAID_MANUAL" && order.customerPhone) {
    earnPoints(session.user.tenantId, order.customerPhone, order.customerName, order.total, order.orderNumber)
      .catch((e) => logger.warn("Loyalty earn fail", { err: String(e) }));
  }

  return NextResponse.json({ success: true, status: updated.status });
});
