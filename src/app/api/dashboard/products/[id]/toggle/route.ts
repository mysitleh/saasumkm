import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, notFound } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true, isActive: true },
  });
  if (!product) throw notFound("Produk tidak ditemukan.");
  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
    select: { isActive: true },
  });
  return NextResponse.json({ success: true, isActive: updated.isActive });
});
