import { prisma } from "@/lib/prisma";
import { PLAN_PRICES, type Plan } from "@/lib/features";
import { GLYPH } from "@/lib/glyphs";
import { formatRupiah } from "@/lib/utils";
import AdminTenantTable, { type AdminTenant } from "./AdminTenantTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { products: true, orders: true, outlets: true, users: true } },
    },
  });

  const rows: AdminTenant[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    isActive: t.isActive,
    isPlatformAdmin: t.isPlatformAdmin ?? false,
    createdAt: t.createdAt.toISOString(),
    plan: (t.subscription?.plan ?? "BASIC") as Plan,
    status: t.subscription?.status ?? "NONE",
    trialEndsAt: t.subscription?.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: t.subscription?.currentPeriodEnd?.toISOString() ?? null,
    featureOverrides: t.featureOverrides ? JSON.parse(t.featureOverrides) : {},
    counts: t._count,
  }));

  // Platform KPIs
  const total = rows.length;
  const active = rows.filter((r) => ["ACTIVE", "TRIAL"].includes(r.status)).length;
  const byPlan = (p: Plan) => rows.filter((r) => r.plan === p && ["ACTIVE", "TRIAL"].includes(r.status)).length;
  const proCount = byPlan("PRO");
  const bizCount = byPlan("BUSINESS");
  // MRR: only ACTIVE (not trial) paying tenants.
  const mrr = rows
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + PLAN_PRICES[r.plan], 0);
  const fullGrants = rows.filter((r) => Object.values(r.featureOverrides).some(Boolean)).length;

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow-cap on-dark mb-2"><span className="glyph">{GLYPH.hexMolecule}</span> Kontrol Platform</p>
        <h1 className="display-md" style={{ color: "var(--on-primary)" }}>Kelola semua tenant.</h1>
        <p className="body-md mt-2" style={{ color: "var(--link-cool-3)" }}>
          Ubah paket, perpanjang trial, beri layanan full, atau nonaktifkan toko — semua dari satu tempat.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <AdminKpi glyph={GLYPH.hexFilled} label="Total Tenant" value={String(total)} sub={`${active} aktif`} />
        <AdminKpi glyph={GLYPH.diamond} label="MRR" value={formatRupiah(mrr)} sub="Recurring / bulan" accent />
        <AdminKpi glyph={GLYPH.sparkle} label="Pro" value={String(proCount)} sub="paket aktif" />
        <AdminKpi glyph={GLYPH.premium} label="Business" value={String(bizCount)} sub="full layanan" />
        <AdminKpi glyph={GLYPH.circle} label="Grant Penuh" value={String(fullGrants)} sub="override aktif" />
      </div>

      <AdminTenantTable initial={rows} />
    </div>
  );
}

function AdminKpi({ glyph, label, value, sub, accent }: { glyph: string; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "var(--aloe-10)" : "var(--canvas-night-elevated)",
        color: accent ? "var(--ink)" : "var(--on-primary)",
        border: `1px solid ${accent ? "var(--aloe-10)" : "var(--hairline-dark)"}`,
        borderRadius: 12,
        padding: 16,
        minHeight: 104,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <p className="eyebrow-cap" style={{ color: accent ? "var(--shade-60)" : "var(--link-cool-3)" }}>
        <span className="glyph">{glyph}</span> {label}
      </p>
      <p className="kpi-value" style={{ marginTop: "auto", color: accent ? "var(--ink)" : "var(--on-primary)" }}>{value}</p>
      <p className="micro" style={{ color: accent ? "var(--shade-60)" : "var(--link-cool-3)" }}>{sub}</p>
    </div>
  );
}
