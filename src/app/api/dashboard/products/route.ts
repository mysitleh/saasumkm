import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { checkProductLimit, PLAN_LABELS } from "@/lib/features";
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

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const limit = await checkProductLimit(session.user.tenantId);
  if (!limit.ok) {
    throw forbidden(
      `Paket ${PLAN_LABELS[limit.plan]} hanya mengizinkan ${limit.max} produk. Upgrade paket untuk menambah lebih banyak.`,
    );
  }

  const body = schema.parse(await req.json());
  const product = await prisma.product.create({
    data: {
      tenantId: session.user.tenantId,
      name: sanitizeText(body.name, 120),
      description: body.description ? sanitizeText(body.description, 2000) : null,
      price: body.price,
      stock: body.stock,
      imageUrl: body.imageUrl || null,
      categoryId: body.categoryId || null,
      variants: body.variants || null,
    },
  });
  return NextResponse.json({ success: true, product });
});
