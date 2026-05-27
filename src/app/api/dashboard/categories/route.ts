import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized } from "@/lib/api-handler";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({ name: z.string().min(1).max(50) });

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const { name } = schema.parse(await req.json());
  const category = await prisma.category.create({
    data: { name: sanitizeText(name, 50), tenantId: session.user.tenantId },
  });
  return NextResponse.json({ success: true, category });
});
