import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Tag, Plus } from "lucide-react";
import PromoForm from "./PromoForm";
export default async function PromosPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const promos = await prisma.promo.findMany({ where: { tenantId }, orderBy: { createdAt:"desc" } });
  return (
    <div className="md:ml-56 pb-20 md:pb-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Promo & Diskon</h1><p className="text-gray-600 text-sm mt-1">Kelola kode promo untuk pelanggan</p></div>
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6"><h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Buat Promo Baru</h2><PromoForm tenantId={tenantId}/></div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b"><h2 className="font-semibold text-gray-900">Daftar Promo ({promos.length})</h2></div>
        {promos.length === 0 ? <div className="py-12 text-center text-gray-500"><Tag className="w-10 h-10 mx-auto mb-2 text-gray-300"/><p className="text-sm">Belum ada promo</p></div> : (
          <div className="divide-y">
            {promos.map(promo => (
              <div key={promo.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-sm">{promo.code}</span><span className={`text-xs px-2 py-0.5 rounded-full ${promo.isActive?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{promo.isActive?"Aktif":"Nonaktif"}</span></div>
                  <p className="text-sm text-gray-600 mt-1">{promo.type==="PERCENT"?`Diskon ${promo.value}%`:`Diskon ${formatRupiah(promo.value)}`}{promo.minOrder>0&&` · Min. order ${formatRupiah(promo.minOrder)}`}{promo.maxDiscount&&` · Maks. ${formatRupiah(promo.maxDiscount)}`}</p>
                  {promo.expiresAt && <p className="text-xs text-gray-400">Berlaku s/d {new Date(promo.expiresAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
