import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveTemplate } from "@/lib/template-runtime";
import { resolveTenantTheme } from "@/lib/theme-runtime";
import { hasFeature } from "@/lib/features";
import FeatureGate from "@/components/FeatureGate";
import { GLYPH } from "@/lib/glyphs";
import TemplateBuilder from "./TemplateBuilder";
import MarqueeHeading from "@/components/MarqueeHeading";

export const dynamic = "force-dynamic";

export default async function TemplatePage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  if (!(await hasFeature(session.user.tenantId, "templateBuilder"))) {
    return (
      <FeatureGate
        requiredPlan="Pro"
        title="Custom storefront, tanpa coding."
        description="Pilih layout, button, icon, hero, dan carousel untuk storefront Anda. Tersedia di paket Pro ke atas."
      />
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: {
      products: {
        where: { isActive: true },
        select: { id: true, name: true, price: true, imageUrl: true, stock: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!tenant) redirect("/dashboard");

  const template = resolveTemplate(tenant);
  const theme = resolveTenantTheme(tenant);

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> Template Builder</p>
        <MarqueeHeading text="Custom storefront, tanpa coding" reverse />
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Pilih layout, button, icon, hero, dan carousel. Live preview di kanan, langsung apply ke storefront publik.
        </p>
      </div>

      <TemplateBuilder
        tenant={{
          slug: tenant.slug,
          name: tenant.name,
          logoUrl: tenant.logoUrl,
        }}
        products={tenant.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          stock: p.stock,
        }))}
        initialTemplate={template}
        theme={theme}
      />
    </div>
  );
}
