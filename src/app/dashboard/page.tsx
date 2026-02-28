import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, TrendingUp, Package, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const today = new Date(); today.setHours(0,0,0,0);
  const [totalOrders, todayOrders, pendingOrders, totalRevenue, todayRevenue, productCount, recentOrders, tenant] = await Promise.all([
    prisma.order.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: today } } }),
    prisma.order.count({ where: { tenantId, status: "WAITING_PAYMENT" } }),
    prisma.order.aggregate({ where: { tenantId, status: { in: ["PAID_MANUAL","PROCESSING","COMPLETED"] } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { tenantId, status: { in: ["PAID_MANUAL","PROCESSING","COMPLETED"] }, createdAt: { gte: today } }, _sum: { total: true } }),
    prisma.product.count({ where: { tenantId, isActive: true } }),
    prisma.order.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5, include: { items: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);
  const stats = [
    { label:"Total Omzet", value:formatRupiah(totalRevenue._sum.total??0), sub:`Hari ini: ${formatRupiah(todayRevenue._sum.total??0)}`, icon:<TrendingUp className="w-6 h-6 text-green-600"/>, bg:"bg-green-50" },
    { label:"Total Order", value:totalOrders.toString(), sub:`Hari ini: ${todayOrders}`, icon:<ShoppingCart className="w-6 h-6 text-blue-600"/>, bg:"bg-blue-50" },
    { label:"Menunggu Bayar", value:pendingOrders.toString(), sub:"Perlu dikonfirmasi", icon:<Clock className="w-6 h-6 text-yellow-600"/>, bg:"bg-yellow-50" },
    { label:"Produk Aktif", value:productCount.toString(), sub:"Tersedia di toko", icon:<Package className="w-6 h-6 text-purple-600"/>, bg:"bg-purple-50" },
  ];
  return (
    <div className="md:ml-56 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Selamat datang, {session.user.name?.split(" ")[0]}! 👋</h1>
        <p className="text-gray-600 text-sm mt-1">{tenant?.name} — {tenant?.slug && <Link href={`/store/${tenant.slug}`} target="_blank" className="text-green-600 hover:underline inline-flex items-center gap-1">/store/{tenant.slug} <ExternalLink className="w-3 h-3"/></Link>}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s,i) => <div key={i} className={`${s.bg} rounded-2xl p-4`}><div className="flex items-center justify-between mb-2">{s.icon}</div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-600 mt-1">{s.label}</p><p className="text-xs text-gray-500">{s.sub}</p></div>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[{href:"/dashboard/orders?status=WAITING_PAYMENT",label:"Konfirmasi Bayar",color:"bg-yellow-500"},{href:"/dashboard/products/new",label:"Tambah Produk",color:"bg-green-600"},{href:"/dashboard/orders",label:"Lihat Semua Order",color:"bg-blue-600"},{href:"/dashboard/settings",label:"Pengaturan Toko",color:"bg-gray-600"}].map((a,i) => <Link key={i} href={a.href} className={`${a.color} text-white rounded-xl px-4 py-3 text-sm font-medium text-center hover:opacity-90`}>{a.label}</Link>)}
      </div>
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-4 py-4 border-b flex items-center justify-between"><h2 className="font-bold text-gray-900">Pesanan Terbaru</h2><Link href="/dashboard/orders" className="text-sm text-green-600 flex items-center gap-1">Lihat semua <ArrowRight className="w-3 h-3"/></Link></div>
        {recentOrders.length === 0 ? <div className="py-12 text-center text-gray-500"><ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300"/><p className="text-sm">Belum ada pesanan</p></div> : (
          <div className="divide-y">
            {recentOrders.map(order => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div><p className="font-medium text-sm text-gray-900">{order.orderNumber}</p><p className="text-xs text-gray-500">{order.customerName} · {order.items.length} item</p></div>
                <div className="text-right"><p className="font-semibold text-sm text-gray-900">{formatRupiah(order.total)}</p><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ORDER_STATUS_COLORS[order.status])}>{ORDER_STATUS_LABELS[order.status]}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
