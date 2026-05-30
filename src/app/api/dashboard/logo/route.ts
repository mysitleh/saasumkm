import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { isValidHex } from "@/lib/theme-runtime";

const schema = z.object({
  shape: z.enum(["squircle", "circle", "rounded", "hexagon", "shield", "blob", "diamond", "none"]),
  symbol: z.enum(["awning", "bag", "storefront", "spark", "bolt", "leaf", "cup", "tag", "monogram"]),
  fill: z.enum(["solid", "gradient", "soft", "outline"]),
  color: z.string().refine(isValidHex, "Hex tidak valid"),
  accent: z.string().refine(isValidHex, "Hex tidak valid"),
  symbolColor: z.string().refine(isValidHex, "Hex tidak valid").optional(),
  initial: z.string().max(2).optional(),
  pip: z.boolean().optional(),
});

/** Save a tenant's custom logo config (Logo Builder GUI submits here). */
export const PUT = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden("Hanya pemilik yang bisa mengubah logo.");

  const body = schema.parse(await req.json());
  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { logoConfig: JSON.stringify(body) },
  });

  return NextResponse.json({ success: true, logo: body });
});

/** Reset logo to platform default. */
export const DELETE = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { logoConfig: null },
  });

  return NextResponse.json({ success: true });
});
