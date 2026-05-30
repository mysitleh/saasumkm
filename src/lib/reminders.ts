import { prisma } from "@/lib/prisma";
import { GLYPH } from "@/lib/glyphs";
import { getActivePlan, getFeatureLimits } from "@/lib/features";
import type { TickerItem } from "@/components/MarqueeTicker";

/**
 * Build the dashboard ticker reminders from live tenant data.
 *
 * This is the seed of the future notification system: each rule turns a
 * real signal (unpaid orders, low stock, trial countdown, dead stock)
 * into a short ticker line. Later these same items can be pushed as
 * web/WA/Telegram notifications.
 */
export interface RemindersResult {
  items: TickerItem[];
  hasAlert: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

export async function buildReminders(tenantId: string): Promise<RemindersResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingCount, processingCount, lowStock, outOfStock, todayOrders, sub] = await Promise.all([
    prisma.order.count({ where: { tenantId, status: "WAITING_PAYMENT" } }),
    prisma.order.count({ where: { tenantId, status: "PROCESSING" } }),
    prisma.product.count({ where: { tenantId, isActive: true, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 0 } } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: today } } }),
    prisma.subscription.findUnique({ where: { tenantId } }),
  ]);

  const items: TickerItem[] = [];
  let hasAlert = false;

  if (pendingCount > 0) {
    hasAlert = true;
    items.push({ text: `${pendingCount} pesanan menunggu konfirmasi bayar`, glyph: GLYPH.circleRing, alert: true });
  }
  if (processingCount > 0) {
    items.push({ text: `${processingCount} pesanan sedang diproses`, glyph: GLYPH.hexFilled });
  }
  if (outOfStock > 0) {
    hasAlert = true;
    items.push({ text: `${outOfStock} produk stok habis - segera restock`, glyph: GLYPH.diamond, alert: true });
  }
  if (lowStock > 0) {
    items.push({ text: `${lowStock} produk stok menipis (<= ${LOW_STOCK_THRESHOLD})`, glyph: GLYPH.qOne });
  }
  if (todayOrders > 0) {
    items.push({ text: `${todayOrders} pesanan masuk hari ini`, glyph: GLYPH.up });
  }

  // Trial countdown
  if (sub?.status === "TRIAL" && sub.trialEndsAt) {
    const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60_000));
    if (daysLeft <= 0) {
      hasAlert = true;
      items.push({ text: "Trial Pro Anda sudah berakhir - upgrade untuk lanjut", glyph: GLYPH.premium, alert: true });
    } else if (daysLeft <= 7) {
      items.push({ text: `Trial Pro berakhir ${daysLeft} hari lagi`, glyph: GLYPH.premium, alert: daysLeft <= 3 });
      if (daysLeft <= 3) hasAlert = true;
    }
  }

  // Capacity nudge (approaching product limit on Basic)
  const [plan, limits] = await Promise.all([getActivePlan(tenantId), getFeatureLimits(tenantId)]);
  if (Number.isFinite(limits.maxProducts)) {
    const productCount = await prisma.product.count({ where: { tenantId } });
    const max = limits.maxProducts as number;
    if (productCount >= max * 0.8) {
      items.push({ text: `Produk ${productCount}/${max} - mendekati batas paket ${plan}`, glyph: GLYPH.hex });
    }
  }

  // Friendly fallback so the ticker is never empty.
  if (items.length === 0) {
    items.push({ text: "Semua beres - tidak ada yang perlu ditindaklanjuti", glyph: GLYPH.done });
    items.push({ text: "Tips: bagikan link toko Anda ke pelanggan via WhatsApp", glyph: GLYPH.sparkle });
  }

  return { items, hasAlert };
}
