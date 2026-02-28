import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";
const schema = z.object({
  customerName: z.string().min(1), customerPhone: z.string().optional(), customerNote: z.string().optional(),
  deliveryType: z.enum(["PICKUP","DELIVERY"]), deliveryAddress: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), name: z.string(), price: z.number(), quantity: z.number().min(1) })).min(1),
  promoId: z.string().nullable().optional(), subtotal: z.number(), discountAmount: z.number().default(0), total: z.number()
});
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    const p = schema.safeParse(await req.json());
    if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
    const data = p.data;
    for (const item of data.items) {
      const prod = await prisma.product.findFirst({ where: { id: item.productId, tenantId: tenant.id, isActive: true } });
      if (!prod) return NextResponse.json({ error: `Produk "${item.name}" tidak ditemukan.` }, { status: 400 });
      if (prod.stock < item.quantity) return NextResponse.json({ error: `Stok "${item.name}" tidak cukup.` }, { status: 400 });
    }
    const orderNumber = generateOrderNumber();
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({ data: { tenantId: tenant.id, orderNumber, customerName: data.customerName, customerPhone: data.customerPhone||null, customerNote: data.customerNote||null, deliveryType: data.deliveryType, deliveryAddress: data.deliveryAddress||null, subtotal: data.subtotal, discountAmount: data.discountAmount, total: data.total, promoId: data.promoId||null, status: "WAITING_PAYMENT", items: { create: data.items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, subtotal: i.price*i.quantity })) } } });
      for (const item of data.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      return o;
    });
    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
