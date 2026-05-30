import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";

/**
 * Server-rendered upsell card shown when a tenant's plan doesn't include
 * a feature. Keeps the page route accessible but blocks the body.
 */
export default function FeatureGate({
  title,
  description,
  requiredPlan,
}: {
  title: string;
  description: string;
  requiredPlan: "Pro" | "Business";
}) {
  return (
    <div className="page-shell">
      <div className="card text-center max-w-xl mx-auto" style={{ padding: 48 }}>
        <span className="empty-state-glyph glyph">{requiredPlan === "Business" ? GLYPH.premium : GLYPH.sparkle}</span>
        <p className="eyebrow-cap mb-2">Fitur Paket {requiredPlan}</p>
        <h1 className="display-md mb-3">{title}</h1>
        <p className="body-md mb-8" style={{ color: "var(--shade-50)" }}>{description}</p>
        <Link href="/dashboard/billing" className="pill pill-primary inline-flex">
          Upgrade ke {requiredPlan} <span className="glyph">{GLYPH.arrow}</span>
        </Link>
      </div>
    </div>
  );
}
