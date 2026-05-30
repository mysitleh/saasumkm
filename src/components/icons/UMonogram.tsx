interface Props {
  className?: string;
  size?: number;
  /** Override the mark fill. Defaults to brand ink so it adapts to canvas. */
  tone?: "brand" | "ink" | "on-primary";
}

/**
 * UMKMStore monogram — a "U" formed as an open storefront awning + counter.
 * Geometric, single-weight, scalable. Reads as both the letter U and a
 * shop silhouette. Uses currentColor-friendly fills so it adapts to the
 * surrounding canvas polarity.
 */
export default function UMonogram({ className, size = 28, tone = "brand" }: Props) {
  const id = "ums-grad";
  const markFill =
    tone === "ink" ? "var(--ink)" : tone === "on-primary" ? "var(--on-primary)" : `url(#${id})`;
  const glyphFill = tone === "brand" ? "#ffffff" : tone === "on-primary" ? "var(--ink)" : "var(--on-primary)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a0a0a" />
          <stop offset="1" stopColor="#1e2c31" />
        </linearGradient>
      </defs>

      {/* Rounded squircle base */}
      <rect width="32" height="32" rx="9" fill={markFill} />

      {/* Awning stripe across the top — storefront cue */}
      <path
        d="M7 11.5 L25 11.5 L25 9.2 C25 8.3 24.3 7.6 23.4 7.6 L8.6 7.6 C7.7 7.6 7 8.3 7 9.2 Z"
        fill={glyphFill}
        opacity="0.55"
      />

      {/* The U — open counter / cup silhouette */}
      <path
        d="M10.4 13.2 L10.4 18.2 C10.4 21.4 12.9 23.8 16 23.8 C19.1 23.8 21.6 21.4 21.6 18.2 L21.6 13.2"
        stroke={glyphFill}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Accent dot — the "growth" pip */}
      <circle cx="16" cy="13" r="1.5" fill={tone === "brand" ? "#c1fbd4" : glyphFill} />
    </svg>
  );
}
