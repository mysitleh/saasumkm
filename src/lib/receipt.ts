/**
 * Receipt formatter — struk text siap share via WhatsApp / Telegram.
 *
 * Produces clean plain-text receipt (no HTML) optimized for:
 *   - WhatsApp monospace formatting (```...```)
 *   - Copy-paste readability
 *   - Telegram/SMS (80-char line width)
 *
 * Pure function — no DB access, fully testable.
 */

import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";

export interface ReceiptOrder {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryType: string;
  deliveryAddress?: string | null;
  status: string;
  createdAt: Date | string;
  items: { name: string; price: number; quantity: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod?: string;
}

export interface ReceiptTenant {
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
}

const LINE = "─".repeat(32);
const THIN = "┄".repeat(32);

function pad(left: string, right: string, width = 32): string {
  const gap = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(gap) + right;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

/**
 * Generate plain-text receipt string.
 */
export function formatReceipt(tenant: ReceiptTenant, order: ReceiptOrder): string {
  const lines: string[] = [];

  // Header
  lines.push(tenant.name.toUpperCase());
  if (tenant.address) lines.push(tenant.address);
  if (tenant.phone) lines.push(`Tel: ${tenant.phone}`);
  lines.push(LINE);

  // Order info
  lines.push(`No: ${order.orderNumber}`);
  lines.push(`Tanggal: ${formatDate(order.createdAt)}`);
  lines.push(`Status: ${ORDER_STATUS_LABELS[order.status] ?? order.status}`);
  lines.push(`Pelanggan: ${order.customerName}`);
  if (order.customerPhone) lines.push(`HP: ${order.customerPhone}`);
  if (order.deliveryType === "DELIVERY" && order.deliveryAddress) {
    lines.push(`Kirim ke: ${order.deliveryAddress}`);
  } else {
    lines.push("Ambil di tempat (Pickup)");
  }
  lines.push(LINE);

  // Items
  for (const item of order.items) {
    lines.push(item.name);
    const qty = `  ${item.quantity}x ${formatRupiah(item.price)}`;
    const sub = formatRupiah(item.subtotal);
    lines.push(pad(qty, sub));
  }
  lines.push(THIN);

  // Totals
  lines.push(pad("Subtotal", formatRupiah(order.subtotal)));
  if (order.discountAmount > 0) {
    lines.push(pad("Diskon", `-${formatRupiah(order.discountAmount)}`));
  }
  lines.push(LINE);
  lines.push(pad("TOTAL", formatRupiah(order.total)));
  lines.push(LINE);

  // Payment
  if (order.paymentMethod) {
    lines.push(`Bayar: ${order.paymentMethod.replace(/_/g, " ")}`);
  }

  // Footer
  lines.push("");
  lines.push("Terima kasih telah berbelanja! 🙏");
  lines.push(`🔗 ${tenant.slug}.umkmstore.id`);

  return lines.join("\n");
}

/**
 * Wrap receipt in WhatsApp monospace block for clean formatting.
 */
export function formatReceiptWhatsApp(tenant: ReceiptTenant, order: ReceiptOrder): string {
  return "```\n" + formatReceipt(tenant, order) + "\n```";
}
