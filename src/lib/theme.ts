/**
 * Theme color mapping untuk storefront.
 * Tenant bisa pilih warna tema toko mereka.
 *
 * Default "green" memetakan ke brand emerald (#10B981) — sesuai design.md.
 */
export const THEME_COLORS = {
  green: {
    gradient: "from-emerald-600 to-emerald-700",
    primary: "bg-emerald-600",
    primaryHover: "hover:bg-emerald-700",
    primaryText: "text-emerald-600",
    light: "bg-emerald-50",
    lightText: "text-emerald-100",
    badge: "bg-emerald-600 text-white",
    ring: "focus:ring-emerald-500",
    border: "border-emerald-500",
  },
  blue: {
    gradient: "from-blue-600 to-indigo-700",
    primary: "bg-blue-600",
    primaryHover: "hover:bg-blue-700",
    primaryText: "text-blue-600",
    light: "bg-blue-50",
    lightText: "text-blue-100",
    badge: "bg-blue-600 text-white",
    ring: "focus:ring-blue-500",
    border: "border-blue-500",
  },
  purple: {
    gradient: "from-purple-600 to-violet-700",
    primary: "bg-purple-600",
    primaryHover: "hover:bg-purple-700",
    primaryText: "text-purple-600",
    light: "bg-purple-50",
    lightText: "text-purple-100",
    badge: "bg-purple-600 text-white",
    ring: "focus:ring-purple-500",
    border: "border-purple-500",
  },
  orange: {
    gradient: "from-orange-500 to-red-600",
    primary: "bg-orange-500",
    primaryHover: "hover:bg-orange-600",
    primaryText: "text-orange-600",
    light: "bg-orange-50",
    lightText: "text-orange-100",
    badge: "bg-orange-500 text-white",
    ring: "focus:ring-orange-500",
    border: "border-orange-500",
  },
  rose: {
    gradient: "from-rose-500 to-pink-600",
    primary: "bg-rose-500",
    primaryHover: "hover:bg-rose-600",
    primaryText: "text-rose-600",
    light: "bg-rose-50",
    lightText: "text-rose-100",
    badge: "bg-rose-500 text-white",
    ring: "focus:ring-rose-500",
    border: "border-rose-500",
  },
  slate: {
    gradient: "from-slate-700 to-stone-900",
    primary: "bg-slate-700",
    primaryHover: "hover:bg-slate-800",
    primaryText: "text-slate-700",
    light: "bg-slate-50",
    lightText: "text-slate-300",
    badge: "bg-slate-700 text-white",
    ring: "focus:ring-slate-500",
    border: "border-slate-500",
  },
} as const;

export type ThemeColor = keyof typeof THEME_COLORS;

export function getTheme(color: string | null | undefined) {
  const key = (color ?? "green") as ThemeColor;
  return THEME_COLORS[key] ?? THEME_COLORS.green;
}

export const THEME_OPTIONS: { value: ThemeColor; label: string; swatch: string }[] = [
  { value: "green", label: "Hijau", swatch: "bg-emerald-600" },
  { value: "blue", label: "Biru", swatch: "bg-blue-600" },
  { value: "purple", label: "Ungu", swatch: "bg-purple-600" },
  { value: "orange", label: "Oranye", swatch: "bg-orange-500" },
  { value: "rose", label: "Pink", swatch: "bg-rose-500" },
  { value: "slate", label: "Gelap", swatch: "bg-slate-700" },
];
