import { type LogoConfig, DEFAULT_LOGO } from "@/lib/logo";

/**
 * LogoMark — renders any LogoConfig to a crisp 32x32 viewBox SVG.
 * Shape (background) + symbol (foreground) + fill style are all parametric,
 * giving a flexible, modern, fully tenant-customizable brand mark.
 */
interface Props {
  config?: Partial<LogoConfig>;
  size?: number;
  className?: string;
  /** Unique id seed to avoid <defs> collisions when many marks render. */
  idSeed?: string;
}

export default function LogoMark({ config, size = 32, className, idSeed = "m" }: Props) {
  const c: LogoConfig = { ...DEFAULT_LOGO, ...config };
  const gid = `lg-${idSeed}`;
  const hasShape = c.shape !== "none";

  // Resolve shape background fill.
  const shapeFill =
    c.fill === "gradient" ? `url(#${gid})`
    : c.fill === "soft" ? hexWithAlpha(c.color, 0.16)
    : c.fill === "outline" ? "transparent"
    : c.color;

  // Symbol color: explicit > sensible default per fill.
  const symColor =
    c.symbolColor ??
    (c.fill === "soft" ? c.color : c.fill === "outline" ? c.color : "#ffffff");

  const stroke = c.fill === "outline" ? c.color : "none";

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor={c.color} />
          <stop offset="1" stopColor={mix(c.color, c.accent, 0.55)} />
        </linearGradient>
      </defs>

      {hasShape && <ShapePath shape={c.shape} fill={shapeFill} stroke={stroke} />}

      <g>
        <Symbol symbol={c.symbol} color={symColor} accent={c.accent} initial={c.initial} hasShape={hasShape} />
      </g>

      {c.pip && <circle cx="24" cy="8" r="3" fill={c.accent} stroke={hasShape ? shapeFillToStroke(c.fill) : "none"} strokeWidth="1.5" />}
    </svg>
  );
}

function shapeFillToStroke(fill: string): string {
  return fill === "outline" || fill === "soft" ? "transparent" : "#ffffff";
}

/* ---------- helpers: color math ---------- */
function clamp(n: number) { return Math.max(0, Math.min(255, Math.round(n))); }
function parseHex(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a: string, b: string, t: number): string {
  try {
    const [r1, g1, b1] = parseHex(a);
    const [r2, g2, b2] = parseHex(b);
    return `#${[clamp(r1 + (r2 - r1) * t), clamp(g1 + (g2 - g1) * t), clamp(b1 + (b2 - b1) * t)]
      .map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return a;
  }
}
function hexWithAlpha(hex: string, a: number): string {
  try {
    const [r, g, b] = parseHex(hex);
    return `rgba(${r},${g},${b},${a})`;
  } catch {
    return hex;
  }
}

/* ---------- shapes ---------- */
function ShapePath({ shape, fill, stroke }: { shape: string; fill: string; stroke: string }) {
  const sw = stroke !== "none" && stroke !== "transparent" ? 2 : 0;
  const common = { fill, stroke: sw ? stroke : "none", strokeWidth: sw };
  switch (shape) {
    case "circle":
      return <circle cx="16" cy="16" r="15" {...common} />;
    case "rounded":
      return <rect x="1" y="1" width="30" height="30" rx="6" {...common} />;
    case "hexagon":
      return <path d="M16 1 L28.1 8 L28.1 24 L16 31 L3.9 24 L3.9 8 Z" {...common} />;
    case "shield":
      return <path d="M16 1 L29 5.5 V16 C29 24 23 29.5 16 31.5 C9 29.5 3 24 3 16 V5.5 Z" {...common} />;
    case "blob":
      return <path d="M16 1.5 C24 1.5 30.5 6 30.5 15 C30.5 25 25 30.5 16 30.5 C8 30.5 1.5 24.5 1.5 16 C1.5 7 8.5 1.5 16 1.5 Z" {...common} />;
    case "diamond":
      return <path d="M16 1 L31 16 L16 31 L1 16 Z" {...common} />;
    case "squircle":
    default:
      return <rect width="32" height="32" rx="9" {...common} />;
  }
}

/* ---------- symbols ---------- */
function Symbol({ symbol, color, accent, initial, hasShape }: { symbol: string; color: string; accent: string; initial?: string; hasShape: boolean }) {
  const pip = hasShape ? accent : accent;
  switch (symbol) {
    case "bag":
      return (
        <>
          <path d="M10 12 H22 L21 24 C21 24.6 20.5 25 20 25 H12 C11.5 25 11 24.6 11 24 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M13 12 V10.5 C13 8.6 14.3 7.5 16 7.5 C17.7 7.5 19 8.6 19 10.5 V12" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "storefront":
      return (
        <>
          <path d="M7 13 L9 8 H23 L25 13" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M8.5 13 V24 H23.5 V13" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M13 24 V18 H19 V24" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
        </>
      );
    case "spark":
      return <path d="M16 6 C16.8 12 17.5 13.2 26 16 C17.5 18.8 16.8 20 16 26 C15.2 20 14.5 18.8 6 16 C14.5 13.2 15.2 12 16 6 Z" fill={color} />;
    case "bolt":
      return <path d="M17.5 6 L9 18 H15 L14 26 L23 13 H16.5 Z" fill={color} strokeLinejoin="round" />;
    case "leaf":
      return (
        <>
          <path d="M23 8 C23 18 17 24 9 24 C9 14 15 8 23 8 Z" fill={color} />
          <path d="M11 22 C14 18 18 13 22 9" stroke={accent} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      );
    case "cup":
      return (
        <>
          <path d="M9 11 H21 V18 C21 21.3 18.3 24 15 24 C11.7 24 9 21.3 9 18 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M21 13 H23.5 C24.9 13 26 14.1 26 15.5 C26 16.9 24.9 18 23.5 18 H21" fill="none" stroke={color} strokeWidth="2.2" />
        </>
      );
    case "tag":
      return (
        <>
          <path d="M7 14.5 L14.5 7 H24 V16.5 L16.5 24 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="19.5" cy="11.5" r="1.8" fill={color} />
        </>
      );
    case "monogram":
      return (
        <text x="16" y="22" textAnchor="middle" fontFamily="var(--font-display), Inter, sans-serif" fontWeight="800" fontSize="17" fill={color}>
          {(initial || "U").slice(0, 1).toUpperCase()}
        </text>
      );
    case "awning":
    default:
      return (
        <>
          <path d="M8 13 L24 13 L24 10.5 C24 9.7 23.4 9 22.5 9 L9.5 9 C8.6 9 8 9.7 8 10.5 Z" fill={color} opacity="0.55" />
          <path d="M11 14.5 L11 18.5 C11 21.3 13.2 23.5 16 23.5 C18.8 23.5 21 21.3 21 18.5 L21 14.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="16" cy="14.2" r="1.4" fill={pip} />
        </>
      );
  }
}
