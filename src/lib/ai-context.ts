import { prisma } from "@/lib/prisma";
import { loadInsightsBundle } from "@/lib/bi";
import { formatRupiah } from "@/lib/utils";
import { getActivePlan } from "@/lib/features";

/**
 * Build a compact, grounded business-context block for the AI assistant.
 *
 * The goal is a short, factual snapshot (not raw rows) that fits in a
 * system prompt and lets the model answer questions about THIS store with
 * real numbers — sales, stock, customers, products, promos, forecast.
 */
export interface BusinessSnapshot {
  context: string;
  storeName: string;
}

export async function buildBusinessContext(tenantId: string): Promise<BusinessSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60_000);

  const [tenant, plan, revenue30, orders30, todayOrders, pendingOrders, productCount, topProducts, lowStock, bundle] =
    await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } }),
      getActivePlan(tenantId),
      prisma.order.aggregate({
        where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: last30 } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: last30 } } }),
      prisma.order.count({ where: { tenantId, createdAt: { gte: today } } }),
      prisma.order.count({ where: { tenantId, status: "WAITING_PAYMENT" } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.$queryRawUnsafe<{ name: string; qty: number }[]>(
        `SELECT oi.name AS name, SUM(oi.quantity) AS qty
         FROM order_items oi JOIN orders o ON o.id = oi.orderId
         WHERE o.tenantId = ? AND o.status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
         GROUP BY oi.name ORDER BY qty DESC LIMIT 5`,
        tenantId,
      ),
      prisma.product.findMany({
        where: { tenantId, isActive: true, stock: { lte: 5 } },
        select: { name: true, stock: true },
        orderBy: { stock: "asc" },
        take: 6,
      }),
      loadInsightsBundle(tenantId).catch(() => null),
    ]);

  const lines: string[] = [];
  lines.push(`Nama toko: ${tenant?.name ?? "Toko"}`);
  lines.push(`Paket langganan: ${plan}`);
  lines.push(`Omzet 30 hari terakhir: ${formatRupiah(revenue30._sum.total ?? 0)} dari ${revenue30._count} order terbayar`);
  lines.push(`Total order 30 hari: ${orders30}`);
  lines.push(`Order hari ini: ${todayOrders}`);
  lines.push(`Order menunggu konfirmasi bayar: ${pendingOrders}`);
  lines.push(`Jumlah produk aktif: ${productCount}`);

  if (topProducts.length > 0) {
    lines.push(
      `Produk terlaris: ${topProducts.map((p) => `${p.name} (${Number(p.qty)} terjual)`).join(", ")}`,
    );
  }

  if (lowStock.length > 0) {
    lines.push(
      `Stok menipis/habis: ${lowStock.map((p) => `${p.name} (sisa ${p.stock})`).join(", ")}`,
    );
  } else {
    lines.push("Stok: semua produk aman.");
  }

  if (bundle) {
    lines.push(`Forecast omzet 7 hari ke depan: ${formatRupiah(bundle.kpi.forecastNext7d)} (Holt smoothing)`);
    lines.push(
      `Segmen pelanggan: ${bundle.kpi.championsCount} Champions, ${bundle.kpi.atRiskCount} berisiko churn, total ${bundle.kpi.totalCustomers} pelanggan`,
    );
    lines.push(`Reorder sekarang: ${bundle.kpi.reorderNow} produk, dead-stock: ${bundle.kpi.deadStock} produk`);
    if (bundle.affinity.length > 0) {
      const top = bundle.affinity[0];
      lines.push(`Sering dibeli bersama: ${top.a} + ${top.b} (lift ${top.lift.toFixed(2)})`);
    }
    if (bundle.churn.length > 0) {
      lines.push(
        `Pelanggan berisiko churn teratas: ${bundle.churn.slice(0, 3).map((c) => c.customerName).join(", ")}`,
      );
    }
    if (bundle.promoRoi.length > 0) {
      const best = bundle.promoRoi[0];
      lines.push(`Promo ROI terbaik: kode ${best.code} (ROI ${best.roi}x, ${best.redemptions} pemakaian)`);
    }
  }

  return { context: lines.join("\n"), storeName: tenant?.name ?? "Toko" };
}

/** The shared persona / guardrails for the assistant. */
export function assistantSystemPrompt(snapshot: BusinessSnapshot): string {
  return [
    `Kamu adalah "Asisten AI 360" untuk UMKMStore — penasihat bisnis cerdas untuk pemilik UMKM Indonesia bernama toko "${snapshot.storeName}".`,
    "Tugasmu: bantu owner memahami data, ambil keputusan, dan menaikkan penjualan.",
    "Gaya: ramah, ringkas, praktis, pakai Bahasa Indonesia. Beri angka konkret dari DATA TOKO bila relevan, lalu 1-3 saran actionable.",
    "Jangan mengarang angka di luar DATA TOKO. Jika data tidak ada, katakan terus terang dan beri saran umum.",
    "Jangan pakai markdown heading besar; boleh pakai bullet pendek.",
    "",
    "=== DATA TOKO (real-time) ===",
    snapshot.context,
    "=== AKHIR DATA ===",
  ].join("\n");
}
