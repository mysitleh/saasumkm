import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
const STATUS_TABS = [{ value:"", label:"Semua" },{ value:"WAITING_PAYMENT", label:"Menunggu Bayar" },{ value:"PAID_MANUAL", label:"Sudah Bayar" },{ value:"PROCESSING", label:"Diproses" },{ value:"COMPLETED", label:"Selesai" },{ value:"CANCELLED", label:"Dibatalkan" }];
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const { status, page } = await searchParams;
  const tenantId = session.user.tenantId;
  const currentPage = parseInt(page||"1");
  const pageSize = 20;
  const where = { tenantId, ...(status ? { status } : {}) };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt:"desc" }, skip: (currentPage-1)*pageSize, take: pageSize, include: { items: true } }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.ceil(total/pageSize);
  return (
    <div className="md:ml-56 pb-20 md:pb-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Pesanan</h1><p className="text-gray-600 text-sm mt-1">{total} total pesanan</p></div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_TABS.map(tab => <Link key={tab.value} href={`/dashboard/orders${tab.value ? `?status=${tab.value}` : ""}`} className={cn("flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors", (status||"")===tab.value ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200")}>{tab.label}</Link>)}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {orders.length === 0 ? <div className="py-16 text-center text-gray-500"><ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300"/><p className="text-sm">Tidak ada pesanan</p></div> : (
          <div className="divide-y">
            {orders.map(order => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-sm text-gray-900">{order.orderNumber}</p><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>{ORDER_STATUS_LABELS[order.status]}</span></div>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item · {order.deliveryType==="PICKUP"?"Ambil di toko":"Diantar"} · {new Date(order.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                </div>
                <div className="text-right ml-4"><p className="font-bold text-gray-900">{formatRupiah(order.total)}</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {totalPages > 1 && <div className="flex justify-center gap-2 mt-4">{Array.from({length:totalPages},(_,i)=>i+1).map(p => <Link key={p} href={`/dashboard/orders?${status?`status=${status}&`:""}page=${p}`} className={cn("w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center", p===currentPage?"bg-green-600 text-white":"bg-white text-gray-600 border border-gray-200")}>{p}</Link>)}</div>}
    </div>
  );
}
