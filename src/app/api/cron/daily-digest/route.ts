import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { jakartaNow, sendDailyDigest } from "@/lib/daily-digest";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron: Daily digest dispatcher.
 *
 * Run HOURLY (`0 * * * *`). For each active Pro+ tenant whose
 * `dailyDigestHour` equals the current Asia/Jakarta hour, build & send
 * the daily digest. Idempotent — re-runs in the same hour are no-ops.
 *
 * Optional query `?force=1&hour=21` overrides the hour gate (for manual
 * trigger / testing). `?tenantId=...` limits to one tenant.
 */
export const GET = withErrorHandler(async (req: Request) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const onlyTenant = url.searchParams.get("tenantId");
  const { dateKey, hour: nowHour } = jakartaNow();
  const targetHour = url.searchParams.get("hour") ? Number(url.searchParams.get("hour")) : nowHour;

  // Eligible tenants: active, Pro/Business, digest enabled, hour match.
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      dailyDigestEnabled: true,
      ...(onlyTenant ? { id: onlyTenant } : {}),
      ...(force ? {} : { dailyDigestHour: targetHour }),
      subscription: { status: { in: ["ACTIVE", "TRIAL"] }, plan: { in: ["PRO", "BUSINESS"] } },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      notifyWhatsapp: true,
      notifyTelegram: true,
      telegramChatId: true,
    },
  });

  const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  for (const t of tenants) {
    const res = await sendDailyDigest(
      {
        id: t.id,
        name: t.name,
        phone: t.phone,
        notifyWhatsapp: t.notifyWhatsapp,
        notifyTelegram: t.notifyTelegram,
        telegramChatId: t.telegramChatId,
      },
      dateKey,
    );
    summary.processed += 1;
    summary.sent += res.sent.length;
    summary.skipped += res.skipped.length;
    summary.failed += res.failed.length;
  }

  logger.info("Daily digest cron completed", { dateKey, targetHour, ...summary });
  return NextResponse.json({ success: true, dateKey, targetHour, ...summary });
});
