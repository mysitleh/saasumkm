import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, badRequest, notFound } from "@/lib/api-handler";
import { getCustomerLoyalty } from "@/lib/loyalty";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET: Cek poin loyalty customer berdasarkan nomor HP.
 * Public endpoint — customer bisa cek poin mereka.
 */
export const GET = withErrorHandler<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim();
  if (!phone) throw badRequest("Nomor HP diperlukan.");

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (!tenant) throw notFound("Toko tidak ditemukan.");

  const card = await getCustomerLoyalty(tenant.id, phone);
  if (!card) {
    return NextResponse.json({ found: false, points: 0, message: "Belum ada kartu loyalty. Belanja untuk mulai kumpulkan poin!" });
  }

  return NextResponse.json({
    found: true,
    customerName: card.customerName,
    points: card.points,
    totalSpent: card.totalSpent,
    totalOrders: card.totalOrders,
    recentLogs: card.pointLogs.map((l) => ({
      type: l.type,
      points: l.points,
      reason: l.reason,
      date: l.createdAt,
    })),
  });
});
