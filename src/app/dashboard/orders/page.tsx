import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";
import OrderSearch from "./OrderSearch";
import Pagination from "@/components/Pagination";

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "WAITING_PAYMENT", label: "Menunggu Bayar" },
  { value: "PAID_MANUAL", label: "Sudah Bayar" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const { status, page, q } = await searchParams;
  const tenantId = session.user.tenantId;
  const currentPage = parseInt(page || "1");
  const pageSize = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId };
  if (status) where.status = status;
  if (q && q.trim()) {
    where.OR = [
      { orderNumber: { contains: q.trim() } },
      { customerName: { contains: q.trim() } },
      { customerPhone: { contains: q.trim() } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.page && params.page !== "1") p.set("page", params.page);
    if (params.q) p.set("q", params.q);
    const qs = p.toString();
    return `/dashboard/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hexFilled}</span> Orders</p>
        <h1 className="display-md">Pesanan.</h1>
        <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>{total} total pesanan</p>
      </div>

      <OrderSearch defaultValue={q ?? ""} status={status} />

      {/* Status tabs */}
      <div className="tab-strip">
        {STATUS_TABS.map((tab) => {
          const active = (status || "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={buildHref({ status: tab.value || undefined, q })}
              className="tab-pill"
              data-active={active}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <section className="list-card">
        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-glyph glyph">{GLYPH.hexFilled}</span>
            {q ? `Tidak ditemukan pesanan untuk "${q}"` : "Belum ada pesanan."}
          </div>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/dashboard/orders/${order.id}`} className="list-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="body-md tabular">{order.orderNumber}</p>
                      <span className="status-pill" data-status={order.status}>{ORDER_STATUS_LABELS[order.status]}</span>
                    </div>
                    <p className="caption" style={{ color: "var(--shade-60)" }}>{order.customerName}</p>
                    <p className="micro tabular mt-0.5" style={{ color: "var(--shade-50)" }}>
                      {order.items.length} item <span className="glyph">·</span>{" "}
                      {order.deliveryType === "PICKUP" ? "Ambil di toko" : "Diantar"} <span className="glyph">·</span>{" "}
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="body-strong tabular ml-4 flex-shrink-0">{formatRupiah(order.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        hrefFor={(p) => buildHref({ status, q, page: String(p) })}
      />
    </div>
  );
}
