import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
const schema = z.object({ ownerName: z.string().min(2), email: z.string().email(), password: z.string().min(6), storeName: z.string().min(2), storeSlug: z.string().min(2).regex(/^[a-z0-9-]+$/), phone: z.string().optional() });
export async function POST(req: NextRequest) {
  try {
    const p = schema.safeParse(await req.json());
    if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
    const { ownerName, email, password, storeName, storeSlug, phone } = p.data;
    if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    if (await prisma.tenant.findUnique({ where: { slug: storeSlug } })) return NextResponse.json({ error: "Slug sudah digunakan." }, { status: 400 });
    const hash = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: storeName, slug: storeSlug, phone: phone||null } });
      const user = await tx.user.create({ data: { name: ownerName, email, password: hash, role: "OWNER", tenantId: tenant.id } });
      return { tenant, user };
    });
    return NextResponse.json({ success: true, tenantSlug: result.tenant.slug });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error." }, { status: 500 }); }
}
