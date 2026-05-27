import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import { GLYPH } from "@/lib/glyphs";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const [cards, totalCards, totalPointsIssued] = await Promise.all([
    prisma.loyaltyCard.findMany({
      where: { tenantId },
      orderBy: { points: "desc" },
      take: 50,
    }),
    prisma.loyaltyCard.count({ where: { tenantId } }),
    prisma.loyaltyCard.aggregate({ where: { tenantId }, _sum: { points: true, totalSpent: true } }),
  ]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.premium}</span> Loyalty</p>
        <h1 className="display-md">Program poin pelanggan.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>
          Pelanggan mendapat 1 poin setiap belanja Rp 10.000.
        </p>
      </div>

      <div className="kpi-grid-3 mb-6">
        <Stat glyph={GLYPH.premium} label="Member loyalty" value={String(totalCards)} accent="aloe" />
        <Stat glyph={GLYPH.sparkle} label="Total poin beredar" value={String(totalPointsIssued._sum.points ?? 0)} />
        <Stat glyph={GLYPH.diamond} label="Total belanja member" value={formatRupiah(totalPointsIssued._sum.totalSpent ?? 0)} />
      </div>

      <section className="list-card">
        <header className="list-card-header">
          <div>
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.lozenge}</span> Top members</p>
            <h2 className="heading-md">Pelanggan dengan poin tertinggi</h2>
          </div>
        </header>
        {cards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.premium}</span>
            Belum ada member loyalty.
            <p className="micro mt-2">Poin otomatis diberikan saat order dibayar.</p>
          </div>
        ) : (
          <ul>
            {cards.map((card, i) => (
              <li key={card.id} className="list-row">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="caption tabular flex-shrink-0" style={{
                    width: 28, height: 28, borderRadius: 9999,
                    background: i < 3 ? "var(--aloe-10)" : "var(--canvas-cream)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 550,
                  }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="body-md truncate">{card.customerName}</p>
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                      {card.customerPhone} <span className="glyph">·</span> {card.totalOrders} order
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="body-strong tabular">{card.points} <span style={{ color: "var(--shade-50)", fontWeight: 420 }}>poin</span></p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>{formatRupiah(card.totalSpent)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="micro mt-6" style={{ color: "var(--shade-50)" }}>
        <span className="glyph">{GLYPH.therefore}</span> Cara kerja: pelanggan otomatis dapat poin saat order dikonfirmasi bayar
        (1 poin per Rp 10.000), dan dapat memeriksa poin di halaman <span style={{ color: "var(--ink)" }}>Lacak Pesanan</span> toko Anda.
        Redeem poin akan tersedia di update berikutnya.
      </p>
    </div>
  );
}

function Stat({ glyph, label, value, accent }: { glyph: string; label: string; value: string; accent?: "aloe" }) {
  return (
    <div className={accent === "aloe" ? "kpi-card kpi-card-aloe" : "kpi-card"}>
      <p className="kpi-eyebrow"><span className="glyph">{glyph}</span> {label}</p>
      <p className="kpi-value">{value}</p>
    </div>
  );
}
