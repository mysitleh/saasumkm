import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Plus, Pencil } from "@phosphor-icons/react/dist/ssr";
import { GLYPH } from "@/lib/glyphs";
import ProductToggle from "./ProductToggle";
import ProductDelete from "./ProductDelete";
import ImportProducts from "./ImportProducts";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");
  const products = await prisma.product.findMany({
    where: { tenantId: session.user.tenantId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell">
      <div className="page-header flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.hex}</span> Catalog</p>
          <h1 className="display-md">Produk.</h1>
          <p className="body-md mt-2 tabular" style={{ color: "var(--shade-50)" }}>{products.length} produk</p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/products/stock" className="pill pill-outline-light pill-sm">
            Update stok
          </Link>
          <ImportProducts />
          <Link href="/dashboard/products/new" className="pill pill-primary pill-sm">
            <Plus size={14} weight="bold" /> Tambah
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <span className="empty-state-glyph glyph">{GLYPH.hex}</span>
          <p className="body-md mb-5" style={{ color: "var(--shade-50)" }}>Belum ada produk.</p>
          <Link href="/dashboard/products/new" className="pill pill-primary inline-flex">
            <Plus size={14} weight="bold" /> Tambah produk pertama
          </Link>
        </div>
      ) : (
        <section className="list-card">
          <ul>
            {products.map((product) => (
              <li key={product.id} className="list-row">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: 8, background: "var(--canvas-cream)",
                      display: "grid", placeItems: "center", flexShrink: 0,
                    }}
                  >
                    <Package size={20} style={{ color: "var(--shade-40)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="body-md truncate" style={{ color: product.isActive ? "var(--ink)" : "var(--shade-40)" }}>
                    {product.name}
                  </p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>
                    {product.category?.name && <span style={{ marginRight: 8 }}>{product.category.name}</span>}
                    Stok: {product.stock}
                  </p>
                  <p className="caption tabular" style={{ color: "var(--ink)" }}>{formatRupiah(product.price)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ProductToggle productId={product.id} isActive={product.isActive} />
                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="pill pill-ghost pill-sm"
                    style={{ padding: 8, minHeight: 36, borderRadius: 9999 }}
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <ProductDelete productId={product.id} productName={product.name} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
