import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, sanitizeText } from "@/lib/utils";
import { z } from "zod";
import { withErrorHandler, badRequest, notFound, tooMany } from "@/lib/api-handler";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { sendWhatsApp, buildNewOrderMessage } from "@/lib/notifications";
import { hasFeature } from "@/lib/features";
import { logger } from "@/lib/logger";

const schema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().max(20).optional(),
  customerNote: z.string().max(500).optional(),
  deliveryType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().int().min(0),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(50),
  promoId: z.string().nullable().optional(),
  outletId: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Buat order publik. Server menghitung ulang subtotal/diskon/total
 * untuk mencegah manipulasi harga dari client.
 */
export const POST = withErrorHandler<Ctx>(async (req, { params }) => {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`order:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) throw tooMany();

  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) throw notFound("Toko tidak ditemukan atau tidak aktif.");

  const data = schema.parse(await req.json());

  if (data.deliveryType === "DELIVERY" && !data.deliveryAddress) {
    throw badRequest("Alamat pengiriman wajib diisi untuk tipe DELIVERY.");
  }

  // Re-fetch produk dari DB & validasi stok.
  const productIds = data.items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: tenant.id, isActive: true },
  });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  const itemsForCreate: { productId: string; name: string; price: number; quantity: number; subtotal: number }[] = [];
  for (const item of data.items) {
    const p = productMap.get(item.productId);
    if (!p) throw badRequest(`Produk "${item.name}" tidak tersedia.`);
    if (p.stock < item.quantity) throw badRequest(`Stok "${p.name}" tidak cukup (tersisa ${p.stock}).`);
    const lineSub = p.price * item.quantity;
    subtotal += lineSub;
    itemsForCreate.push({ productId: p.id, name: p.name, price: p.price, quantity: item.quantity, subtotal: lineSub });
  }

  // Hitung promo di server.
  let discountAmount = 0;
  let promoId: string | null = null;
  if (data.promoId) {
    const promo = await prisma.promo.findFirst({
      where: { id: data.promoId, tenantId: tenant.id, isActive: true },
    });
    if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && subtotal >= promo.minOrder) {
      discountAmount = promo.type === "PERCENT" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
      if (promo.type === "PERCENT" && promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
      promoId = promo.id;
    }
  }
  const total = Math.max(0, subtotal - discountAmount);
  const orderNumber = generateOrderNumber();

  // Validate outlet belongs to this tenant (best-effort; ignore invalid).
  let outletId: string | null = null;
  if (data.outletId) {
    const outlet = await prisma.outlet.findFirst({
      where: { id: data.outletId, tenantId: tenant.id, isActive: true },
      select: { id: true },
    });
    outletId = outlet?.id ?? null;
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber,
        customerName: sanitizeText(data.customerName, 100),
        customerPhone: data.customerPhone ? sanitizeText(data.customerPhone, 20) : null,
        customerNote: data.customerNote ? sanitizeText(data.customerNote, 500) : null,
        deliveryType: data.deliveryType,
        deliveryAddress: data.deliveryAddress ? sanitizeText(data.deliveryAddress, 300) : null,
        subtotal,
        discountAmount,
        total,
        promoId,
        outletId,
        status: "WAITING_PAYMENT",
        items: { create: itemsForCreate },
      },
    });
    for (const item of itemsForCreate) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await tx.auditLog.create({
      data: { tenantId: tenant.id, action: "CREATE_ORDER", entity: "Order", entityId: o.id, meta: JSON.stringify({ total }) },
    });
    return o;
  });

  // Kirim WA ke owner (best-effort).
  if (tenant.phone && (await hasFeature(tenant.id, "whatsappNotif"))) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    sendWhatsApp(
      tenant.phone,
      buildNewOrderMessage({ name: tenant.name, slug: tenant.slug, phone: tenant.phone }, order, baseUrl),
    ).catch((e) => logger.warn("WA owner notif fail", { err: String(e) }));
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
  });
});
