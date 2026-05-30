import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import { GLYPH } from "@/lib/glyphs";
import MarqueeHeading from "@/components/MarqueeHeading";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user.tenantId || session.user.role !== "OWNER") redirect("/dashboard");
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant) redirect("/dashboard");
  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexMolecule}</span> Pengaturan</p>
        <MarqueeHeading text="Profil toko" />
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Kelola profil toko, QRIS, dan tampilan storefront Anda.
        </p>
      </div>
      <SettingsForm tenant={tenant} />
    </div>
  );
}
