import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, notFound } from "@/lib/api-handler";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(0).max(1_000_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().nullable().optional(),
  variants: z.string().max(5000).nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandler<Ctx>(async (req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!product) throw notFound("Produk tidak ditemukan.");

  const body = schema.parse(await req.json());
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: sanitizeText(body.name, 120),
      description: body.description ? sanitizeText(body.description, 2000) : null,
      price: body.price,
      stock: body.stock,
      imageUrl: body.imageUrl || null,
      categoryId: body.categoryId || null,
      variants: body.variants || null,
    },
  });
  return NextResponse.json({ success: true, product: updated });
});

export const DELETE = withErrorHandler<Ctx>(async (_req, { params }) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!product) throw notFound("Produk tidak ditemukan.");

  // Soft delete: nonaktifkan agar history order tetap utuh.
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
});
