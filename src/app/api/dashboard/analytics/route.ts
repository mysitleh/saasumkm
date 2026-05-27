import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Analytics ringkas: omzet harian 14 hari terakhir + top 5 produk.
 * Menggunakan raw SQL SQLite untuk groupBy berbasis tanggal.
 */
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const tenantId = session.user.tenantId;

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") ?? "14", 10)));
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  since.setHours(0, 0, 0, 0);

  const [paidStatuses, dailyRows, topProductsRows, statusCounts] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.$queryRawUnsafe<{ day: string; total: number; count: number }[]>(
      `SELECT strftime('%Y-%m-%d', createdAt) AS day, SUM(total) AS total, COUNT(*) AS count
       FROM orders
       WHERE tenantId = ? AND createdAt >= ? AND status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
       GROUP BY day
       ORDER BY day ASC`,
      tenantId,
      since.toISOString(),
    ),
    prisma.$queryRawUnsafe<{ name: string; quantity: number; revenue: number }[]>(
      `SELECT oi.name AS name, SUM(oi.quantity) AS quantity, SUM(oi.subtotal) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.orderId
       WHERE o.tenantId = ? AND o.createdAt >= ? AND o.status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
       GROUP BY oi.name
       ORDER BY quantity DESC
       LIMIT 5`,
      tenantId,
      since.toISOString(),
    ),
    prisma.order.groupBy({
      by: ["status"],
      where: { tenantId, createdAt: { gte: since } },
      _count: true,
    }),
  ]);

  // Backfill hari-hari yang tidak punya transaksi → 0.
  const dailyMap = new Map(dailyRows.map((r) => [r.day, { total: Number(r.total ?? 0), count: Number(r.count ?? 0) }]));
  const daily: { day: string; total: number; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ day: key, ...(dailyMap.get(key) ?? { total: 0, count: 0 }) });
  }

  return NextResponse.json({
    rangeDays: days,
    revenue: paidStatuses._sum.total ?? 0,
    paidCount: paidStatuses._count ?? 0,
    daily,
    topProducts: topProductsRows.map((r) => ({
      name: r.name,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
    })),
    statusCounts: statusCounts.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count;
      return acc;
    }, {}),
  });
});
