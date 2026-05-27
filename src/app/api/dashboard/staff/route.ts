import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withErrorHandler, unauthorized, forbidden, conflict } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";
import { sanitizeText } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

/**
 * GET: list staff (kasir) untuk tenant.
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  const staff = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId, role: "CASHIER" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ staff });
});

/**
 * POST: tambah kasir baru.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden("Hanya pemilik yang bisa menambah staff.");

  // Feature gate
  if (!(await hasFeature(session.user.tenantId, "staffManagement"))) {
    throw forbidden("Fitur staff management hanya tersedia di paket Business.");
  }

  const data = createSchema.parse(await req.json());
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() }, select: { id: true } });
  if (existing) throw conflict("Email sudah terdaftar.");

  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: sanitizeText(data.name, 80),
      email: data.email.toLowerCase(),
      password: hash,
      role: "CASHIER",
      tenantId: session.user.tenantId,
    },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ success: true, user });
});
