import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden, badRequest } from "@/lib/api-handler";
import { hasFeature } from "@/lib/features";
import { sendWhatsApp } from "@/lib/notifications";
import { logger } from "@/lib/logger";

const schema = z.object({
  message: z.string().min(5).max(1000),
  target: z.enum(["all", "recent"]).default("all"),
});

/**
 * POST: Broadcast pesan WhatsApp ke semua pelanggan yang punya nomor HP.
 * Gated: hanya paket Pro+ (whatsappNotif feature).
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  if (!(await hasFeature(session.user.tenantId, "whatsappNotif"))) {
    throw forbidden("Fitur broadcast WhatsApp hanya tersedia di paket Pro ke atas.");
  }

  const data = schema.parse(await req.json());
  const tenantId = session.user.tenantId;

  // Get unique phone numbers
  const daysFilter = data.target === "recent" ? 30 : 365;
  const since = new Date(Date.now() - daysFilter * 24 * 60 * 60_000);

  const phones = await prisma.$queryRawUnsafe<{ phone: string }[]>(
    `SELECT DISTINCT customerPhone AS phone
     FROM orders
     WHERE tenantId = ? AND customerPhone IS NOT NULL AND customerPhone != '' AND createdAt >= ?`,
    tenantId,
    since.toISOString(),
  );

  if (phones.length === 0) throw badRequest("Tidak ada pelanggan dengan nomor HP.");
  if (phones.length > 500) throw badRequest("Maksimal 500 penerima per broadcast.");

  // Send messages (best-effort, non-blocking)
  let sent = 0;
  let failed = 0;
  for (const { phone } of phones) {
    const result = await sendWhatsApp(phone, data.message);
    if (result.ok) sent++;
    else failed++;
  }

  logger.info("Broadcast sent", { tenantId, sent, failed, total: phones.length });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId,
      action: "BROADCAST_WA",
      entity: "Broadcast",
      meta: JSON.stringify({ sent, failed, total: phones.length, target: data.target }),
    },
  });

  return NextResponse.json({ success: true, sent, failed, total: phones.length });
});
