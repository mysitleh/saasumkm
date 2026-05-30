import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasFeature } from "@/lib/features";
import { aiEnabled } from "@/lib/ai";
import FeatureGate from "@/components/FeatureGate";
import { GLYPH } from "@/lib/glyphs";
import AiStudio from "./AiStudio";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  if (!(await hasFeature(session.user.tenantId, "aiAssistant"))) {
    return (
      <FeatureGate
        requiredPlan="Pro"
        title="AI Studio 360 untuk bisnis Anda."
        description="Asisten AI yang paham data toko Anda: ringkasan harian, tanya-jawab bisnis, dan generator konten. Tersedia di paket Pro ke atas."
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> AI Studio 360</p>
        <h1 className="display-md">Asisten AI bisnis Anda.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Brief harian, tanya-jawab berbasis data toko, dan generator konten — semua dalam satu tempat.
        </p>
      </div>

      <AiStudio liveProvider={aiEnabled() ? "openai" : "fallback"} />
    </div>
  );
}
