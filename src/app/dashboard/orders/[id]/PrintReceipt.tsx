"use client";

import { Printer } from "@phosphor-icons/react";

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  deliveryType: string;
  items: { name: string; price: number; quantity: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  tenantName: string;
  tenantAddress: string | null;
}

export default function PrintReceipt({ order }: { order: OrderData }) {
  function handlePrint() {
    const w = window.open("", "_blank", "width=300,height=600");
    if (!w) return;

    const date = new Date(order.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td style="text-align:left">${i.name} x${i.quantity}</td><td style="text-align:right">Rp ${i.subtotal.toLocaleString("id-ID")}</td></tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html><head><title>Receipt ${order.orderNumber}</title>
<style>
  body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
  h2 { text-align: center; margin: 0 0 4px; font-size: 14px; }
  .center { text-align: center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; }
  .total { font-weight: bold; font-size: 14px; }
  @media print { body { width: 100%; } }
</style></head><body>
<h2>${order.tenantName}</h2>
${order.tenantAddress ? `<p class="center" style="margin:0;font-size:10px">${order.tenantAddress}</p>` : ""}
<div class="line"></div>
<p style="margin:4px 0"><strong>${order.orderNumber}</strong><br/>${date}</p>
<p style="margin:4px 0">Customer: ${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""}<br/>Tipe: ${order.deliveryType === "PICKUP" ? "Ambil di toko" : "Delivery"}</p>
<div class="line"></div>
<table>${itemsHtml}</table>
<div class="line"></div>
<table>
  <tr><td>Subtotal</td><td style="text-align:right">Rp ${order.subtotal.toLocaleString("id-ID")}</td></tr>
  ${order.discountAmount > 0 ? `<tr><td>Diskon</td><td style="text-align:right">-Rp ${order.discountAmount.toLocaleString("id-ID")}</td></tr>` : ""}
  <tr class="total"><td>TOTAL</td><td style="text-align:right">Rp ${order.total.toLocaleString("id-ID")}</td></tr>
</table>
<div class="line"></div>
<p class="center" style="font-size:10px;margin-top:8px">Terima kasih!<br/>Powered by UMKMStore</p>
</body></html>`;

    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-[var(--surface-cream)] text-[var(--ink-muted)] px-4 py-2 rounded-[999px] text-sm font-medium hover:bg-[var(--surface-deep)] flex items-center gap-2"
    >
      <Printer size={16} /> Cetak Struk
    </button>
  );
}
