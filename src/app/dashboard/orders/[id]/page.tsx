import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import OrderActions from "./OrderActions";
import { ArrowLeft, Package, MapPin, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, tenantId: session.user.tenantId }, include: { items: { include: { product: true } }, promo: true } });
  if (!order) notFound();
  return (
    <div className="md:ml-56 pb-20 md:pb-6 max-w-2xl">
      <div className="mb-4">
        <Link href="/dashboard/orders" className="text-sm text-gray-500 flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4"/>Kembali ke Pesanan</Link>
        <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1><span className={cn("text-sm px-3 py-1 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>{ORDER_STATUS_LABELS[order.status]}</span></div>
        <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
      </div>
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">Info Pemesan</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700"><Package className="w-4 h-4 text-gray-400"/><span className="font-medium">{order.customerName}</span></div>
          {order.customerPhone && <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400"/><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></div>}
          <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400"/><span>{order.deliveryType==="PICKUP"?"Ambil di toko":`Diantar ke: ${order.deliveryAddress}`}</span></div>
          {order.customerNote && <div className="flex items-start gap-2 text-gray-700"><MessageSquare className="w-4 h-4 text-gray-400 mt-0.5"/><span className="italic">{order.customerNote}</span></div>}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">Item Pesanan</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover"/> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400"/></div>}
                <div><p className="text-sm font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{formatRupiah(item.price)} × {item.quantity}</p></div>
              </div>
              <p className="font-semibold text-sm">{formatRupiah(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatRupiah(order.subtotal)}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Diskon {order.promo?`(${order.promo.code})`:""}</span><span>-{formatRupiah(order.discountAmount)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span className="text-green-600">{formatRupiah(order.total)}</span></div>
        </div>
      </div>
      <OrderActions orderId={order.id} currentStatus={order.status} isOwner={session.user.role==="OWNER"}/>
    </div>
  );
}
