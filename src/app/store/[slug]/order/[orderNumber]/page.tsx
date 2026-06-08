import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatRupiah, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ShoppingBag, Package, MapPin, Phone, ChatText, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { calculatePpn, type TaxMode } from "@/lib/tax";
import ReceiptShareButton from "./ReceiptShareButton";

interface Props {
  params: Promise<{ slug: string; orderNumber: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, orderNumber } = await params;
  return {
    title: `Invoice ${orderNumber} — UMKMStore`,
    description: `Detail pesanan ${orderNumber} di toko ${slug}`,
  };
}

export default async function InvoicePage({ params }: Props) {
  const { slug, orderNumber } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const order = await prisma.order.findFirst({
    where: { tenantId: tenant.id, orderNumber },
    include: { items: { include: { product: true } }, promo: true },
  });
  if (!order) notFound();

  const isPaid = ["PAID_MANUAL", "PROCESSING", "COMPLETED"].includes(order.status);

  // PPN breakdown jika tenant aktifkan tax
  const tax = tenant.taxEnabled
    ? calculatePpn(order.total, (tenant.taxMode as TaxMode) ?? "EXCLUSIVE", tenant.taxRate ?? 0.11)
    : null;

  return (
    <div className="min-h-screen bg-[var(--surface-cream)] py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-4">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.name} className="w-10 h-10 rounded-[14px] object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-[14px] bg-emerald-100 flex items-center justify-center">
                <ShoppingBag size={20} className="text-[var(--accent)]" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-[var(--ink)]">{tenant.name}</h1>
              <p className="text-xs text-[var(--ink-muted)]">{tenant.address}</p>
            </div>
          </div>

          <div className="border-t border-[var(--border-warm)] pt-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[var(--ink)]">Invoice</h2>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[var(--ink-muted)] text-xs">No. Order</p>
                <p className="font-mono font-semibold text-[var(--ink)]">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-[var(--ink-muted)] text-xs">Tanggal</p>
                <p className="text-[var(--ink)]">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-[var(--ink)] text-sm mb-2">Pemesan</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-[var(--ink-muted)]">
              <Package size={14} className="text-[var(--ink-muted)]" />
              <span>{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                <Phone size={14} className="text-[var(--ink-muted)]" />
                <span>{order.customerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[var(--ink-muted)]">
              <MapPin size={14} className="text-[var(--ink-muted)]" />
              <span>{order.deliveryType === "PICKUP" ? "Ambil di toko" : order.deliveryAddress}</span>
            </div>
            {order.customerNote && (
              <div className="flex items-start gap-2 text-[var(--ink-muted)]">
                <ChatText size={14} className="text-[var(--ink-muted)] mt-0.5" />
                <span className="italic">{order.customerNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-[var(--ink)] text-sm mb-3">Item Pesanan</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="text-[var(--ink)]">{item.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatRupiah(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-[var(--ink)]">{formatRupiah(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border-warm)] mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-[var(--ink-muted)]">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-[var(--accent)]">
                <span>Diskon {order.promo ? `(${order.promo.code})` : ""}</span>
                <span>-{formatRupiah(order.discountAmount)}</span>
              </div>
            )}
            {tax && (
              <>
                <div className="flex justify-between text-sm text-[var(--ink-muted)]">
                  <span>DPP (sebelum PPN)</span>
                  <span>{formatRupiah(tax.base)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--ink-muted)]">
                  <span>PPN ({Math.round((tenant.taxRate ?? 0.11) * 100)}%)</span>
                  <span>{formatRupiah(tax.tax)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-[var(--border-warm)]">
              <span>Total</span>
              <span className="text-[var(--accent)]">{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Share receipt */}
        <ReceiptShareButton slug={slug} orderId={order.id} />

        {/* Status */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm text-center">
          {isPaid ? (
            <div className="flex items-center justify-center gap-2 text-[var(--accent)]">
              <CheckCircle size={20} weight="fill" />
              <span className="font-semibold text-sm">Pembayaran diterima</span>
            </div>
          ) : order.status === "CANCELLED" ? (
            <p className="text-sm text-red-500 font-medium">Pesanan dibatalkan</p>
          ) : (
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <Clock size={20} />
              <span className="font-semibold text-sm">Menunggu pembayaran</span>
            </div>
          )}
          {order.paidAt && (
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Dibayar: {new Date(order.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--ink-muted)] mt-4">
          Terima kasih sudah berbelanja di {tenant.name}
        </p>
      </div>
    </div>
  );
}
