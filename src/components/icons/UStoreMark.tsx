import UMonogram from "./UMonogram";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** "ink" (default, on light canvas) or "on-primary" (on cinematic black). */
  variant?: "ink" | "on-primary";
  /** Hide the wordmark, show only the monogram. */
  markOnly?: boolean;
}

const sizes = {
  sm: { icon: 22, text: 16, gap: 8 },
  md: { icon: 28, text: 19, gap: 9 },
  lg: { icon: 34, text: 23, gap: 11 },
};

/**
 * UMKMStore wordmark — monogram + thin display-weight wordmark.
 * On dark canvas the monogram flips to an on-primary tone so it stays legible.
 */
export default function UStoreMark({ className, size = "md", variant = "ink", markOnly = false }: Props) {
  const s = sizes[size];
  const color = variant === "on-primary" ? "var(--on-primary)" : "var(--ink)";
  const markTone = variant === "on-primary" ? "on-primary" : "brand";

  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      style={{ color, gap: s.gap }}
    >
      <UMonogram size={s.icon} tone={markTone} />
      {!markOnly && (
        <span
          style={{
            fontSize: s.text,
            fontFamily: "var(--font-display), Inter, system-ui, sans-serif",
            fontWeight: 560,
            letterSpacing: "-0.02em",
            fontFeatureSettings: '"ss03" on',
            lineHeight: 1,
          }}
        >
          UMKM<span style={{ fontWeight: 380, opacity: 0.7 }}>Store</span>
        </span>
      )}
    </span>
  );
}
