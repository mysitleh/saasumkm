import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";

const schema = z.object({
  updates: z.array(
    z.object({
      id: z.string().min(1),
      stock: z.number().int().min(0).max(1_000_000),
    }),
  ).min(1).max(200),
});

/**
 * PATCH: Bulk update stok produk.
 */
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const tenantId = session.user.tenantId;
  const { updates } = schema.parse(await req.json());

  let updated = 0;
  for (const { id, stock } of updates) {
    const result = await prisma.product.updateMany({
      where: { id, tenantId },
      data: { stock },
    });
    updated += result.count;
  }

  return NextResponse.json({ success: true, updated });
});
