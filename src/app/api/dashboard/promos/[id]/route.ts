import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, notFound } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH: toggle promo aktif/nonaktif.
 */
export const PATCH = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;

  const promo = await prisma.promo.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true, isActive: true },
  });
  if (!promo) throw notFound("Promo tidak ditemukan.");

  const updated = await prisma.promo.update({
    where: { id },
    data: { isActive: !promo.isActive },
    select: { id: true, isActive: true },
  });
  return NextResponse.json({ success: true, isActive: updated.isActive });
});

/**
 * DELETE: hapus promo.
 */
export const DELETE = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;

  const promo = await prisma.promo.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!promo) throw notFound("Promo tidak ditemukan.");

  await prisma.promo.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
