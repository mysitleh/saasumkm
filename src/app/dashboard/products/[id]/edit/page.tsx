import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ProductForm from "../../ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({ where: { id, tenantId: session.user.tenantId } }),
    prisma.category.findMany({ where: { tenantId: session.user.tenantId }, orderBy: { name:"asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div className="md:ml-56 pb-20 md:pb-6 max-w-2xl">
      <div className="mb-4"><Link href="/dashboard/products" className="text-sm text-gray-500 flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4"/>Kembali ke Produk</Link><h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1></div>
      <ProductForm tenantId={session.user.tenantId} categories={categories} product={product}/>
    </div>
  );
}
