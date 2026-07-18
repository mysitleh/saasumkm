import { NextResponse } from "next/server";
import { expireOverdueSubscriptions } from "@/lib/subscription";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint: expire overdue subscriptions.
 *
 * Panggil harian via Vercel Cron atau external scheduler.
 * Dilindungi oleh header `Authorization: Bearer <CRON_SECRET>`.
 * Jika CRON_SECRET tidak di-set, endpoint terbuka (untuk dev).
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    logger.error("Cron: CRON_SECRET is missing");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const count = await expireOverdueSubscriptions();
    logger.info("Cron: expire-trials completed", { expired: count });
    return NextResponse.json({ success: true, expired: count });
  } catch (e) {
    logger.error("Cron: expire-trials failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
