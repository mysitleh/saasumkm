import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, badRequest, notFound } from "@/lib/api-handler";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = withErrorHandler<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const subtotal = parseInt(url.searchParams.get("subtotal") || "0", 10);
  if (!code) throw badRequest("Kode diperlukan.");

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (!tenant) throw notFound("Toko tidak ditemukan.");

  const promo = await prisma.promo.findFirst({
    where: {
      tenantId: tenant.id,
      code: code.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (!promo) throw notFound("Kode promo tidak valid.");
  if (subtotal < promo.minOrder) {
    throw badRequest(`Min. order Rp ${promo.minOrder.toLocaleString("id-ID")}`);
  }

  let discount = promo.type === "PERCENT" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  if (promo.type === "PERCENT" && promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  const label = promo.type === "PERCENT" ? `Diskon ${promo.value}%` : `Diskon Rp ${promo.value.toLocaleString("id-ID")}`;
  return NextResponse.json({ promoId: promo.id, discount, label });
});
