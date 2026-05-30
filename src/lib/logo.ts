/**
 * Flexible logo system — data-driven config so the platform brand AND each
 * tenant can build a modern mark from many shape/symbol/style options.
 *
 * A logo is fully described by a `LogoConfig` object. The `<LogoMark>`
 * component renders any config to crisp SVG. Configs serialize to JSON so
 * tenants can persist their custom logo.
 */

export type LogoShape =
  | "squircle"
  | "circle"
  | "rounded"
  | "hexagon"
  | "shield"
  | "blob"
  | "diamond"
  | "none";

export type LogoSymbol =
  | "awning"   // storefront awning + U counter (default UMKMStore mark)
  | "bag"      // shopping bag
  | "storefront"
  | "spark"    // 4-point sparkle
  | "bolt"     // lightning
  | "leaf"     // growth leaf
  | "cup"      // coffee/cup
  | "tag"      // price tag
  | "monogram"; // letter initial

export type LogoFill = "solid" | "gradient" | "soft" | "outline";

export interface LogoConfig {
  shape: LogoShape;
  symbol: LogoSymbol;
  fill: LogoFill;
  /** Base color (shape background / outline). */
  color: string;
  /** Secondary color for gradients + accent pip. */
  accent: string;
  /** Symbol color (defaults to white on solid shapes). */
  symbolColor?: string;
  /** Letter used when symbol = "monogram". */
  initial?: string;
  /** Show the small accent "growth" pip. */
  pip?: boolean;
}

export const DEFAULT_LOGO: LogoConfig = {
  shape: "squircle",
  symbol: "awning",
  fill: "gradient",
  color: "#6c4cf1",
  accent: "#c1fbd4",
  pip: true,
};

export const LOGO_SHAPES: { value: LogoShape; label: string }[] = [
  { value: "squircle", label: "Squircle" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "hexagon", label: "Hexagon" },
  { value: "shield", label: "Shield" },
  { value: "blob", label: "Blob" },
  { value: "diamond", label: "Diamond" },
  { value: "none", label: "No shape" },
];

export const LOGO_SYMBOLS: { value: LogoSymbol; label: string }[] = [
  { value: "awning", label: "Awning + U" },
  { value: "bag", label: "Shopping Bag" },
  { value: "storefront", label: "Storefront" },
  { value: "spark", label: "Sparkle" },
  { value: "bolt", label: "Bolt" },
  { value: "leaf", label: "Leaf" },
  { value: "cup", label: "Cup" },
  { value: "tag", label: "Tag" },
  { value: "monogram", label: "Initial" },
];

export const LOGO_FILLS: { value: LogoFill; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft tint" },
  { value: "outline", label: "Outline" },
];

/** Curated presets for one-tap modern looks. */
export const LOGO_PRESETS: { name: string; config: LogoConfig }[] = [
  { name: "Violet Store", config: { shape: "squircle", symbol: "awning", fill: "gradient", color: "#6c4cf1", accent: "#c1fbd4", pip: true } },
  { name: "Aloe Fresh", config: { shape: "circle", symbol: "leaf", fill: "soft", color: "#10b981", accent: "#34d399", pip: false } },
  { name: "Bold Hex", config: { shape: "hexagon", symbol: "bolt", fill: "solid", color: "#0a0a0a", accent: "#c1fbd4", pip: true } },
  { name: "Cafe Cup", config: { shape: "blob", symbol: "cup", fill: "gradient", color: "#b45309", accent: "#fcd34d", pip: false } },
  { name: "Shield Pro", config: { shape: "shield", symbol: "bag", fill: "gradient", color: "#2563eb", accent: "#93c5fd", pip: true } },
  { name: "Sunset Spark", config: { shape: "squircle", symbol: "spark", fill: "gradient", color: "#e11d48", accent: "#fb7185", pip: true } },
  { name: "Mono Diamond", config: { shape: "diamond", symbol: "monogram", fill: "outline", color: "#0a0a0a", accent: "#6c4cf1", initial: "U", pip: false } },
  { name: "Tag Rounded", config: { shape: "rounded", symbol: "tag", fill: "soft", color: "#7c3aed", accent: "#c4b5fd", pip: false } },
];

/** Safe-parse a serialized logo config (tenant DB field). */
export function parseLogoConfig(raw: string | null | undefined): LogoConfig | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.shape === "string" && typeof obj.symbol === "string") {
      return { ...DEFAULT_LOGO, ...obj };
    }
    return null;
  } catch {
    return null;
  }
}
