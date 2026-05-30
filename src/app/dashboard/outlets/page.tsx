import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasFeature } from "@/lib/features";
import { Storefront, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";
import OutletForm from "./OutletForm";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
  const session = await auth();
  if (!session?.user.tenantId || session.user.role !== "OWNER") redirect("/dashboard");

  const canMultiOutlet = await hasFeature(session.user.tenantId, "multiOutlet");

  if (!canMultiOutlet) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexRing}</span> Outlet</p>
          <h1 className="display-md">Multi outlet.</h1>
        </div>
        <div className="card text-center max-w-xl mx-auto" style={{ padding: 48 }}>
          <span className="empty-state-glyph glyph">{GLYPH.hexRing}</span>
          <h2 className="heading-md mb-2">Fitur Paket Business</h2>
          <p className="body-md mb-6" style={{ color: "var(--shade-50)" }}>
            Kelola hingga 5 outlet/cabang toko Anda. Tersedia di paket Business.
          </p>
          <Link href="/dashboard/billing" className="pill pill-primary inline-flex">
            Upgrade ke Business <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        </div>
      </div>
    );
  }

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexRing}</span> Outlet</p>
        <h1 className="display-md">Multi outlet.</h1>
        <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>
          Kelola cabang toko Anda <span className="glyph">·</span> {outlets.length}/5 outlet
        </p>
      </div>

      <section className="card mb-6">
        <h2 className="heading-md mb-4 flex items-center gap-2">
          <Storefront size={18} /> Tambah outlet
        </h2>
        <OutletForm currentCount={outlets.length} />
      </section>

      <section className="list-card">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamondThin}</span> Daftar</p>
            <h2 className="heading-md">Outlet aktif</h2>
          </div>
          <span className="caption tabular" style={{ color: "var(--shade-50)" }}>{outlets.length}/5</span>
        </header>
        {outlets.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.hexRing}</span>
            Belum ada outlet tambahan.
          </div>
        ) : (
          <ul>
            {outlets.map((outlet) => (
              <li key={outlet.id} className="list-row">
                <div className="min-w-0 flex-1">
                  <p className="body-md">{outlet.name}</p>
                  {outlet.address && (
                    <p className="micro tabular flex items-center gap-1" style={{ color: "var(--shade-50)" }}>
                      <MapPin size={11} /> {outlet.address}
                    </p>
                  )}
                  {outlet.phone && (
                    <p className="micro tabular flex items-center gap-1" style={{ color: "var(--shade-50)" }}>
                      <Phone size={11} /> {outlet.phone}
                    </p>
                  )}
                </div>
                <span className="status-pill flex-shrink-0" data-status={outlet.isActive ? "PROCESSING" : "CANCELLED"}>
                  {outlet.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
