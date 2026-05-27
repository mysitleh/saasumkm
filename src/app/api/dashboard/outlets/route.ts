import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(80),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const outlets = await prisma.outlet.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ outlets });
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  if (!(await hasFeature(session.user.tenantId, "multiOutlet"))) {
    throw forbidden("Fitur multi outlet hanya tersedia di paket Business.");
  }

  // Limit 5 outlets
  const count = await prisma.outlet.count({ where: { tenantId: session.user.tenantId } });
  if (count >= 5) throw forbidden("Maksimal 5 outlet per tenant.");

  const data = schema.parse(await req.json());
  const outlet = await prisma.outlet.create({
    data: {
      tenantId: session.user.tenantId,
      name: sanitizeText(data.name, 80),
      address: data.address ? sanitizeText(data.address, 200) : null,
      phone: data.phone ? sanitizeText(data.phone, 20) : null,
    },
  });
  return NextResponse.json({ success: true, outlet });
});
