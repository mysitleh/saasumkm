import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden, badRequest } from "@/lib/api-handler";
import { sendWhatsApp, sendTelegram } from "@/lib/notifications";
import { buildDigestData, renderDigestMessage, jakartaNow } from "@/lib/daily-digest";

const schema = z.object({
  notifyWhatsapp: z.boolean().optional(),
  notifyTelegram: z.boolean().optional(),
  telegramChatId: z.string().max(40).optional().or(z.literal("")),
  dailyDigestEnabled: z.boolean().optional(),
  dailyDigestHour: z.number().int().min(0).max(23).optional(),
  lowStockThreshold: z.number().int().min(0).max(999).optional(),
});

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const t = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      phone: true,
      notifyWhatsapp: true,
      notifyTelegram: true,
      telegramChatId: true,
      dailyDigestEnabled: true,
      dailyDigestHour: true,
      lowStockThreshold: true,
    },
  });
  return NextResponse.json({ config: t });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  const body = schema.parse(await req.json());
  const t = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      notifyWhatsapp: body.notifyWhatsapp ?? undefined,
      notifyTelegram: body.notifyTelegram ?? undefined,
      telegramChatId: body.telegramChatId === undefined ? undefined : body.telegramChatId || null,
      dailyDigestEnabled: body.dailyDigestEnabled ?? undefined,
      dailyDigestHour: body.dailyDigestHour ?? undefined,
      lowStockThreshold: body.lowStockThreshold ?? undefined,
    },
    select: {
      notifyWhatsapp: true,
      notifyTelegram: true,
      telegramChatId: true,
      dailyDigestEnabled: true,
      dailyDigestHour: true,
      lowStockThreshold: true,
    },
  });
  return NextResponse.json({ success: true, config: t });
});

/**
 * POST — test send. `{ "channel": "whatsapp" | "telegram", "preview": true }`
 * Sends today's digest (or a hello message) to verify the channel works.
 */
const testSchema = z.object({
  channel: z.enum(["whatsapp", "telegram"]),
  preview: z.boolean().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  const body = testSchema.parse(await req.json());

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, name: true, phone: true, telegramChatId: true },
  });
  if (!tenant) throw unauthorized();

  const { dateKey } = jakartaNow();
  let message: string;
  if (body.preview) {
    const data = await buildDigestData(tenant.id, dateKey);
    message = renderDigestMessage(data);
  } else {
    message = `✅ Tes notifikasi dari *${tenant.name}* berhasil. Channel ini siap menerima laporan harian.`;
  }

  if (body.channel === "whatsapp") {
    if (!tenant.phone) throw badRequest("Nomor WhatsApp belum diatur di Pengaturan toko.");
    const r = await sendWhatsApp(tenant.phone, message);
    if (!r.ok) throw badRequest(`Gagal kirim WhatsApp: ${r.reason}. Pastikan FONNTE_TOKEN aktif.`);
  } else {
    if (!tenant.telegramChatId) throw badRequest("Telegram Chat ID belum diisi.");
    const r = await sendTelegram(tenant.telegramChatId, message);
    if (!r.ok) throw badRequest(`Gagal kirim Telegram: ${r.reason}. Pastikan TELEGRAM_BOT_TOKEN aktif & Chat ID benar.`);
  }

  return NextResponse.json({ success: true });
});
