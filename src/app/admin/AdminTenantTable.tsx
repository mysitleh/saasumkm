"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, CircleNotch, DotsThree, X } from "@phosphor-icons/react";
import { PLAN_LABELS, FEATURE_LABELS, BOOLEAN_FEATURE_LIST, type Plan } from "@/lib/features";
import { useToast } from "@/components/ui/Toast";
import { GLYPH } from "@/lib/glyphs";

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  createdAt: string;
  plan: Plan;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  featureOverrides: Record<string, boolean>;
  counts: { products: number; orders: number; outlets: number; users: number };
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "var(--ink)",
  TRIAL: "#d97706",
  EXPIRED: "var(--shade-50)",
  CANCELLED: "#e11d48",
  NONE: "var(--shade-40)",
};

export default function AdminTenantTable({ initial }: { initial: AdminTenant[] }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<AdminTenant | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return initial;
    return initial.filter((t) => t.name.toLowerCase().includes(term) || t.slug.toLowerCase().includes(term));
  }, [q, initial]);

  async function act(tenantId: string, payload: Record<string, unknown>, successMsg: string) {
    setBusyId(tenantId);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal.");
        return;
      }
      toast.success(successMsg);
      startTransition(() => router.refresh());
      // Keep drawer in sync optimistically
      setDrawer((d) => (d && d.id === tenantId ? { ...d } : d));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Search */}
      <div className="flex items-center gap-2 mb-4" style={{ maxWidth: 360 }}>
        <div
          className="flex items-center gap-2 flex-1"
          style={{
            background: "var(--canvas-night-elevated)",
            border: "1px solid var(--hairline-dark)",
            borderRadius: 9999,
            padding: "8px 14px",
          }}
        >
          <MagnifyingGlass size={15} style={{ color: "var(--link-cool-3)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / slug toko…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--on-primary)", fontSize: 14 }}
          />
        </div>
        <span className="caption" style={{ color: "var(--link-cool-3)" }}>{rows.length} tenant</span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--canvas-night-elevated)",
          border: "1px solid var(--hairline-dark)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="w-full caption" style={{ borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--link-cool-3)" }}>
                <th style={th}>Toko</th>
                <th style={th}>Paket</th>
                <th style={th}>Status</th>
                <th style={th}>Trial/Periode</th>
                <th style={th}>Data</th>
                <th style={{ ...th, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const overrideCount = Object.values(t.featureOverrides).filter(Boolean).length;
                const endDate = t.status === "TRIAL" ? t.trialEndsAt : t.currentPeriodEnd;
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid var(--hairline-dark)" }}>
                    <td style={td}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "var(--on-primary)", fontWeight: 550 }}>
                          {t.name}
                          {!t.isActive && <span style={{ ...pill, background: "#e11d48", color: "#fff", marginLeft: 8 }}>nonaktif</span>}
                          {overrideCount > 0 && (
                            <span style={{ ...pill, background: "var(--aloe-10)", color: "var(--ink)", marginLeft: 8 }}>
                              full ×{overrideCount}
                            </span>
                          )}
                        </span>
                        <span className="micro tabular" style={{ color: "var(--link-cool-3)" }}>/{t.slug}</span>
                      </div>
                    </td>
                    <td style={td}>
                      <PlanSelect
                        value={t.plan}
                        disabled={busyId === t.id}
                        onChange={(plan) => act(t.id, { action: "setPlan", plan }, `${t.name} → ${PLAN_LABELS[plan]}`)}
                      />
                    </td>
                    <td style={td}>
                      <span style={{ color: STATUS_COLOR[t.status] ?? "var(--on-primary)", fontWeight: 550 }}>{t.status}</span>
                    </td>
                    <td style={{ ...td, color: "var(--link-cool-3)" }} className="tabular micro">
                      {endDate ? new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    </td>
                    <td style={{ ...td, color: "var(--link-cool-3)" }} className="tabular micro">
                      {t.counts.products}p · {t.counts.orders}o · {t.counts.outlets}out
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button
                        onClick={() => setDrawer(t)}
                        disabled={busyId === t.id}
                        className="ums-tap"
                        style={{ ...iconBtn }}
                        aria-label="Kelola"
                      >
                        {busyId === t.id ? <CircleNotch size={16} className="animate-spin" /> : <DotsThree size={18} weight="bold" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: "center", color: "var(--link-cool-3)", padding: 32 }}>
                    Tidak ada tenant cocok dengan &ldquo;{q}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pending && <p className="micro mt-3" style={{ color: "var(--link-cool-3)" }}>Menyinkronkan…</p>}

      {/* Manage drawer */}
      {drawer && (
        <ManageDrawer
          tenant={drawer}
          busy={busyId === drawer.id}
          onClose={() => setDrawer(null)}
          onAct={(payload, msg) => act(drawer.id, payload, msg)}
        />
      )}
    </>
  );
}

function PlanSelect({ value, onChange, disabled }: { value: Plan; onChange: (p: Plan) => void; disabled: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Plan)}
      style={{
        background: value === "BUSINESS" ? "var(--aloe-10)" : "var(--canvas-night)",
        color: value === "BUSINESS" ? "var(--ink)" : "var(--on-primary)",
        border: "1px solid var(--hairline-dark)",
        borderRadius: 9999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <option value="BASIC">Basic</option>
      <option value="PRO">Pro</option>
      <option value="BUSINESS">Business</option>
    </select>
  );
}

function ManageDrawer({
  tenant,
  busy,
  onClose,
  onAct,
}: {
  tenant: AdminTenant;
  busy: boolean;
  onClose: () => void;
  onAct: (payload: Record<string, unknown>, msg: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 ums-fade" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div
        className="relative h-full overflow-y-auto ums-sheet"
        style={{
          width: "min(420px, 92vw)",
          background: "var(--canvas-light)",
          color: "var(--ink)",
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="eyebrow-cap"><span className="glyph">{GLYPH.hexRing}</span> Kelola Tenant</p>
          <button onClick={onClose} aria-label="Tutup"><X size={18} weight="bold" /></button>
        </div>
        <h2 className="heading-md mb-1">{tenant.name}</h2>
        <p className="micro tabular mb-5" style={{ color: "var(--shade-50)" }}>
          /{tenant.slug} · {tenant.counts.users} user · {tenant.counts.products} produk · {tenant.counts.orders} order
        </p>

        {/* Quick plan */}
        <Section label="Paket cepat">
          <div className="flex gap-2 flex-wrap">
            {(["BASIC", "PRO", "BUSINESS"] as Plan[]).map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => onAct({ action: "setPlan", plan: p }, `Paket → ${PLAN_LABELS[p]}`)}
                className="pill pill-sm"
                style={{
                  background: tenant.plan === p ? "var(--ink)" : "var(--canvas-light)",
                  color: tenant.plan === p ? "var(--on-primary)" : "var(--ink)",
                  border: "1px solid var(--ink)",
                }}
              >
                {PLAN_LABELS[p]}
              </button>
            ))}
          </div>
        </Section>

        {/* Trial */}
        <Section label="Trial">
          <div className="flex gap-2 flex-wrap">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                disabled={busy}
                onClick={() => onAct({ action: "extendTrial", days: d }, `Trial +${d} hari`)}
                className="pill pill-outline-light pill-sm"
              >
                +{d} hari
              </button>
            ))}
          </div>
        </Section>

        {/* Full service */}
        <Section label="Layanan penuh">
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              disabled={busy}
              onClick={() => onAct({ action: "grantFull" }, "Semua fitur dibuka (full service)")}
              className="pill pill-aloe pill-sm"
            >
              <span className="glyph">{GLYPH.sparkle}</span> Buka semua fitur
            </button>
            <button
              disabled={busy}
              onClick={() => onAct({ action: "clearOverrides" }, "Override dihapus")}
              className="pill pill-ghost pill-sm"
              style={{ border: "1px solid var(--hairline-light)" }}
            >
              Reset override
            </button>
          </div>
          {/* Per-feature toggles */}
          <div className="space-y-1.5">
            {BOOLEAN_FEATURE_LIST.map((f) => {
              const on = !!tenant.featureOverrides[f];
              return (
                <label key={f} className="flex items-center justify-between caption cursor-pointer" style={{ padding: "4px 0" }}>
                  <span style={{ color: "var(--shade-60)" }}>{FEATURE_LABELS[f]}</span>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={busy}
                    onChange={(e) => onAct({ action: "setOverride", feature: f, value: e.target.checked }, `${FEATURE_LABELS[f]} ${e.target.checked ? "ON" : "OFF"}`)}
                    style={{ accentColor: "var(--ink)" }}
                  />
                </label>
              );
            })}
          </div>
        </Section>

        {/* Danger */}
        <Section label="Status toko">
          <button
            disabled={busy}
            onClick={() => onAct({ action: "toggleActive", active: !tenant.isActive }, tenant.isActive ? "Toko dinonaktifkan" : "Toko diaktifkan")}
            className="pill pill-outline-light pill-sm w-full"
            style={tenant.isActive ? { borderColor: "#e11d48", color: "#e11d48" } : undefined}
          >
            {tenant.isActive ? "Nonaktifkan toko" : "Aktifkan toko"}
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--hairline-light)" }}>
      <p className="eyebrow-cap mb-3">{label}</p>
      {children}
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 16px", fontSize: 11, fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 13, verticalAlign: "middle" };
const pill: React.CSSProperties = { display: "inline-block", padding: "1px 7px", borderRadius: 9999, fontSize: 10, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", verticalAlign: "middle" };
const iconBtn: React.CSSProperties = { background: "var(--canvas-night)", color: "var(--on-primary)", border: "1px solid var(--hairline-dark)", borderRadius: 9999, width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
