import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET: List unique customers dari order history tenant.
 * CRM sederhana — aggregate data dari orders.
 */
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const tenantId = session.user.tenantId;

  const url = new URL(req.url);
  const search = url.searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  let customers: { name: string; phone: string | null; totalOrders: number; totalSpent: number; lastOrderAt: string }[];
  let totalCount: number;

  if (search) {
    const pattern = `%${search}%`;
    customers = await prisma.$queryRawUnsafe(
      `SELECT customerName AS name, customerPhone AS phone, COUNT(*) AS totalOrders, SUM(total) AS totalSpent, MAX(createdAt) AS lastOrderAt
       FROM orders WHERE tenantId = ? AND (customerName LIKE ? OR customerPhone LIKE ?)
       GROUP BY customerName, customerPhone ORDER BY lastOrderAt DESC LIMIT ? OFFSET ?`,
      tenantId, pattern, pattern, pageSize, offset,
    );
    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (SELECT DISTINCT customerName, customerPhone FROM orders WHERE tenantId = ? AND (customerName LIKE ? OR customerPhone LIKE ?))`,
      tenantId, pattern, pattern,
    );
    totalCount = Number(countResult[0]?.count ?? 0);
  } else {
    customers = await prisma.$queryRawUnsafe(
      `SELECT customerName AS name, customerPhone AS phone, COUNT(*) AS totalOrders, SUM(total) AS totalSpent, MAX(createdAt) AS lastOrderAt
       FROM orders WHERE tenantId = ?
       GROUP BY customerName, customerPhone ORDER BY lastOrderAt DESC LIMIT ? OFFSET ?`,
      tenantId, pageSize, offset,
    );
    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (SELECT DISTINCT customerName, customerPhone FROM orders WHERE tenantId = ?)`,
      tenantId,
    );
    totalCount = Number(countResult[0]?.count ?? 0);
  }

  return NextResponse.json({
    customers: customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      totalOrders: Number(c.totalOrders),
      totalSpent: Number(c.totalSpent),
      lastOrderAt: c.lastOrderAt,
    })),
    total: totalCount,
    page,
    pageSize,
  });
});
