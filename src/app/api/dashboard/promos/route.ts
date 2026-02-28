import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ code: z.string().min(2).max(20), type: z.enum(["PERCENT","NOMINAL"]), value: z.number().min(1), minOrder: z.number().min(0).default(0), maxDiscount: z.number().nullable().optional(), expiresAt: z.string().nullable().optional() });
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const p = schema.safeParse(await req.json());
    if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
    const { code, type, value, minOrder, maxDiscount, expiresAt } = p.data;
    const existing = await prisma.promo.findFirst({ where: { tenantId: session.user.tenantId, code: code.toUpperCase() } });
    if (existing) return NextResponse.json({ error: "Kode promo sudah digunakan." }, { status: 400 });
    const promo = await prisma.promo.create({ data: { tenantId: session.user.tenantId, code: code.toUpperCase(), type, value, minOrder, maxDiscount: maxDiscount??null, expiresAt: expiresAt ? new Date(expiresAt) : null } });
    return NextResponse.json({ success: true, promo });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
