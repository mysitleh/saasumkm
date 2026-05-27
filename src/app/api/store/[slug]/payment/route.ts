import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, badRequest, notFound } from "@/lib/api-handler";
import { getPaymentProvider } from "@/lib/payment";
import { hasFeature } from "@/lib/features";
import { logger } from "@/lib/logger";

const schema = z.object({ orderId: z.string().min(1) });

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Buat pembayaran QRIS dinamis untuk order. Hanya tersedia bila tenant
 * mengaktifkan fitur qrisDynamic (paket Pro+).
 */
export const POST = withErrorHandler<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) throw notFound("Toko tidak ditemukan.");

  const enabled = await hasFeature(tenant.id, "qrisDynamic");
  if (!enabled) throw badRequest("Toko ini belum mengaktifkan QRIS dinamis.");

  const { orderId } = schema.parse(await req.json());
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.id, status: "WAITING_PAYMENT" },
  });
  if (!order) throw notFound("Order tidak ditemukan atau sudah dibayar.");

  // Idempotent: kalau payment masih PENDING dan belum expired, return yang lama.
  const existing = await prisma.payment.findFirst({
    where: { orderId: order.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (existing && (!existing.expiresAt || existing.expiresAt > new Date())) {
    return NextResponse.json({
      success: true,
      qrCodeUrl: existing.qrCodeUrl,
      qrPayload: existing.qrPayload,
      expiresAt: existing.expiresAt,
      paymentId: existing.id,
    });
  }

  const provider = getPaymentProvider();
  const created = await provider.createQrisPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
  });

  const payment = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      provider: provider.name,
      providerRef: created.providerRef,
      amount: order.total,
      method: "QRIS",
      status: "PENDING",
      qrCodeUrl: created.qrCodeUrl ?? null,
      qrPayload: created.qrPayload ?? null,
      expiresAt: created.expiresAt ?? null,
      rawResponse: JSON.stringify(created.raw).slice(0, 5000),
    },
  });
  await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "QRIS_DYNAMIC" } });

  logger.info("Payment created", { orderId: order.id, paymentId: payment.id, provider: provider.name });
  return NextResponse.json({
    success: true,
    qrCodeUrl: payment.qrCodeUrl,
    qrPayload: payment.qrPayload,
    expiresAt: payment.expiresAt,
    paymentId: payment.id,
  });
});
