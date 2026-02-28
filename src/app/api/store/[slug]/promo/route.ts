import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const subtotal = parseInt(searchParams.get("subtotal")||"0");
    if (!code) return NextResponse.json({ error: "Kode diperlukan." }, { status: 400 });
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    const promo = await prisma.promo.findFirst({ where: { tenantId: tenant.id, code: code.toUpperCase(), isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    if (!promo) return NextResponse.json({ error: "Kode promo tidak valid." }, { status: 404 });
    if (subtotal < promo.minOrder) return NextResponse.json({ error: `Min. order Rp ${promo.minOrder.toLocaleString("id-ID")}` }, { status: 400 });
    let discount = promo.type === "PERCENT" ? Math.floor(subtotal*promo.value/100) : promo.value;
    if (promo.type === "PERCENT" && promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    const label = promo.type === "PERCENT" ? `Diskon ${promo.value}%` : `Diskon Rp ${promo.value.toLocaleString("id-ID")}`;
    return NextResponse.json({ promoId: promo.id, discount, label });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
