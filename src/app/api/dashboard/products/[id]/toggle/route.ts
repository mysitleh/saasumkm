import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const product = await prisma.product.findFirst({ where: { id, tenantId: session.user.tenantId } });
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    const updated = await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
