import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Nama diperlukan." }, { status: 400 });
    const category = await prisma.category.create({ data: { name, tenantId: session.user.tenantId } });
    return NextResponse.json({ success: true, category });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
