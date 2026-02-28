import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ name: z.string().min(1), description: z.string().optional(), price: z.number().min(0), stock: z.number().min(0), imageUrl: z.string().optional(), categoryId: z.string().nullable().optional() });
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const p = schema.safeParse(await req.json());
    if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
    const product = await prisma.product.create({ data: { ...p.data, tenantId: session.user.tenantId, description: p.data.description||null, imageUrl: p.data.imageUrl||null, categoryId: p.data.categoryId||null } });
    return NextResponse.json({ success: true, product });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
