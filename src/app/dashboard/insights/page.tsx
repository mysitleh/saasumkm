import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { hasFeature } from "@/lib/features";
import { loadInsightsBundle } from "@/lib/bi";
import { formatRupiah } from "@/lib/utils";
import { GLYPH } from "@/lib/glyphs";
import InsightChart from "@/components/InsightChart";
import HeatmapGrid from "@/components/HeatmapGrid";
import StatTile from "@/components/StatTile";

export const dynamic = "force-dynamic";

const SEGMENT_ORDER = [
  "Champions",
  "Loyal",
  "Potential Loyalist",
  "New Customers",
  "Promising",
  "Need Attention",
  "At Risk",
  "Hibernating",
] as const;

const SEGMENT_LABEL_ID: Record<(typeof SEGMENT_ORDER)[number], string> = {
  Champions: "Champions",
  Loyal: "Loyalis",
  "Potential Loyalist": "Calon Loyalis",
  "New Customers": "Pelanggan Baru",
  Promising: "Berpotensi",
  "Need Attention": "Perlu Perhatian",
  "At Risk": "Berisiko",
  Hibernating: "Tidak Aktif",
};

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const enabled = await hasFeature(session.user.tenantId, "analyticsAdvanced");
  if (!enabled) {
    return (
      <div className="page-shell">
        <div className="card max-w-2xl mx-auto text-center" style={{ padding: 48 }}>
          <p className="eyebrow-cap mb-4"><span className="glyph">{GLYPH.sparkle}</span> Business Intelligence</p>
          <h1 className="display-md mb-3">Buka analitik bisnis kelas internasional.</h1>
          <p className="body-lg mb-8" style={{ color: "var(--shade-50)" }}>
            RFM segmentation, sales forecasting (Holt), cohort retention, market-basket affinity, churn risk —
            metrik standar global untuk meningkatkan revenue UMKM Anda.
          </p>
          <Link href="/dashboard/billing" className="pill pill-primary">
            Upgrade ke Pro <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        </div>
      </div>
    );
  }

  const data = await loadInsightsBundle(session.user.tenantId);

  return (
    <div className="page-shell">
      {/* Page header */}
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> Business Intelligence</p>
        <h1 className="display-md">Insights Anda</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Analitik standar internasional — RFM (Hughes 1996), Holt forecast, cohort retention, market basket.
        </p>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid mb-8">
        <StatTile index={0} glyph={GLYPH.sparkle} label="Forecast 7 hari" value={formatRupiah(data.kpi.forecastNext7d)} caption="Prediksi Holt-smoothing" />
        <StatTile index={1} glyph={GLYPH.premium} label="Champions" value={String(data.kpi.championsCount)} caption="Pelanggan inti" />
        <StatTile index={2} glyph={GLYPH.circleRing} label="Berisiko churn" value={String(data.kpi.atRiskCount)} caption="At-Risk + Hibernating" />
        <StatTile index={3} glyph={GLYPH.hexFilled} label="Reorder sekarang" value={String(data.kpi.reorderNow)} caption={`${data.kpi.deadStock} dead-stock`} />
      </div>

      {/* Forecast chart */}
      <section className="card mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamond}</span> Sales Forecast</p>
            <h2 className="heading-md">Penjualan harian + 7 hari ke depan</h2>
          </div>
          <div className="flex items-center gap-3 caption" style={{ color: "var(--shade-50)" }}>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, background: "var(--ink)", display: "inline-block", borderRadius: 2 }} /> Aktual
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, background: "var(--aloe-10)", display: "inline-block", borderRadius: 2 }} /> Forecast
            </span>
          </div>
        </div>
        <InsightChart data={data.forecast} />
      </section>

      <div className="split-2 mb-8">
        {/* RFM segmentation */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.lozenge}</span> RFM Segmentation</p>
          <h2 className="heading-md mb-4">Segmen pelanggan</h2>
          <div className="space-y-2">
            {SEGMENT_ORDER.map((seg) => {
              const cell = data.rfmSummary[seg];
              const total = data.kpi.totalCustomers || 1;
              const pct = (cell.count / total) * 100;
              return (
                <div key={seg}>
                  <div className="flex items-center justify-between caption mb-1 gap-3">
                    <span className="truncate" style={{ color: "var(--ink)" }}>{SEGMENT_LABEL_ID[seg]}</span>
                    <span className="tabular flex-shrink-0" style={{ color: "var(--shade-50)" }}>
                      {cell.count} <span className="glyph" style={{ color: "var(--shade-40)" }}>·</span> {formatRupiah(cell.revenue)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--canvas-cream)", borderRadius: 9999, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: seg === "Champions" || seg === "Loyal" ? "var(--ink)" : seg === "At Risk" || seg === "Hibernating" ? "var(--shade-40)" : "var(--aloe-10)",
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CLV summary */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamond}</span> Customer Lifetime Value</p>
          <h2 className="heading-md mb-4">CLV historis per segmen</h2>
          <div className="kpi-grid-2 mb-5">
            <div className="kpi-card kpi-card-aloe" style={{ padding: 16 }}>
              <p className="kpi-eyebrow">Top 10% pelanggan</p>
              <p className="kpi-value-sm">{formatRupiah(data.clv.top10Pct)}</p>
            </div>
            <div className="kpi-card" style={{ padding: 16 }}>
              <p className="kpi-eyebrow">Rata-rata CLV</p>
              <p className="kpi-value-sm">{formatRupiah(data.clv.historicalAvg)}</p>
            </div>
          </div>
          <ul className="caption space-y-1.5">
            {SEGMENT_ORDER.filter((s) => data.clv.segments[s].sample > 0).slice(0, 5).map((s) => (
              <li key={s} className="flex justify-between gap-3" style={{ color: "var(--shade-60)" }}>
                <span className="truncate">{SEGMENT_LABEL_ID[s]}</span>
                <span className="tabular flex-shrink-0">{formatRupiah(data.clv.segments[s].avgCLV)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Inventory velocity */}
      <section className="list-card mb-8">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.hexFilled}</span> Inventory Velocity</p>
            <h2 className="heading-md">Days-of-stock & reorder alert</h2>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full caption tabular">
            <thead>
              <tr style={{ background: "var(--canvas-cream)", textAlign: "left" }}>
                <th style={{ padding: "10px 24px", fontWeight: 500 }}>Produk</th>
                <th style={{ padding: 10, fontWeight: 500 }}>Stok</th>
                <th style={{ padding: 10, fontWeight: 500 }}>/hari</th>
                <th style={{ padding: 10, fontWeight: 500, whiteSpace: "nowrap" }}>Days of stock</th>
                <th style={{ padding: 10, fontWeight: 500 }}>Status</th>
                <th style={{ padding: "10px 24px", fontWeight: 500, textAlign: "right" }}>Revenue 30h</th>
              </tr>
            </thead>
            <tbody>
              {data.velocity.slice(0, 12).map((v) => (
                <tr key={v.productId} style={{ borderTop: "1px solid var(--hairline-light)" }}>
                  <td style={{ padding: "12px 24px", color: "var(--ink)" }}>{v.name}</td>
                  <td style={{ padding: 12 }}>{v.stock}</td>
                  <td style={{ padding: 12 }}>{v.unitsSoldPerDay}</td>
                  <td style={{ padding: 12 }}>{v.daysOfStock >= 999 ? "—" : `${v.daysOfStock}h`}</td>
                  <td style={{ padding: 12 }}>
                    <VelocityBadge status={v.status} />
                  </td>
                  <td style={{ padding: "12px 24px", textAlign: "right" }}>{formatRupiah(v.revenue30d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="split-2 mb-8">
        {/* Affinity */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.asterism}</span> Market Basket</p>
          <h2 className="heading-md mb-4">Produk yang dibeli bersama</h2>
          {data.affinity.length === 0 ? (
            <p className="caption" style={{ color: "var(--shade-50)" }}>Butuh ≥5 transaksi multi-item untuk analisis basket.</p>
          ) : (
            <ul className="space-y-3">
              {data.affinity.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="caption tabular" style={{ color: "var(--shade-40)", minWidth: 20 }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="body-md" style={{ color: "var(--ink)" }}>
                      {p.a} <span className="glyph" style={{ color: "var(--shade-40)" }}>{GLYPH.arrow}</span> {p.b}
                    </p>
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                      lift {p.lift.toFixed(2)} <span className="glyph">·</span> confidence {p.confidence}% <span className="glyph">·</span> {p.cooccurrence}× co-purchase
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Heatmap */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.hex}</span> Order Density</p>
          <h2 className="heading-md mb-4">Jam × hari (60 hari, WIB)</h2>
          <HeatmapGrid cells={data.heatmap} />
        </section>
      </div>

      <div className="split-2 mb-8">
        {/* Cohort retention */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.section}</span> Cohort Retention</p>
          <h2 className="heading-md mb-4">Retensi per bulan signup</h2>
          {data.cohort.length === 0 ? (
            <p className="caption" style={{ color: "var(--shade-50)" }}>Belum cukup data multi-bulan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full caption tabular">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500, color: "var(--shade-50)" }}>Cohort</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, color: "var(--shade-50)" }}>Size</th>
                    {Array.from({ length: 6 }, (_, m) => (
                      <th key={m} style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, color: "var(--shade-50)" }}>M{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cohort.map((row) => (
                    <tr key={row.cohort} style={{ borderTop: "1px solid var(--hairline-light)" }}>
                      <td style={{ padding: "8px", color: "var(--ink)" }}>{row.cohort}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{row.size}</td>
                      {row.retention.map((v, m) => (
                        <td key={m} style={{ padding: "8px", textAlign: "right", color: v >= 50 ? "var(--ink)" : "var(--shade-50)" }}>
                          {v}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Churn risk */}
        <section className="card">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.circleRing}</span> Churn Risk</p>
          <h2 className="heading-md mb-4">Pelanggan yang terlambat order</h2>
          {data.churn.length === 0 ? (
            <p className="caption" style={{ color: "var(--shade-50)" }}>Tidak ada sinyal churn — pelanggan masih aktif.</p>
          ) : (
            <ul className="space-y-3">
              {data.churn.slice(0, 8).map((c, i) => (
                <li key={i} className="flex items-start gap-3 pb-3" style={{ borderBottom: i < 7 ? "1px solid var(--hairline-light)" : "none" }}>
                  <div
                    className="caption tabular"
                    style={{
                      minWidth: 38,
                      textAlign: "center",
                      padding: "2px 6px",
                      borderRadius: 9999,
                      background: c.riskScore >= 70 ? "var(--ink)" : "var(--shade-30)",
                      color: c.riskScore >= 70 ? "var(--on-primary)" : "var(--ink)",
                      fontWeight: 500,
                    }}
                  >
                    {c.riskScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="body-md" style={{ color: "var(--ink)" }}>{c.customerName}</p>
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                      {c.daysSinceLast} hari sejak terakhir <span className="glyph">·</span> biasanya tiap {c.expectedInterval} hari
                    </p>
                  </div>
                  <p className="caption tabular text-right" style={{ color: "var(--ink)" }}>{formatRupiah(c.totalSpent)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Promo ROI */}
      {data.promoRoi.length > 0 && (
        <section className="card-pistachio-band mb-8">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamond}</span> Promo ROI</p>
          <h2 className="heading-md mb-4">Performa kode promo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.promoRoi.slice(0, 4).map((p) => (
              <div key={p.promoId} className="card-flat" style={{ padding: 16, background: "var(--canvas-light)" }}>
                <p className="micro" style={{ color: "var(--shade-50)" }}>Kode</p>
                <p className="heading-sm mb-2" style={{ fontFamily: "var(--font-mono)" }}>{p.code}</p>
                <div className="grid grid-cols-3 gap-2 caption tabular">
                  <div><p className="micro" style={{ color: "var(--shade-50)" }}>Redemptions</p><p>{p.redemptions}</p></div>
                  <div><p className="micro" style={{ color: "var(--shade-50)" }}>Revenue</p><p>{formatRupiah(p.attributedRevenue)}</p></div>
                  <div><p className="micro" style={{ color: "var(--shade-50)" }}>ROI</p><p style={{ color: p.roi >= 1 ? "var(--ink)" : "var(--shade-50)" }}>{p.roi}×</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Methodology footer */}
      <p className="micro" style={{ color: "var(--shade-50)" }}>
        <span className="glyph">{GLYPH.reference}</span> Metodologi: RFM mengikuti Hughes (1996); forecast pakai Holt double-exponential smoothing
        (α=0.4, β=0.2); affinity dihitung dari co-occurrence pada `order_items` dengan minimum support 2; cohort menggunakan signup-month per pelanggan unik.
      </p>
    </div>
  );
}

function VelocityBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    OUT_OF_STOCK: { label: "Habis", bg: "var(--ink)", color: "var(--on-primary)" },
    REORDER_NOW: { label: "Restock", bg: "var(--ink)", color: "var(--on-primary)" },
    LOW: { label: "Rendah", bg: "var(--aloe-10)", color: "var(--ink)" },
    HEALTHY: { label: "Sehat", bg: "var(--pistachio-10)", color: "var(--ink)" },
    DEAD_STOCK: { label: "Tidak laku", bg: "var(--canvas-cream)", color: "var(--shade-50)" },
  };
  const s = map[status] ?? map.HEALTHY;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 9999,
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 500,
      letterSpacing: 0.4, textTransform: "uppercase",
    }}>{s.label}</span>
  );
}
