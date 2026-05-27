import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  qrisImageUrl: z.string().url().optional().or(z.literal("")),
  themeColor: z.enum(["green", "blue", "purple", "orange", "rose", "slate"]).optional(),
});

export const PUT = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden("Hanya pemilik yang bisa mengubah pengaturan toko.");
  const body = schema.parse(await req.json());
  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      name: sanitizeText(body.name, 80),
      description: body.description ? sanitizeText(body.description, 500) : null,
      logoUrl: body.logoUrl || null,
      address: body.address ? sanitizeText(body.address, 200) : null,
      phone: body.phone ? sanitizeText(body.phone, 20) : null,
      qrisImageUrl: body.qrisImageUrl || null,
      themeColor: body.themeColor ?? undefined,
    },
  });
  return NextResponse.json({ success: true, tenant });
});
