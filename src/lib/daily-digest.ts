/**
 * Daily Digest engine.
 *
 * Builds the owner's "what happened today" summary, broken down per outlet,
 * and fans it out to enabled channels (WhatsApp / Telegram) with idempotency
 * (a tenant cannot receive the same day's digest twice on the same channel).
 *
 * Designed to be called from a cron that runs hourly; each tenant is only
 * sent when the current Asia/Jakarta hour matches their `dailyDigestHour`.
 */

import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { notifyOwner, type NotifChannel } from "@/lib/notifications";
import { logger } from "@/lib/logger";

const PAID = ["PAID_MANUAL", "PROCESSING", "COMPLETED"];

/** Current date + hour in Asia/Jakarta (UTC+7) regardless of server TZ. */
export function jakartaNow(d = new Date()): { dateKey: string; hour: number } {
  const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const dateKey = local.toISOString().slice(0, 10); // YYYY-MM-DD
  const hour = local.getUTCHours();
  return { dateKey, hour };
}

interface OutletLine {
  name: string;
  orders: number;
  revenue: number;
}

export interface DigestData {
  tenantId: string;
  tenantName: string;
  dateKey: string;
  totalRevenue: number;
  totalOrders: number;
  pendingPayment: number;
  newCustomers: number;
  topProduct: { name: string; qty: number } | null;
  outlets: OutletLine[];
  unassignedOrders: number;
  lowStock: Array<{ name: string; stock: number }>;
  deltaVsYesterday: number | null; // % change in revenue
}

/** Collect today's metrics for a tenant (Asia/Jakarta day window). */
export async function buildDigestData(tenantId: string, dateKey: string): Promise<DigestData> {
  // Day window in UTC: Jakarta 00:00 = UTC 17:00 previous day.
  const startUtc = new Date(`${dateKey}T00:00:00+07:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  const prevStart = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, lowStockThreshold: true },
  });

  const [agg, pending, prevAgg, outlets, topRows, lowStockRows, newCust] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId, status: { in: PAID }, createdAt: { gte: startUtc, lt: endUtc } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({
      where: { tenantId, status: "WAITING_PAYMENT", createdAt: { gte: startUtc, lt: endUtc } },
    }),
    prisma.order.aggregate({
      where: { tenantId, status: { in: PAID }, createdAt: { gte: prevStart, lt: startUtc } },
      _sum: { total: true },
    }),
    // per-outlet breakdown
    prisma.$queryRawUnsafe<{ outletId: string | null; orders: number; revenue: number }[]>(
      `SELECT outletId, COUNT(*) AS orders, SUM(total) AS revenue
       FROM orders
       WHERE tenantId = ? AND status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
         AND createdAt >= ? AND createdAt < ?
       GROUP BY outletId`,
      tenantId,
      startUtc.toISOString(),
      endUtc.toISOString(),
    ),
    prisma.$queryRawUnsafe<{ name: string; qty: number }[]>(
      `SELECT oi.name AS name, SUM(oi.quantity) AS qty
       FROM order_items oi JOIN orders o ON o.id = oi.orderId
       WHERE o.tenantId = ? AND o.status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
         AND o.createdAt >= ? AND o.createdAt < ?
       GROUP BY oi.name ORDER BY qty DESC LIMIT 1`,
      tenantId,
      startUtc.toISOString(),
      endUtc.toISOString(),
    ),
    prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { lte: tenant?.lowStockThreshold ?? 5 } },
      select: { name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (
         SELECT customerName, customerPhone, MIN(createdAt) AS firstAt
         FROM orders WHERE tenantId = ? GROUP BY customerName, customerPhone
         HAVING firstAt >= ? AND firstAt < ?
       )`,
      tenantId,
      startUtc.toISOString(),
      endUtc.toISOString(),
    ),
  ]);

  // Resolve outlet names
  const outletIds = outlets.map((o) => o.outletId).filter((x): x is string => !!x);
  const outletMap = new Map<string, string>();
  if (outletIds.length) {
    const rows = await prisma.outlet.findMany({
      where: { id: { in: outletIds } },
      select: { id: true, name: true },
    });
    for (const r of rows) outletMap.set(r.id, r.name);
  }

  const outletLines: OutletLine[] = outlets
    .filter((o) => o.outletId)
    .map((o) => ({
      name: outletMap.get(o.outletId!) ?? "Outlet",
      orders: Number(o.orders),
      revenue: Number(o.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const unassigned = outlets.find((o) => !o.outletId);

  const todayRev = agg._sum.total ?? 0;
  const prevRev = prevAgg._sum.total ?? 0;
  const delta = prevRev > 0 ? Math.round(((todayRev - prevRev) / prevRev) * 100) : null;

  return {
    tenantId,
    tenantName: tenant?.name ?? "Toko",
    dateKey,
    totalRevenue: todayRev,
    totalOrders: agg._count ?? 0,
    pendingPayment: pending,
    newCustomers: Number(newCust[0]?.count ?? 0),
    topProduct: topRows[0] ? { name: topRows[0].name, qty: Number(topRows[0].qty) } : null,
    outlets: outletLines,
    unassignedOrders: unassigned ? Number(unassigned.orders) : 0,
    lowStock: lowStockRows.map((p) => ({ name: p.name, stock: p.stock })),
    deltaVsYesterday: delta,
  };
}

/** Render the digest as a Markdown/WhatsApp-friendly message. */
export function renderDigestMessage(d: DigestData): string {
  const dateLabel = new Date(`${d.dateKey}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`📊 *Laporan Harian — ${d.tenantName}*`);
  lines.push(`_${dateLabel}_`);
  lines.push("");
  lines.push(`💰 Omzet: *${formatRupiah(d.totalRevenue)}*`);
  if (d.deltaVsYesterday !== null) {
    const arrow = d.deltaVsYesterday >= 0 ? "▲" : "▼";
    lines.push(`   ${arrow} ${Math.abs(d.deltaVsYesterday)}% vs kemarin`);
  }
  lines.push(`🧾 Order dibayar: *${d.totalOrders}*`);
  if (d.pendingPayment > 0) lines.push(`⏳ Menunggu bayar: ${d.pendingPayment}`);
  if (d.newCustomers > 0) lines.push(`👤 Pelanggan baru: ${d.newCustomers}`);
  if (d.topProduct) lines.push(`🏆 Terlaris: ${d.topProduct.name} (${d.topProduct.qty}x)`);

  // Per-outlet breakdown
  if (d.outlets.length > 0) {
    lines.push("");
    lines.push(`🏪 *Per Outlet:*`);
    for (const o of d.outlets) {
      lines.push(`• ${o.name}: ${formatRupiah(o.revenue)} (${o.orders} order)`);
    }
    if (d.unassignedOrders > 0) {
      lines.push(`• Tanpa outlet: ${d.unassignedOrders} order`);
    }
  }

  // Low stock alert
  if (d.lowStock.length > 0) {
    lines.push("");
    lines.push(`⚠️ *Stok menipis:*`);
    for (const s of d.lowStock.slice(0, 6)) {
      lines.push(`• ${s.name}: ${s.stock} tersisa`);
    }
  }

  if (d.totalOrders === 0 && d.pendingPayment === 0) {
    lines.push("");
    lines.push(`Belum ada transaksi hari ini. Semangat besok! 💪`);
  }

  return lines.join("\n");
}

/**
 * Send the daily digest for one tenant with per-channel idempotency.
 * Returns a summary of what happened.
 */
export async function sendDailyDigest(
  tenant: {
    id: string;
    name: string;
    phone: string | null;
    notifyWhatsapp: boolean | null;
    notifyTelegram: boolean | null;
    telegramChatId: string | null;
  },
  dateKey: string,
): Promise<{ tenantId: string; sent: NotifChannel[]; skipped: NotifChannel[]; failed: NotifChannel[] }> {
  const dedupeKey = `DAILY_DIGEST:${dateKey}`;
  const sent: NotifChannel[] = [];
  const skipped: NotifChannel[] = [];
  const failed: NotifChannel[] = [];

  // Which channels are enabled?
  const channels: NotifChannel[] = [];
  if (tenant.notifyWhatsapp !== false && tenant.phone) channels.push("whatsapp");
  if (tenant.notifyTelegram && tenant.telegramChatId) channels.push("telegram");
  if (channels.length === 0) return { tenantId: tenant.id, sent, skipped, failed };

  // Idempotency: skip channels already logged as SENT today.
  const existing = await prisma.notificationLog.findMany({
    where: { tenantId: tenant.id, dedupeKey, status: "SENT" },
    select: { channel: true },
  });
  const already = new Set(existing.map((e) => e.channel));
  const pendingChannels = channels.filter((c) => !already.has(c));
  for (const c of channels) if (already.has(c)) skipped.push(c);
  if (pendingChannels.length === 0) return { tenantId: tenant.id, sent, skipped, failed };

  // Build message once.
  const data = await buildDigestData(tenant.id, dateKey);
  const message = renderDigestMessage(data);

  const results = await notifyOwner(
    {
      name: tenant.name,
      phone: tenant.phone,
      // Restrict fan-out to only the channels not yet sent.
      notifyWhatsapp: pendingChannels.includes("whatsapp") ? tenant.notifyWhatsapp : false,
      notifyTelegram: pendingChannels.includes("telegram") ? tenant.notifyTelegram : false,
      telegramChatId: tenant.telegramChatId,
    },
    message,
  );

  // Persist idempotent log per channel.
  for (const r of results) {
    if (r.ok) sent.push(r.channel);
    else failed.push(r.channel);
    try {
      await prisma.notificationLog.create({
        data: {
          tenantId: tenant.id,
          kind: "DAILY_DIGEST",
          channel: r.channel,
          dedupeKey,
          status: r.ok ? "SENT" : "FAILED",
          detail: r.ok ? null : (r.reason ?? "unknown"),
        },
      });
    } catch {
      // unique constraint hit = already logged; ignore.
    }
  }

  logger.info("Daily digest processed", { tenantId: tenant.id, sent, failed, skipped });
  return { tenantId: tenant.id, sent, skipped, failed };
}
