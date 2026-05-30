import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Phone, ShoppingBag } from "@phosphor-icons/react/dist/ssr";
import StorefrontClient from "./StorefrontClient";
import { hasFeature } from "@/lib/features";
import { getBaseUrl } from "@/lib/utils";
import StoreJsonLd from "@/components/StoreJsonLd";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";
import { resolveTenantTheme, themeToCssVars } from "@/lib/theme-runtime";
import LogoMark from "@/components/icons/LogoMark";
import { parseLogoConfig } from "@/lib/logo";

interface Props { params: Promise<{ slug: string }> }

export const revalidate = 30;

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { name: "asc" } },
      products: {
        where: { isActive: true, stock: { gt: 0 } },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!tenant || !tenant.isActive) notFound();

  const qrisDynamicEnabled = await hasFeature(tenant.id, "qrisDynamic");
  const theme = resolveTenantTheme(tenant);
  const themeVars = themeToCssVars(theme);
  const isDark = theme.mode === "dark";
  const logoCfg = parseLogoConfig(tenant.logoConfig);

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeVars,
        background: isDark ? "#0a0a0a" : theme.surface,
        color: isDark ? "#ffffff" : theme.ink,
        fontFamily: `"${theme.font}", "Inter", system-ui, sans-serif`,
      }}
    >
      {/* Storefront header — canvas-cream, no gradient */}
      <header style={{ borderBottom: "1px solid var(--hairline-light)", background: "var(--canvas-light)" }}>
        <div className="max-w-2xl mx-auto px-5 py-6 flex items-center gap-4">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid var(--hairline-light)" }}
            />
          ) : logoCfg ? (
            <LogoMark config={logoCfg} size={56} idSeed="storehead" />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--canvas-cream)", display: "grid", placeItems: "center", border: "1px solid var(--hairline-light)" }}>
              <ShoppingBag size={26} style={{ color: "var(--shade-50)" }} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.hex}</span> Storefront</p>
            <h1 className="heading-xl truncate">{tenant.name}</h1>
            {tenant.description && (
              <p className="caption mt-1 line-clamp-2" style={{ color: "var(--shade-50)" }}>{tenant.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 micro tabular flex-wrap" style={{ color: "var(--shade-50)" }}>
              {tenant.address && (
                <span className="flex items-center gap-1"><MapPin size={11} />{tenant.address}</span>
              )}
              {tenant.phone && (
                <span className="flex items-center gap-1"><Phone size={11} />{tenant.phone}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <StorefrontClient
          tenant={{
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            qrisImageUrl: tenant.qrisImageUrl,
            qrisDynamicEnabled,
            themeColor: tenant.themeColor ?? "green",
          }}
          products={tenant.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl,
            category: p.category ? { name: p.category.name } : null,
          }))}
          categories={tenant.categories.map((c) => ({ id: c.id, name: c.name }))}
        />
        <div className="mt-10 text-center">
          <Link
            href={`/store/${tenant.slug}/track`}
            className="caption hover:underline"
            style={{ color: "var(--shade-60)" }}
          >
            <span className="glyph">{GLYPH.hexFilled}</span> Lacak pesanan Anda
          </Link>
        </div>
      </div>

      <StoreJsonLd
        storeName={tenant.name}
        storeDescription={tenant.description}
        storeUrl={`${getBaseUrl()}/store/${tenant.slug}`}
        products={tenant.products.map((p) => ({
          name: p.name,
          price: p.price,
          description: p.description,
          imageUrl: p.imageUrl,
        }))}
      />
    </div>
  );
}
