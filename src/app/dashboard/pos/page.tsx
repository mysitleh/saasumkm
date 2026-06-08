import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PosClient from "./PosClient";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user.tenantId) redirect("/login");

  const [products, categories, tenant] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: session.user.tenantId, isActive: true, stock: { gt: 0 } },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, name: true, taxEnabled: true, taxRate: true, taxMode: true },
    }),
  ]);

  return (
    <PosClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category?.name ?? null,
        imageUrl: p.imageUrl,
      }))}
      categories={categories.map((c) => c.name)}
      tenantSlug={tenant?.slug ?? ""}
      tenantName={tenant?.name ?? ""}
      taxEnabled={tenant?.taxEnabled ?? false}
      taxRate={tenant?.taxRate ?? 0.11}
      taxMode={(tenant?.taxMode as "EXCLUSIVE" | "INCLUSIVE") ?? "EXCLUSIVE"}
    />
  );
}
