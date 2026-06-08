import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";
import { calculatePpn } from "@/lib/tax";
import { redirect, notFound } from "next/navigation";
import OrderActions from "./OrderActions";
import PrintReceipt from "./PrintReceipt";
import { ArrowLeft, Package, MapPin, Phone, ChatText, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { items: { include: { product: true } }, promo: true, tenant: { select: { slug: true, name: true, address: true, taxEnabled: true, taxRate: true, taxMode: true } } },
  });
  if (!order) notFound();

  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <Link href="/dashboard/orders" className="caption inline-flex items-center gap-1 mb-4 hover:underline" style={{ color: "var(--shade-50)" }}>
          <ArrowLeft size={14} /> Kembali ke Pesanan
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="display-md tabular">{order.orderNumber}</h1>
          <span className="status-pill" data-status={order.status}>{ORDER_STATUS_LABELS[order.status]}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <Link
            href={`/store/${order.tenant.slug}/order/${order.orderNumber}`}
            target="_blank"
            className="micro inline-flex items-center gap-1 hover:underline"
            style={{ color: "var(--ink)" }}
          >
            Invoice publik <ArrowSquareOut size={11} />
          </Link>
        </div>
      </div>

      <section className="card mb-4">
        <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.lozenge}</span> Pemesan</p>
        <h2 className="heading-md mb-4">Info pemesan</h2>
        <div className="space-y-2 caption">
          <div className="flex items-center gap-2"><Package size={14} style={{ color: "var(--shade-50)" }} /><span className="body-md">{order.customerName}</span></div>
          {order.customerPhone && (
            <div className="flex items-center gap-2" style={{ color: "var(--shade-60)" }}>
              <Phone size={14} style={{ color: "var(--shade-50)" }} />
              <a href={`tel:${order.customerPhone}`} className="hover:underline">{order.customerPhone}</a>
            </div>
          )}
          <div className="flex items-center gap-2" style={{ color: "var(--shade-60)" }}>
            <MapPin size={14} style={{ color: "var(--shade-50)" }} />
            <span>{order.deliveryType === "PICKUP" ? "Ambil di toko" : `Diantar ke: ${order.deliveryAddress}`}</span>
          </div>
          {order.customerNote && (
            <div className="flex items-start gap-2" style={{ color: "var(--shade-60)" }}>
              <ChatText size={14} style={{ color: "var(--shade-50)", marginTop: 2 }} />
              <span className="italic">{order.customerNote}</span>
            </div>
          )}
        </div>
      </section>

      <section className="card mb-4">
        <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.hexFilled}</span> Items</p>
        <h2 className="heading-md mb-4">Item pesanan</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.imageUrl} alt={item.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--canvas-cream)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Package size={18} style={{ color: "var(--shade-40)" }} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="body-md truncate">{item.name}</p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>{formatRupiah(item.price)} × {item.quantity}</p>
                </div>
              </div>
              <p className="body-strong tabular flex-shrink-0">{formatRupiah(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <hr className="hairline mt-4 mb-3" />
        <div className="space-y-1 caption tabular">
          <div className="flex justify-between" style={{ color: "var(--shade-60)" }}>
            <span>Subtotal</span><span>{formatRupiah(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between" style={{ color: "var(--shade-60)" }}>
              <span>Diskon {order.promo ? `(${order.promo.code})` : ""}</span>
              <span>−{formatRupiah(order.discountAmount)}</span>
            </div>
          )}
          {order.tenant.taxEnabled && (() => {
            const b = calculatePpn(order.total, (order.tenant.taxMode as "EXCLUSIVE" | "INCLUSIVE") ?? "EXCLUSIVE", order.tenant.taxRate ?? 0.11);
            return (
              <>
                <div className="flex justify-between" style={{ color: "var(--shade-60)" }}>
                  <span>DPP</span><span>{formatRupiah(b.base)}</span>
                </div>
                <div className="flex justify-between" style={{ color: "var(--shade-60)" }}>
                  <span>PPN ({Math.round((order.tenant.taxRate ?? 0.11) * 100)}%)</span><span>{formatRupiah(b.tax)}</span>
                </div>
              </>
            );
          })()}
          <div className="flex justify-between body-strong pt-2" style={{ borderTop: "1px solid var(--hairline-light)", marginTop: 4 }}>
            <span>Total</span><span>{formatRupiah(order.total)}</span>
          </div>
        </div>
      </section>

      <div className="flex gap-3 mb-4">
        <PrintReceipt
          order={{
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryType: order.deliveryType,
            items: order.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })),
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            total: order.total,
            createdAt: order.createdAt.toISOString(),
            tenantName: order.tenant.name,
            tenantAddress: order.tenant.address,
          }}
        />
      </div>
      <OrderActions orderId={order.id} currentStatus={order.status} isOwner={session.user.role === "OWNER"} />
    </div>
  );
}
