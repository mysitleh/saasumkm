import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, conflict } from "@/lib/api-handler";

const schema = z.object({
  code: z.string().min(2).max(20),
  type: z.enum(["PERCENT", "NOMINAL"]),
  value: z.number().int().min(1),
  minOrder: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().min(0).nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perCustomerLimit: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const data = schema.parse(await req.json());
  const code = data.code.toUpperCase();

  const existing = await prisma.promo.findFirst({
    where: { tenantId: session.user.tenantId, code },
    select: { id: true },
  });
  if (existing) throw conflict("Kode promo sudah digunakan.");

  if (data.type === "PERCENT" && data.value > 100) {
    throw conflict("Diskon persen maksimal 100.");
  }

  const promo = await prisma.promo.create({
    data: {
      tenantId: session.user.tenantId,
      code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      perCustomerLimit: data.perCustomerLimit ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return NextResponse.json({ success: true, promo });
});
