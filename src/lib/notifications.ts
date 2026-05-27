import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatRupiah } from "@/lib/utils";

interface OrderForNotif {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
  status: string;
}

interface TenantForNotif {
  name: string;
  slug: string;
  phone?: string | null;
}

/**
 * Normalize phone ke format internasional Indonesia (62...).
 * Buang spasi, dash, plus, dan leading 0 → diganti 62.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw.replace(/[\s\-+()]/g, "");
  if (v.startsWith("0")) v = `62${v.slice(1)}`;
  if (!/^\d{8,15}$/.test(v)) return null;
  return v;
}

/**
 * Kirim WhatsApp via Fonnte API. Idempotent log: kalau token tidak ada,
 * langsung log info & return. Tidak melempar error supaya tidak menggagalkan
 * critical path order.
 */
export async function sendWhatsApp(phone: string | null | undefined, message: string): Promise<{ ok: boolean; reason?: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, reason: "phone_invalid" };
  if (!env.FONNTE_TOKEN) {
    logger.info("WhatsApp skipped (no token)", { phone: normalized });
    return { ok: false, reason: "no_token" };
  }
  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: env.FONNTE_TOKEN, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target: normalized, message, countryCode: "62" }).toString(),
    });
    if (!res.ok) {
      logger.warn("Fonnte responded non-OK", { status: res.status, phone: normalized });
      return { ok: false, reason: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    logger.error("Fonnte send error", { error: e instanceof Error ? e.message : String(e) });
    return { ok: false, reason: "exception" };
  }
}

export function buildNewOrderMessage(tenant: TenantForNotif, order: OrderForNotif, dashboardBase: string): string {
  return [
    `🛒 *Pesanan baru — ${tenant.name}*`,
    `No: ${order.orderNumber}`,
    `Pemesan: ${order.customerName}`,
    `Total: ${formatRupiah(order.total)}`,
    "",
    `Cek dashboard: ${dashboardBase}/dashboard/orders`,
  ].join("\n");
}

export function buildPaidMessage(tenant: TenantForNotif, order: OrderForNotif): string {
  return [
    `✅ *Pembayaran diterima — ${tenant.name}*`,
    `No: ${order.orderNumber}`,
    `Total: ${formatRupiah(order.total)}`,
    "",
    `Terima kasih sudah berbelanja!`,
  ].join("\n");
}

export function buildStatusUpdateMessage(tenant: TenantForNotif, order: OrderForNotif, statusLabel: string): string {
  return [
    `📦 *Update pesanan — ${tenant.name}*`,
    `No: ${order.orderNumber}`,
    `Status: ${statusLabel}`,
    "",
    `Total: ${formatRupiah(order.total)}`,
  ].join("\n");
}
