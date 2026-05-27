import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET: Ringkasan performa mingguan & bulanan.
 * Berguna untuk notifikasi WA mingguan atau dashboard summary.
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const tenantId = session.user.tenantId;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const paidStatuses = ["PAID_MANUAL", "PROCESSING", "COMPLETED"];

  const [weeklyRevenue, weeklyOrders, monthlyRevenue, monthlyOrders, lastMonthRevenue, lastMonthOrders, topProduct] =
    await Promise.all([
      prisma.order.aggregate({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfWeek } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfWeek } },
      }),
      prisma.order.aggregate({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfMonth } },
      }),
      prisma.order.aggregate({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { tenantId, status: { in: paidStatuses }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.$queryRawUnsafe<{ name: string; qty: number }[]>(
        `SELECT oi.name AS name, SUM(oi.quantity) AS qty
         FROM order_items oi JOIN orders o ON o.id = oi.orderId
         WHERE o.tenantId = ? AND o.createdAt >= ? AND o.status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
         GROUP BY oi.name ORDER BY qty DESC LIMIT 1`,
        tenantId,
        startOfMonth.toISOString(),
      ),
    ]);

  const monthGrowth =
    lastMonthRevenue._sum.total && monthlyRevenue._sum.total
      ? Math.round(((monthlyRevenue._sum.total - lastMonthRevenue._sum.total) / lastMonthRevenue._sum.total) * 100)
      : null;

  return NextResponse.json({
    weekly: {
      revenue: weeklyRevenue._sum.total ?? 0,
      orders: weeklyOrders,
    },
    monthly: {
      revenue: monthlyRevenue._sum.total ?? 0,
      orders: monthlyOrders,
      growth: monthGrowth,
    },
    lastMonth: {
      revenue: lastMonthRevenue._sum.total ?? 0,
      orders: lastMonthOrders,
    },
    topProductThisMonth: topProduct[0] ? { name: topProduct[0].name, quantity: Number(topProduct[0].qty) } : null,
  });
});
