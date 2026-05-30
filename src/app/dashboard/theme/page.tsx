import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveTenantTheme } from "@/lib/theme-runtime";
import { GLYPH } from "@/lib/glyphs";
import ThemeBuilder from "./ThemeBuilder";
import MarqueeHeading from "@/components/MarqueeHeading";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      slug: true,
      name: true,
      logoUrl: true,
      themeMode: true,
      themePrimary: true,
      themeAccent: true,
      themeSurface: true,
      themeInk: true,
      themeRadius: true,
      themeFont: true,
      themeColor: true,
    },
  });
  if (!tenant) redirect("/dashboard");

  const theme = resolveTenantTheme(tenant);

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> Brand</p>
        <MarqueeHeading text="Theme Builder" />
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Atur warna, font, dan rounded corner toko Anda. Live preview ada di kanan.
        </p>
      </div>

      <ThemeBuilder
        tenant={{ slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl }}
        initialTheme={theme}
      />
    </div>
  );
}
