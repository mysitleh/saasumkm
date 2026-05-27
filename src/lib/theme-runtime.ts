/**
 * Theme runtime — builds the per-tenant CSS variable bundle for storefronts.
 *
 * Tenants override 6 brand parameters via the GUI Theme Builder:
 *   - mode (light | dark | auto)
 *   - primary (CTA color)
 *   - accent (secondary)
 *   - surface (page background)
 *   - ink (text)
 *   - radius (card corner)
 *   - font (Google Font family)
 *
 * If a value isn't set, we fall back to the legacy 6-color preset
 * (`themeColor: "green" | "blue" | …`) so old tenants keep their look.
 */

import { type ThemeColor } from "@/lib/theme";

// Legacy preset → hex mapping (matches Tailwind defaults used by old themes)
const PRESET_HEX: Record<ThemeColor, { primary: string; accent: string; surface: string }> = {
  green:  { primary: "#10b981", accent: "#34d399", surface: "#fbfbf5" },
  blue:   { primary: "#2563eb", accent: "#3b82f6", surface: "#fbfbf5" },
  purple: { primary: "#7c3aed", accent: "#a78bfa", surface: "#fbfbf5" },
  orange: { primary: "#f97316", accent: "#fb923c", surface: "#fbfbf5" },
  rose:   { primary: "#e11d48", accent: "#f43f5e", surface: "#fbfbf5" },
  slate:  { primary: "#334155", accent: "#475569", surface: "#fbfbf5" },
};

export type ThemeMode = "light" | "dark" | "auto";

export interface TenantTheme {
  mode: ThemeMode;
  primary: string;
  accent: string;
  surface: string;
  ink: string;
  radius: number;
  font: string;
}

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter — clean & modern" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans — friendly Indonesian" },
  { value: "Manrope", label: "Manrope — geometric" },
  { value: "Poppins", label: "Poppins — rounded" },
  { value: "DM Sans", label: "DM Sans — editorial" },
];

const DEFAULT: TenantTheme = {
  mode: "light",
  primary: "#10b981",
  accent: "#34d399",
  surface: "#fbfbf5",
  ink: "#0a0a0a",
  radius: 12,
  font: "Inter",
};

interface RawTenantThemeFields {
  themeMode?: string | null;
  themePrimary?: string | null;
  themeAccent?: string | null;
  themeSurface?: string | null;
  themeInk?: string | null;
  themeRadius?: number | null;
  themeFont?: string | null;
  themeColor?: string | null; // legacy preset
}

/** Resolve a tenant's effective theme by merging custom fields with the legacy preset. */
export function resolveTenantTheme(t: RawTenantThemeFields): TenantTheme {
  const presetKey = (t.themeColor ?? "green") as ThemeColor;
  const preset = PRESET_HEX[presetKey] ?? PRESET_HEX.green;
  return {
    mode: (t.themeMode as ThemeMode) ?? DEFAULT.mode,
    primary: t.themePrimary ?? preset.primary,
    accent: t.themeAccent ?? preset.accent,
    surface: t.themeSurface ?? preset.surface,
    ink: t.themeInk ?? DEFAULT.ink,
    radius: t.themeRadius ?? DEFAULT.radius,
    font: t.themeFont ?? DEFAULT.font,
  };
}

/** Compute readable on-primary color (white if primary dark, ink if primary light). */
export function contrastOnColor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance per WCAG.
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#0a0a0a" : "#ffffff";
}

/** Render the theme as CSS custom properties for inline injection. */
export function themeToCssVars(theme: TenantTheme): React.CSSProperties {
  return {
    ["--tenant-primary" as string]: theme.primary,
    ["--tenant-on-primary" as string]: contrastOnColor(theme.primary),
    ["--tenant-accent" as string]: theme.accent,
    ["--tenant-surface" as string]: theme.surface,
    ["--tenant-ink" as string]: theme.ink,
    ["--tenant-radius" as string]: `${theme.radius}px`,
    ["--tenant-font" as string]: `"${theme.font}", "Inter", system-ui, sans-serif`,
  };
}

export const RADIUS_PRESETS = [
  { value: 0, label: "Square" },
  { value: 6, label: "Subtle" },
  { value: 12, label: "Default" },
  { value: 20, label: "Friendly" },
  { value: 28, label: "Pillowy" },
];

export const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHex(s: string): boolean {
  return HEX_RE.test(s);
}
