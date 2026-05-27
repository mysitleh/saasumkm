import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, type Plan } from "@/lib/features";
import { formatRupiah } from "@/lib/utils";
import BillingActions from "./BillingActions";
import { GLYPH } from "@/lib/glyphs";

export const dynamic = "force-dynamic";

const FEATURE_LABELS: Record<keyof (typeof PLAN_FEATURES)["BASIC"], string> = {
  maxProducts: "Maks. produk",
  qrisDynamic: "QRIS dinamis (auto-konfirmasi)",
  whatsappNotif: "Notifikasi WhatsApp",
  exportCsv: "Export CSV transaksi",
  multiOutlet: "Multi outlet",
  staffManagement: "Staff management",
  analyticsAdvanced: "Business Intelligence",
};

const PLAN_TAGLINES: Record<Plan, string> = {
  BASIC: "Untuk UMKM yang baru mulai.",
  PRO: "Untuk yang siap tumbuh.",
  BUSINESS: "Untuk multi outlet & tim.",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");
  const sub = await prisma.subscription.findUnique({ where: { tenantId: session.user.tenantId } });

  const currentPlan: Plan = (sub?.plan as Plan) ?? "BASIC";
  const isTrial = sub?.status === "TRIAL";
  const isActive = sub?.status === "ACTIVE" || isTrial;

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
          const isFeatured = plan === "PRO";
          return (
            <article key={plan} className={isFeatured ? "card-pricing-featured" : "card-pricing"}>
              {isFeatured && (
                <p className="tag-mint mb-4 self-start" style={{ background: "var(--ink)", color: "var(--on-primary)" }}>
                  Direkomendasikan
                </p>
              )}
              <div className="flex items-center justify-between mb-1">
                <h3 className="heading-xl">{PLAN_LABELS[plan]}</h3>
                {isCurrent && <span className="tag-shade" style={{ background: "var(--ink)", color: "var(--on-primary)" }}>Aktif</span>}
              </div>
              <p className="micro mb-5" style={{ color: isFeatured ? "var(--shade-60)" : "var(--shade-50)" }}>
                {PLAN_TAGLINES[plan]}
              </p>
              <p className="kpi-value-lg mb-1">
                {PLAN_PRICES[plan] === 0 ? "Gratis" : formatRupiah(PLAN_PRICES[plan])}
              </p>
              {PLAN_PRICES[plan] > 0 && (
                <p className="micro mb-6" style={{ color: isFeatured ? "var(--shade-60)" : "var(--shade-50)" }}>per bulan</p>
              )}
              {PLAN_PRICES[plan] === 0 && <p className="micro mb-6" style={{ color: "var(--shade-50)" }}>Selamanya</p>}

              <ul className="space-y-2.5 mb-8 caption flex-1">
                {(Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]).map((key) => {
                  const value = PLAN_FEATURES[plan][key];
                  const isNum = typeof value === "number";
                  const enabled = typeof value === "boolean" ? value : isNum;
                  return (
                    <li key={key} className="flex items-start gap-2">
                      <span className="glyph flex-shrink-0" style={{ color: enabled ? "var(--ink)" : "var(--shade-40)", marginTop: 2 }}>
                        {enabled ? GLYPH.done : GLYPH.pending}
                      </span>
                      <span style={{ color: enabled ? "var(--ink)" : "var(--shade-50)" }}>
                        {FEATURE_LABELS[key]}
                        {key === "maxProducts" && <>: {Number.isFinite(value as number) ? value : "Unlimited"}</>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <BillingActions plan={plan} isCurrent={isCurrent} />
            </article>
          );
        })}
      </div>

      <p className="micro mt-8" style={{ color: "var(--shade-50)" }}>
        <span className="glyph">{GLYPH.reference}</span> Endpoint billing saat ini berstatus mock — pada
        production, integrasikan dengan Midtrans Recurring atau Xendit Subscription untuk pembayaran berulang.
      </p>
    </div>
  );
}
