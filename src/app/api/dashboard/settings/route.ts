import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.tenantId || session.user.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, description, logoUrl, address, phone, qrisImageUrl } = await req.json();
    if (!name) return NextResponse.json({ error: "Nama toko diperlukan." }, { status: 400 });
    const tenant = await prisma.tenant.update({ where: { id: session.user.tenantId }, data: { name, description: description||null, logoUrl: logoUrl||null, address: address||null, phone: phone||null, qrisImageUrl: qrisImageUrl||null } });
    return NextResponse.json({ success: true, tenant });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
