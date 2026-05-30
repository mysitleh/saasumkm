import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import { GLYPH } from "@/lib/glyphs";
import CustomerSearch from "./CustomerSearch";
import BroadcastForm from "./BroadcastForm";
import MarqueeHeading from "@/components/MarqueeHeading";

export const dynamic = "force-dynamic";

interface Customer {
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const { q } = await searchParams;
  const search = q?.trim();
  const pageSize = 50;

  let customers: Customer[];
  let total: number;

  if (search) {
    const pattern = `%${search}%`;
    customers = await prisma.$queryRawUnsafe(
      `SELECT customerName AS name, customerPhone AS phone, COUNT(*) AS totalOrders, SUM(total) AS totalSpent, MAX(createdAt) AS lastOrderAt
       FROM orders WHERE tenantId = ? AND (customerName LIKE ? OR customerPhone LIKE ?)
       GROUP BY customerName, customerPhone ORDER BY lastOrderAt DESC LIMIT ?`,
      tenantId, pattern, pattern, pageSize,
    );
    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (SELECT DISTINCT customerName, customerPhone FROM orders WHERE tenantId = ? AND (customerName LIKE ? OR customerPhone LIKE ?))`,
      tenantId, pattern, pattern,
    );
    total = Number(countResult[0]?.count ?? 0);
  } else {
    customers = await prisma.$queryRawUnsafe(
      `SELECT customerName AS name, customerPhone AS phone, COUNT(*) AS totalOrders, SUM(total) AS totalSpent, MAX(createdAt) AS lastOrderAt
       FROM orders WHERE tenantId = ?
       GROUP BY customerName, customerPhone ORDER BY lastOrderAt DESC LIMIT ?`,
      tenantId, pageSize,
    );
    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM (SELECT DISTINCT customerName, customerPhone FROM orders WHERE tenantId = ?)`,
      tenantId,
    );
    total = Number(countResult[0]?.count ?? 0);
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.lozenge}</span> Customers</p>
        <MarqueeHeading text="Pelanggan" />
        <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>{total} pelanggan unik</p>
      </div>

      <CustomerSearch defaultValue={q ?? ""} />
      <BroadcastForm />

      <section className="list-card">
        {customers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.lozenge}</span>
            {search ? `Tidak ditemukan untuk "${search}"` : "Belum ada pelanggan."}
          </div>
        ) : (
          <ul>
            {customers.map((c, i) => (
              <li key={i} className="list-row">
                <div className="min-w-0 flex-1">
                  <p className="body-md truncate">{c.name}</p>
                  {c.phone && (
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                      <span className="glyph">{GLYPH.diamondThin}</span> {c.phone}
                    </p>
                  )}
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                    Terakhir: {new Date(c.lastOrderAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="body-strong tabular">{formatRupiah(Number(c.totalSpent))}</p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>{Number(c.totalOrders)} order</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
