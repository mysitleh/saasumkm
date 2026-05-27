import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, badRequest, notFound } from "@/lib/api-handler";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET: Cari order berdasarkan nomor order atau nama customer.
 * Public endpoint — customer bisa cek status tanpa login.
 */
export const GET = withErrorHandler<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) throw badRequest("Query pencarian diperlukan.");

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (!tenant) throw notFound("Toko tidak ditemukan.");

  const order = await prisma.order.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        { orderNumber: q.toUpperCase() },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { name: true, quantity: true, price: true } } },
  });

  if (!order) throw notFound("Pesanan tidak ditemukan. Pastikan nomor order atau nama benar.");

  return NextResponse.json({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items,
  });
});
