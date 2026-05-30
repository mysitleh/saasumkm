import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { GLYPH } from "@/lib/glyphs";
import PromoForm from "./PromoForm";
import PromoActions from "./PromoActions";
import MarqueeHeading from "@/components/MarqueeHeading";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const promos = await prisma.promo.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.diamond}</span> Promo</p>
        <MarqueeHeading text="Kode promo & diskon" reverse />
        <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>
          {promos.length} promo
        </p>
      </div>

      <section className="card mb-6">
        <h2 className="heading-md mb-4 flex items-center gap-2">
          <Plus size={18} /> Buat promo baru
        </h2>
        <PromoForm />
      </section>

      <section className="list-card">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamondThin}</span> Daftar</p>
            <h2 className="heading-md">Promo aktif</h2>
          </div>
        </header>
        {promos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.diamond}</span>
            Belum ada promo.
          </div>
        ) : (
          <ul>
            {promos.map((promo) => (
              <li key={promo.id} className="list-row">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="caption tabular" style={{
                      fontFamily: "var(--font-mono)",
                      background: "var(--aloe-10)",
                      color: "var(--ink)",
                      padding: "2px 10px",
                      borderRadius: 9999,
                      letterSpacing: "0.04em",
                      fontWeight: 550,
                    }}>
                      {promo.code}
                    </span>
                    <span className="status-pill" data-status={promo.isActive ? "PROCESSING" : "CANCELLED"}>
                      {promo.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="caption tabular" style={{ color: "var(--shade-60)" }}>
                    {promo.type === "PERCENT" ? `Diskon ${promo.value}%` : `Diskon ${formatRupiah(promo.value)}`}
                    {promo.minOrder > 0 && <> <span className="glyph">·</span> Min. order {formatRupiah(promo.minOrder)}</>}
                    {promo.maxDiscount && <> <span className="glyph">·</span> Maks. {formatRupiah(promo.maxDiscount)}</>}
                  </p>
                  {promo.expiresAt && (
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                      Berlaku s/d {new Date(promo.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <PromoActions promoId={promo.id} isActive={promo.isActive} code={promo.code} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
