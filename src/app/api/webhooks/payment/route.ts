import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payment";
import { logger } from "@/lib/logger";
import { withErrorHandler, badRequest } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Webhook universal untuk payment provider aktif (Midtrans/Mock).
 * - Verifikasi signature
 * - Idempotent via WebhookEvent (provider, eventId)
 * - Update Payment & Order dalam transaksi
 */
export const POST = withErrorHandler(async (req: Request) => {
  const provider = getPaymentProvider();
  const signature = req.headers.get("x-signature") ?? req.headers.get("x-callback-signature");
  const text = await req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw badRequest("Invalid JSON.");
  }

  if (!provider.verifySignature(payload, signature)) {
    logger.warn("Webhook signature invalid", { provider: provider.name });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = provider.parseWebhook(payload);

  // Idempotency: simpan event, jika sudah pernah → skip.
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: provider.name,
        eventId: parsed.rawEventId,
        signature: signature ?? null,
        payload: text.slice(0, 10_000),
        status: "RECEIVED",
      },
    });
  } catch {
    logger.info("Webhook duplicate ignored", { provider: provider.name, eventId: parsed.rawEventId });
    return NextResponse.json({ status: "duplicate" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderNumber: parsed.orderNumber } });
      if (!order) throw new Error(`Order ${parsed.orderNumber} tidak ditemukan`);

      const payment = await tx.payment.findFirst({
        where: { provider: provider.name, providerRef: parsed.providerRef },
      });
      if (!payment) throw new Error("Payment record tidak ditemukan");

      if (parsed.status === "PAID" && order.status === "WAITING_PAYMENT") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID_MANUAL", paidAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            tenantId: order.tenantId,
            action: "WEBHOOK_PAYMENT_PAID",
            entity: "Order",
            entityId: order.id,
            meta: JSON.stringify({ provider: provider.name, providerRef: parsed.providerRef }),
          },
        });
      } else if (parsed.status === "FAILED" || parsed.status === "EXPIRED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: parsed.status },
        });
      }
    });
    await prisma.webhookEvent.updateMany({
      where: { provider: provider.name, eventId: parsed.rawEventId },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    logger.info("Webhook processed", { provider: provider.name, orderNumber: parsed.orderNumber, status: parsed.status });
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.webhookEvent.updateMany({
      where: { provider: provider.name, eventId: parsed.rawEventId },
      data: { status: "FAILED", error: msg.slice(0, 500) },
    });
    logger.error("Webhook processing failed", { error: msg, provider: provider.name });
    return NextResponse.json({ error: "Processing failed", message: msg }, { status: 500 });
  }
});
