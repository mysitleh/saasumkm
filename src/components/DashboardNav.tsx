"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ShoppingBag, LayoutDashboard, Package, ShoppingCart, Settings, LogOut, ExternalLink, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";
const navItems = [
  { href:"/dashboard", label:"Dashboard", icon:LayoutDashboard },
  { href:"/dashboard/orders", label:"Pesanan", icon:ShoppingCart },
  { href:"/dashboard/products", label:"Produk", icon:Package },
  { href:"/dashboard/promos", label:"Promo", icon:Tag },
  { href:"/dashboard/settings", label:"Pengaturan", icon:Settings },
];
export default function DashboardNav({ session }: { session: Session }) {
  const pathname = usePathname();
  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-green-600"/><span className="font-bold text-gray-900">UMKMStore</span><span className="text-gray-300 mx-1">|</span><span className="text-sm text-gray-600 font-medium">{session.user.name}</span></div>
          <div className="flex items-center gap-3">
            {session.user.tenantSlug && <Link href={`/store/${session.user.tenantSlug}`} target="_blank" className="text-sm text-green-600 flex items-center gap-1">Lihat Toko <ExternalLink className="w-3 h-3"/></Link>}
            <button onClick={() => signOut({ callbackUrl:"/" })} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"><LogOut className="w-4 h-4"/>Keluar</button>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden">
        <div className="flex">
          {navItems.slice(0,4).map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href+"/");
            return <Link key={item.href} href={item.href} className={cn("flex-1 flex flex-col items-center py-2 text-xs gap-1", active?"text-green-600":"text-gray-500")}><Icon className="w-5 h-5"/>{item.label}</Link>;
          })}
        </div>
      </nav>
      <aside className="hidden md:flex fixed left-0 top-[57px] bottom-0 w-56 bg-white border-r flex-col p-4 gap-1 z-30">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href+"/");
          return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors", active?"bg-green-50 text-green-700":"text-gray-600 hover:bg-gray-50")}><Icon className="w-4 h-4"/>{item.label}</Link>;
        })}
      </aside>
    </>
  );
}
