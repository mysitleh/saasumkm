import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseLogoConfig, DEFAULT_LOGO } from "@/lib/logo";
import { GLYPH } from "@/lib/glyphs";
import LogoBuilder from "./LogoBuilder";

export const dynamic = "force-dynamic";

export default async function LogoPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, logoConfig: true },
  });
  if (!tenant) redirect("/dashboard");

  const initial = parseLogoConfig(tenant.logoConfig) ?? DEFAULT_LOGO;

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.diamond}</span> Logo Builder</p>
        <h1 className="display-md">Desain logo toko Anda.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Pilih bentuk, simbol, gaya isi, dan warna. Banyak kombinasi, live preview, langsung tampil di storefront.
        </p>
      </div>

      <LogoBuilder initialConfig={initial} storeName={tenant.name} />
    </div>
  );
}
