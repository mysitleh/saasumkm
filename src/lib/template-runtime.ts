/**
 * Storefront Template Builder runtime helpers.
 *
 * Tenants pick:
 *   - layoutTemplate (overall arrangement)
 *   - buttonStyle (CTA shape)
 *   - iconStyle (Phosphor weight)
 *   - categoryStyle (filter UX)
 *   - hero (toggle + image + copy)
 *   - carousel (toggle + curated product IDs)
 */

export type LayoutTemplate = "classic" | "magazine" | "minimal" | "showcase";
export type ButtonStyle = "pill" | "rounded" | "square" | "ghost";
export type IconStyle = "regular" | "fill" | "duotone" | "thin" | "bold";
export type CategoryStyle = "chips" | "grid" | "tabs" | "sidebar";

export interface TemplateConfig {
  layoutTemplate: LayoutTemplate;
  buttonStyle: ButtonStyle;
  iconStyle: IconStyle;
  categoryStyle: CategoryStyle;
  heroEnabled: boolean;
  heroImageUrl: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroCtaLabel: string | null;
  carouselEnabled: boolean;
  carouselProductIds: string[];
}

export const DEFAULT_TEMPLATE: TemplateConfig = {
  layoutTemplate: "classic",
  buttonStyle: "pill",
  iconStyle: "regular",
  categoryStyle: "chips",
  heroEnabled: true,
  heroImageUrl: null,
  heroHeadline: null,
  heroSubheadline: null,
  heroCtaLabel: "Belanja Sekarang",
  carouselEnabled: false,
  carouselProductIds: [],
};

interface RawTemplateFields {
  layoutTemplate?: string | null;
  buttonStyle?: string | null;
  iconStyle?: string | null;
  categoryStyle?: string | null;
  heroEnabled?: boolean | null;
  heroImageUrl?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  heroCtaLabel?: string | null;
  carouselEnabled?: boolean | null;
  carouselProductIds?: string | null;
}

export function resolveTemplate(t: RawTemplateFields): TemplateConfig {
  let ids: string[] = [];
  if (t.carouselProductIds) {
    try {
      const parsed = JSON.parse(t.carouselProductIds);
      if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === "string");
    } catch { /* ignore */ }
  }
  return {
    layoutTemplate: (t.layoutTemplate as LayoutTemplate) ?? DEFAULT_TEMPLATE.layoutTemplate,
    buttonStyle: (t.buttonStyle as ButtonStyle) ?? DEFAULT_TEMPLATE.buttonStyle,
    iconStyle: (t.iconStyle as IconStyle) ?? DEFAULT_TEMPLATE.iconStyle,
    categoryStyle: (t.categoryStyle as CategoryStyle) ?? DEFAULT_TEMPLATE.categoryStyle,
    heroEnabled: t.heroEnabled ?? DEFAULT_TEMPLATE.heroEnabled,
    heroImageUrl: t.heroImageUrl ?? null,
    heroHeadline: t.heroHeadline ?? null,
    heroSubheadline: t.heroSubheadline ?? null,
    heroCtaLabel: t.heroCtaLabel ?? DEFAULT_TEMPLATE.heroCtaLabel,
    carouselEnabled: t.carouselEnabled ?? DEFAULT_TEMPLATE.carouselEnabled,
    carouselProductIds: ids,
  };
}


/* ============================================================
   STATIC METADATA — used by the Template Builder GUI to render
   option lists. Keeping them here means there's a single source
   of truth for both the picker and the validators.
   ============================================================ */

export const LAYOUT_TEMPLATES = [
  {
    value: "classic" as const,
    label: "Classic",
    description: "Hero gambar + grid produk 2-up. Universal, ramah pelanggan.",
  },
  {
    value: "magazine" as const,
    label: "Magazine",
    description: "Hero editorial + carousel pilihan + kategori grid besar.",
  },
  {
    value: "minimal" as const,
    label: "Minimal",
    description: "Tanpa hero, langsung katalog. Fast loading, fokus produk.",
  },
  {
    value: "showcase" as const,
    label: "Showcase",
    description: "Hero full-bleed cinematic + grid produk 1-up besar.",
  },
];

export const BUTTON_STYLES = [
  { value: "pill" as const, label: "Pill", radius: 9999, sample: "Tambah ke Keranjang" },
  { value: "rounded" as const, label: "Rounded", radius: 12, sample: "Tambah ke Keranjang" },
  { value: "square" as const, label: "Square", radius: 4, sample: "Tambah ke Keranjang" },
  { value: "ghost" as const, label: "Ghost", radius: 9999, sample: "Tambah ke Keranjang" },
];

export const ICON_STYLES = [
  { value: "regular" as const, label: "Regular", weight: "regular" as const },
  { value: "fill" as const, label: "Fill", weight: "fill" as const },
  { value: "duotone" as const, label: "Duotone", weight: "duotone" as const },
  { value: "thin" as const, label: "Thin", weight: "thin" as const },
  { value: "bold" as const, label: "Bold", weight: "bold" as const },
];

export const CATEGORY_STYLES = [
  { value: "chips" as const, label: "Chips", description: "Horizontal pill scrollbar — compact, mobile-first." },
  { value: "grid" as const, label: "Grid", description: "Card grid 2-3 kolom dengan icon kategori." },
  { value: "tabs" as const, label: "Tabs", description: "Tab bar dengan underline aktif, klasik." },
  { value: "sidebar" as const, label: "Sidebar", description: "Vertikal di kiri (desktop only)." },
];

/** Compute final border-radius for a button given its style + tenant-radius preference. */
export function buttonRadius(style: ButtonStyle, tenantRadius: number): number {
  switch (style) {
    case "pill": return 9999;
    case "rounded": return Math.max(8, tenantRadius);
    case "square": return Math.min(4, tenantRadius);
    case "ghost": return 9999;
    default: return 9999;
  }
}
