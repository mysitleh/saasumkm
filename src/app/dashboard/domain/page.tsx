import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GLYPH } from "@/lib/glyphs";
import { hasFeature } from "@/lib/features";
import FeatureGate from "@/components/FeatureGate";
import DomainManager from "./DomainManager";

export const dynamic = "force-dynamic";

const ROOT = process.env.UMKMSTORE_ROOT_DOMAIN ?? "umkmstore.id";

export default async function DomainPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  if (!(await hasFeature(session.user.tenantId, "customDomain"))) {
    return (
      <FeatureGate
        requiredPlan="Business"
        title="Custom domain toko Anda."
        description="Pakai domain sendiri (mis. tokoanda.com) dengan SSL otomatis. Tersedia di paket Business atau lewat layanan full."
      />
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      customDomainVerifyToken: true,
      customDomainVerifiedAt: true,
    },
  });
  if (!tenant) redirect("/dashboard");

  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexRing}</span> Custom Domain</p>
        <h1 className="display-md">Domain toko Anda.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Ganti URL <code style={{ fontFamily: "var(--font-mono)" }}>/store/{tenant.slug}</code> menjadi domain
          milik Anda sendiri (mis. <code style={{ fontFamily: "var(--font-mono)" }}>tokoanda.com</code>).
        </p>
      </div>

      <DomainManager
        initial={{
          slug: tenant.slug,
          domain: tenant.customDomain,
          status: (tenant.customDomainStatus ?? "NONE") as
            | "NONE" | "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED",
          verifyToken: tenant.customDomainVerifyToken,
          verifiedAt: tenant.customDomainVerifiedAt
            ? tenant.customDomainVerifiedAt.toISOString()
            : null,
          rootDomain: ROOT,
        }}
      />
    </div>
  );
}
