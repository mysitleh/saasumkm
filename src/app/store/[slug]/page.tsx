import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShoppingBag, MapPin, Phone } from "lucide-react";
import StorefrontClient from "./StorefrontClient";
interface Props { params: Promise<{ slug: string }>; }
export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      categories: true,
      products: { where: { isActive: true, stock: { gt: 0 } }, include: { category: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!tenant || !tenant.isActive) notFound();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {tenant.logoUrl ? <img src={tenant.logoUrl} alt={tenant.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"/> : <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-white"/></div>}
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              {tenant.description && <p className="text-green-100 text-sm mt-1">{tenant.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-green-200">
                {tenant.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{tenant.address}</span>}
                {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{tenant.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <StorefrontClient
          tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug, qrisImageUrl: tenant.qrisImageUrl }}
          products={tenant.products.map(p => ({ id: p.id, name: p.name, description: p.description, price: p.price, stock: p.stock, imageUrl: p.imageUrl, category: p.category ? { name: p.category.name } : null }))}
          categories={tenant.categories.map(c => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
