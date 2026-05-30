import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import RevenueChart from "@/components/RevenueChart";
import Link from "next/link";
import { hasFeature } from "@/lib/features";
import { GLYPH } from "@/lib/glyphs";
import StatTile from "@/components/StatTile";

export const dynamic = "force-dynamic";

interface DailyPoint { day: string; total: number; count: number }

async function getAnalytics(tenantId: string, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  since.setHours(0, 0, 0, 0);

  const [aggregate, dailyRows, topRows] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.$queryRawUnsafe<{ day: string; total: number; count: number }[]>(
      `SELECT strftime('%Y-%m-%d', createdAt) AS day, SUM(total) AS total, COUNT(*) AS count
       FROM orders WHERE tenantId = ? AND createdAt >= ?
       AND status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
       GROUP BY day ORDER BY day ASC`,
      tenantId,
      since.toISOString(),
    ),
    prisma.$queryRawUnsafe<{ name: string; quantity: number; revenue: number }[]>(
      `SELECT oi.name AS name, SUM(oi.quantity) AS quantity, SUM(oi.subtotal) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.orderId
       WHERE o.tenantId = ? AND o.createdAt >= ?
       AND o.status IN ('PAID_MANUAL','PROCESSING','COMPLETED')
       GROUP BY oi.name ORDER BY quantity DESC LIMIT 5`,
      tenantId,
      since.toISOString(),
    ),
  ]);

  const map = new Map(dailyRows.map((r) => [r.day, { total: Number(r.total ?? 0), count: Number(r.count ?? 0) }]));
  const daily: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ day: key, ...(map.get(key) ?? { total: 0, count: 0 }) });
  }
  return {
    revenue: aggregate._sum.total ?? 0,
    paidCount: aggregate._count ?? 0,
    daily,
    topProducts: topRows.map((r) => ({ name: r.name, quantity: Number(r.quantity), revenue: Number(r.revenue) })),
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const [data, canExport] = await Promise.all([getAnalytics(tenantId, 14), hasFeature(tenantId, "exportCsv")]);
  const avgPerDay = data.daily.length > 0 ? data.revenue / data.daily.length : 0;

  return (
    <div className="page-shell">
      <div className="page-header flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.diamond}</span> Analytics</p>
          <h1 className="display-md">Performa 14 hari.</h1>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/insights" className="pill pill-aloe pill-sm">
            <span className="glyph">{GLYPH.sparkle}</span> Buka Insights
          </Link>
          {canExport ? (
            <a href="/api/dashboard/export/orders" className="pill pill-outline-light pill-sm">
              Export CSV
            </a>
          ) : (
            <Link href="/dashboard/billing" className="pill pill-ghost pill-sm" style={{ border: "1px solid var(--hairline-light)" }}>
              Export CSV (Pro)
            </Link>
          )}
        </div>
      </div>

      <div className="kpi-grid-3 mb-6">
        <StatTile index={0} glyph={GLYPH.diamond} label="Omzet 14 hari" value={formatRupiah(data.revenue)} />
        <StatTile index={1} glyph={GLYPH.hexFilled} label="Order paid" value={String(data.paidCount)} />
        <StatTile index={2} glyph={GLYPH.lozenge} label="Rata-rata harian" value={formatRupiah(Math.round(avgPerDay))} />
      </div>

      <section className="card mb-6">
        <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamondThin}</span> Trend</p>
        <h2 className="heading-md mb-4">Omzet harian</h2>
        <RevenueChart data={data.daily} />
      </section>

      <section className="list-card">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.hexFilled}</span> Top 5</p>
            <h2 className="heading-md">Produk terlaris</h2>
          </div>
        </header>
        {data.topProducts.length === 0 ? (
          <div className="empty-state">Belum ada data terjual.</div>
        ) : (
          <ul>
            {data.topProducts.map((p, i) => (
              <li key={p.name} className="list-row">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="caption tabular flex-shrink-0" style={{ color: "var(--shade-40)", minWidth: 22 }}>{i + 1}</span>
                  <p className="body-md truncate">{p.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="body-strong tabular">{p.quantity} pcs</p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>{formatRupiah(p.revenue)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
