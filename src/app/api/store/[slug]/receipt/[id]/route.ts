import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, notFound } from "@/lib/api-handler";
import { formatReceipt, formatReceiptWhatsApp } from "@/lib/receipt";

type Ctx = { params: Promise<{ slug: string; id: string }> };

/**
 * GET: Struk teks sebuah order, siap share via WhatsApp.
 * Public endpoint — customer bisa ambil struk tanpa login pakai order id.
 * Query ?format=wa untuk versi monospace WhatsApp.
 */
export const GET = withErrorHandler<Ctx>(async (req, { params }) => {
  const { slug, id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, phone: true, address: true },
  });
  if (!tenant) throw notFound("Toko tidak ditemukan.");

  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: { items: { select: { name: true, price: true, quantity: true, subtotal: true } } },
  });
  if (!order) throw notFound("Pesanan tidak ditemukan.");

  const receiptInput = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
  };

  const text =
    format === "wa"
      ? formatReceiptWhatsApp(tenant, receiptInput)
      : formatReceipt(tenant, receiptInput);

  return NextResponse.json({ orderNumber: order.orderNumber, receipt: text });
});
