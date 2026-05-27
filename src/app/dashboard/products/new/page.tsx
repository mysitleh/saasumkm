import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProductForm from "../ProductForm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const categories = await prisma.category.findMany({ where: { tenantId: session.user.tenantId }, orderBy: { name:"asc" } });
  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <Link href="/dashboard/products" className="caption inline-flex items-center gap-1 mb-4 hover:underline" style={{ color: "var(--shade-50)" }}>
          <ArrowLeft size={14} /> Kembali ke Produk
        </Link>
        <h1 className="display-md">Tambah produk.</h1>
      </div>
      <ProductForm categories={categories}/>
    </div>
  );
}
