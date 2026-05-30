import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { GLYPH } from "@/lib/glyphs";
import OnboardingBanner from "@/components/OnboardingBanner";
import KpiStrip, { type KpiItem } from "./KpiStrip";
import MarqueeTicker from "@/components/MarqueeTicker";
import { buildReminders } from "@/lib/reminders";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    totalOrders,
    todayOrders,
    yesterdayOrders,
    pendingOrders,
    totalRevenue,
    todayRevenue,
    yesterdayRevenue,
    productCount,
    recentOrders,
    tenant,
  ] = await Promise.all([
    prisma.order.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: today } } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { tenantId, status: "WAITING_PAYMENT" } }),
    prisma.order.aggregate({
      where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { tenantId, status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] }, createdAt: { gte: today } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        tenantId,
        status: { in: ["PAID_MANUAL", "PROCESSING", "COMPLETED"] },
        createdAt: { gte: yesterday, lt: today },
      },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { tenantId, isActive: true } }),
    prisma.order.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5, include: { items: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  const reminders = await buildReminders(tenantId);

  const onboardingSteps = [
    { label: "Profil toko", done: !!(tenant?.description || tenant?.address), href: "/dashboard/settings" },
    { label: "Upload QRIS", done: !!tenant?.qrisImageUrl, href: "/dashboard/settings" },
    { label: "Tambah produk", done: productCount >= 1, href: "/dashboard/products/new" },
    { label: "Order pertama", done: totalOrders >= 1, href: `/store/${tenant?.slug ?? ""}` },
  ];

  const todayRev = todayRevenue._sum.total ?? 0;
  const yRev = yesterdayRevenue._sum.total ?? 0;
  const revDelta = yRev > 0 ? Math.round(((todayRev - yRev) / yRev) * 100) : null;
  const orderDelta =
    yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : null;

  const kpis: KpiItem[] = [
    {
      glyph: GLYPH.diamond,
      label: "Total Omzet",
      value: totalRevenue._sum.total ?? 0,
      format: "rupiah",
      sub: `Hari ini: ${formatRupiah(todayRev)}`,
      delta: revDelta,
    },
    {
      glyph: GLYPH.hexFilled,
      label: "Total Order",
      value: totalOrders,
      format: "plain",
      sub: `Hari ini: ${todayOrders}`,
      delta: orderDelta,
    },
    {
      glyph: GLYPH.circleRing,
      label: "Menunggu Bayar",
      value: pendingOrders,
      format: "plain",
      sub: "Perlu dikonfirmasi",
      accent: pendingOrders > 0 ? "ink" : undefined,
    },
    {
      glyph: GLYPH.hex,
      label: "Produk Aktif",
      value: productCount,
      format: "plain",
      sub: "Tersedia di toko",
    },
  ];

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexFilled}</span> Dashboard</p>
        <h1 className="display-md">Halo, {session.user.name?.split(" ")[0]}.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          {tenant?.name}
          {tenant?.slug && (
            <>
              <span className="glyph mx-2">·</span>
              <Link
                href={`/store/${tenant.slug}`}
                target="_blank"
                className="hover:underline inline-flex items-center gap-1"
                style={{ color: "var(--ink)" }}
              >
                /store/{tenant.slug}
                <ArrowSquareOut size={12} />
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mb-6">
        <MarqueeTicker items={reminders.items} tag={reminders.hasAlert ? "Perlu Aksi" : "Info"} alert={reminders.hasAlert} />
      </div>

      <OnboardingBanner steps={onboardingSteps} />

      {/* KPI strip — animated count-up */}
      <KpiStrip items={kpis} />

      {/* Quick actions */}
      <div className="quick-actions">
        <Link href="/dashboard/orders?status=WAITING_PAYMENT" className="pill pill-primary pill-sm">
          Konfirmasi Bayar
        </Link>
        <Link href="/dashboard/products/new" className="pill pill-aloe pill-sm">
          Tambah Produk
        </Link>
        <Link href="/dashboard/insights" className="pill pill-outline-light pill-sm">
          <span className="glyph">{GLYPH.sparkle}</span> Insights
        </Link>
        <Link href="/dashboard/analytics" className="pill pill-outline-light pill-sm">
          Analytics
        </Link>
        <Link href="/dashboard/settings" className="pill pill-ghost pill-sm">
          Pengaturan
        </Link>
      </div>

      {/* Recent orders */}
      <section className="list-card">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamondThin}</span> Recent</p>
            <h2 className="heading-md">Pesanan Terbaru</h2>
          </div>
          <Link href="/dashboard/orders" className="caption hover:underline" style={{ color: "var(--ink)" }}>
            Lihat semua <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        </header>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.hexFilled}</span>
            Belum ada pesanan.
          </div>
        ) : (
          <ul>
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="list-row"
                >
                  <div className="min-w-0">
                    <p className="body-md tabular" style={{ color: "var(--ink)" }}>{order.orderNumber}</p>
                    <p className="micro mt-0.5" style={{ color: "var(--shade-50)" }}>
                      {order.customerName} <span className="glyph">·</span> {order.items.length} item
                    </p>
                  </div>
                  <div className="text-right ml-4 flex items-center gap-3 flex-shrink-0">
                    <span className="status-pill" data-status={order.status}>{ORDER_STATUS_LABELS[order.status]}</span>
                    <span className="body-strong tabular">{formatRupiah(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
