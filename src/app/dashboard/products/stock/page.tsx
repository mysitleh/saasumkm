import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import BulkStockForm from "./BulkStockForm";

export const dynamic = "force-dynamic";

export default async function BulkStockPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");

  const products = await prisma.product.findMany({
    where: { tenantId: session.user.tenantId, isActive: true },
    select: { id: true, name: true, stock: true, price: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page-shell reading-col">
      <div className="page-header">
        <Link href="/dashboard/products" className="caption inline-flex items-center gap-1 mb-4 hover:underline" style={{ color: "var(--shade-50)" }}>
          <ArrowLeft size={14} /> Kembali ke Produk
        </Link>
        <h1 className="display-md">Update stok.</h1>
        <p className="body-md mt-2" style={{ color: "var(--shade-50)" }}>Update stok banyak produk sekaligus.</p>
      </div>
      <BulkStockForm products={products} />
    </div>
  );
}
