import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Plus, Edit } from "lucide-react";
import ProductToggle from "./ProductToggle";
export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const products = await prisma.product.findMany({ where: { tenantId: session.user.tenantId }, include: { category: true }, orderBy: { createdAt:"desc" } });
  return (
    <div className="md:ml-56 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Produk</h1><p className="text-gray-600 text-sm mt-1">{products.length} produk</p></div>
        <Link href="/dashboard/products/new" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-2"><Plus className="w-4 h-4"/>Tambah Produk</Link>
      </div>
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><Package className="w-12 h-12 mx-auto mb-3 text-gray-300"/><p className="text-gray-600 mb-4">Belum ada produk</p><Link href="/dashboard/products/new" className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 inline-flex items-center gap-2"><Plus className="w-4 h-4"/>Tambah Produk Pertama</Link></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {products.map(product => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/> : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Package className="w-6 h-6 text-gray-400"/></div>}
                <div className="flex-1 min-w-0"><p className="font-medium text-sm text-gray-900 truncate">{product.name}</p><p className="text-xs text-gray-500">{product.category?.name && <span className="mr-2">{product.category.name}</span>}Stok: {product.stock}</p><p className="text-green-600 font-semibold text-sm">{formatRupiah(product.price)}</p></div>
                <div className="flex items-center gap-2 flex-shrink-0"><ProductToggle productId={product.id} isActive={product.isActive}/><Link href={`/dashboard/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4"/></Link></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
