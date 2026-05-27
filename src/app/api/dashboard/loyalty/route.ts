import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET: List loyalty cards untuk tenant (top customers by points).
 */
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 30;

  const [cards, total] = await Promise.all([
    prisma.loyaltyCard.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { points: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.loyaltyCard.count({ where: { tenantId: session.user.tenantId } }),
  ]);

  return NextResponse.json({ cards, total, page, pageSize });
});
