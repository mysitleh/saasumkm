import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, FEATURE_LABELS, BOOLEAN_FEATURE_LIST, type Plan } from "@/lib/features";
import { formatRupiah } from "@/lib/utils";
import BillingActions from "./BillingActions";
import { GLYPH } from "@/lib/glyphs";

export const dynamic = "force-dynamic";

const PLAN_TAGLINES: Record<Plan, string> = {
  BASIC: "Untuk UMKM yang baru mulai.",
  PRO: "Untuk yang siap tumbuh.",
  BUSINESS: "Semua fitur terbuka. Tanpa batas.",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");
  const sub = await prisma.subscription.findUnique({ where: { tenantId: session.user.tenantId } });

  const currentPlan: Plan = (sub?.plan as Plan) ?? "BASIC";
  const isTrial = sub?.status === "TRIAL";
  const isActive = sub?.status === "ACTIVE" || isTrial;

  function maxLabel(plan: Plan, key: "maxProducts" | "maxOutlets" | "maxStaff") {
    const v = PLAN_FEATURES[plan][key];
    return Number.isFinite(v) ? String(v) : "Unlimited";
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.diamond}</span> Berlangganan</p>
        <h1 className="display-md">Pilih paket Anda.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          {isTrial && sub?.trialEndsAt
            ? `Trial Pro aktif sampai ${new Date(sub.trialEndsAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`
            : sub
              ? `Paket aktif: ${PLAN_LABELS[currentPlan]} (${sub.status}).`
              : "Belum ada subscription — Anda berada di paket Basic."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(Object.keys(PLAN_FEATURES) as Plan[]).map((plan) => {
          const isCurrent = plan === currentPlan && isActive;
          const isBusiness = plan === "BUSINESS";
          return (
            <article key={plan} className={isBusiness ? "card-pricing-featured" : "card-pricing"}>
              {isBusiness && (
                <p className="tag-mint mb-4 self-start" style={{ background: "var(--ink)", color: "var(--on-primary)" }}>
                  {GLYPH.sparkle} Full Layanan
                </p>
              )}
              <div className="flex items-center justify-between mb-1">
                <h3 className="heading-xl">{PLAN_LABELS[plan]}</h3>
                {isCurrent && <span className="tag-shade" style={{ background: "var(--ink)", color: "var(--on-primary)" }}>Aktif</span>}
              </div>
              <p className="micro mb-5" style={{ color: isBusiness ? "var(--shade-60)" : "var(--shade-50)" }}>
                {PLAN_TAGLINES[plan]}
              </p>
              <p className="kpi-value-lg mb-1">
                {PLAN_PRICES[plan] === 0 ? "Gratis" : formatRupiah(PLAN_PRICES[plan])}
              </p>
              <p className="micro mb-6" style={{ color: isBusiness ? "var(--shade-60)" : "var(--shade-50)" }}>
                {PLAN_PRICES[plan] === 0 ? "Selamanya" : "per bulan"}
              </p>

              <ul className="space-y-2 mb-8 caption flex-1">
                {/* Numeric caps */}
                <FeatureLine enabled label={`Produk: ${maxLabel(plan, "maxProducts")}`} />
                <FeatureLine enabled={Number(PLAN_FEATURES[plan].maxOutlets) !== 1} label={`Outlet: ${maxLabel(plan, "maxOutlets")}`} />
                <FeatureLine enabled={Number(PLAN_FEATURES[plan].maxStaff) > 0} label={`Staff: ${maxLabel(plan, "maxStaff")}`} />
                {/* Boolean features */}
                {BOOLEAN_FEATURE_LIST.map((f) => (
                  <FeatureLine key={f} enabled={PLAN_FEATURES[plan][f]} label={FEATURE_LABELS[f]} />
                ))}
              </ul>
              <BillingActions plan={plan} isCurrent={isCurrent} />
            </article>
          );
        })}
      </div>

      <p className="micro mt-8" style={{ color: "var(--shade-50)" }}>
        <span className="glyph">{GLYPH.reference}</span> Paket <strong>Business</strong> membuka semua fitur tanpa batas.
        Endpoint billing saat ini mock — production integrasikan Midtrans Recurring / Xendit Subscription.
      </p>
    </div>
  );
}

function FeatureLine({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="glyph flex-shrink-0" style={{ color: enabled ? "var(--ink)" : "var(--shade-40)", marginTop: 2 }}>
        {enabled ? GLYPH.done : GLYPH.pending}
      </span>
      <span style={{ color: enabled ? "var(--ink)" : "var(--shade-50)" }}>{label}</span>
    </li>
  );
}
