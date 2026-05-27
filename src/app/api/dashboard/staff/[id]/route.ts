import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden, notFound } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH: toggle aktif/nonaktif kasir.
 */
export const PATCH = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId, role: "CASHIER" },
    select: { id: true, isActive: true },
  });
  if (!user) throw notFound("Staff tidak ditemukan.");

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  });
  return NextResponse.json({ success: true, isActive: updated.isActive });
});

/**
 * DELETE: hapus kasir (soft: nonaktifkan).
 */
export const DELETE = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId, role: "CASHIER" },
    select: { id: true },
  });
  if (!user) throw notFound("Staff tidak ditemukan.");

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
});
