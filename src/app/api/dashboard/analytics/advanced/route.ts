import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";

export const dynamic = "force-dynamic";

/**
 * GET: Advanced analytics — repeat customers, avg order value, customer lifetime.
 * Gated: paket Pro+ (analyticsAdvanced).
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (!(await hasFeature(session.user.tenantId, "analyticsAdvanced"))) {
    throw forbidden("Analytics lanjutan hanya tersedia di paket Pro ke atas.");
  }
  const tenantId = session.user.tenantId;

  const [
    totalCustomers,
    repeatCustomers,
    avgOrderValue,
    ordersByMonth,
    customersByMonth,
  ] = await Promise.all([
    // Total unique customers
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(DISTINCT customerName || COALESCE(customerPhone,'')) AS count FROM orders WHERE tenantId = ?`,
      tenantId,
    ),
    // Repeat customers (2+ orders)
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (
        SELECT customerName, customerPhone FROM orders WHERE tenantId = ? GROUP BY customerName, customerPhone HAVING COUNT(*) >= 2
      )`,
      tenantId,
    ),
    // Average order value
    prisma.order.aggregate({
      where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] } },
      _avg: { total: true },
    }),
    // Orders per month (last 6 months)
    prisma.$queryRawUnsafe<{ month: string; orders: number; revenue: number }[]>(
      `SELECT strftime('%Y-%m', createdAt) AS month, COUNT(*) AS orders, SUM(total) AS revenue
       FROM orders WHERE tenantId = ? AND status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
       AND createdAt >= date('now', '-6 months')
       GROUP BY month ORDER BY month ASC`,
      tenantId,
    ),
    // New customers per month
    prisma.$queryRawUnsafe<{ month: string; newCustomers: number }[]>(
      `SELECT strftime('%Y-%m', MIN(createdAt)) AS month, COUNT(*) AS newCustomers
       FROM (SELECT customerName, customerPhone, MIN(createdAt) AS createdAt FROM orders WHERE tenantId = ? GROUP BY customerName, customerPhone)
       WHERE createdAt >= date('now', '-6 months')
       GROUP BY month ORDER BY month ASC`,
      tenantId,
    ),
  ]);

  const totalCust = Number(totalCustomers[0]?.count ?? 0);
  const repeatCust = Number(repeatCustomers[0]?.count ?? 0);
  const retentionRate = totalCust > 0 ? Math.round((repeatCust / totalCust) * 100) : 0;

  return NextResponse.json({
    totalCustomers: totalCust,
    repeatCustomers: repeatCust,
    retentionRate,
    avgOrderValue: Math.round(avgOrderValue._avg.total ?? 0),
    ordersByMonth: ordersByMonth.map((r) => ({
      month: r.month,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    customersByMonth: customersByMonth.map((r) => ({
      month: r.month,
      newCustomers: Number(r.newCustomers),
    })),
  });
});
