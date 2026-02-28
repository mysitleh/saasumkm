import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const TRANSITIONS: Record<string,string[]> = { WAITING_PAYMENT:["PAID_MANUAL","CANCELLED"], PAID_MANUAL:["PROCESSING","CANCELLED"], PROCESSING:["COMPLETED"] };
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { status: newStatus } = await req.json();
    const order = await prisma.order.findFirst({ where: { id, tenantId: session.user.tenantId } });
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    if (!(TRANSITIONS[order.status]??[]).includes(newStatus)) return NextResponse.json({ error: "Transisi status tidak valid." }, { status: 400 });
    const updated = await prisma.order.update({ where: { id }, data: { status: newStatus, paidAt: newStatus==="PAID_MANUAL" ? new Date() : undefined } });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE_ORDER_STATUS", entity: "Order", entityId: id, meta: JSON.stringify({ from: order.status, to: newStatus }) } });
    return NextResponse.json({ success: true, status: updated.status });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
