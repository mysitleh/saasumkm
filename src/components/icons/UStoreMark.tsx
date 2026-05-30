import UMonogram from "./UMonogram";
import type { LogoConfig } from "@/lib/logo";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** "ink" (default, on light canvas) or "on-primary" (on cinematic black). */
  variant?: "ink" | "on-primary";
  /** Hide the wordmark, show only the monogram. */
  markOnly?: boolean;
  /** Optional custom logo config (tenant brand). Overrides variant tone. */
  config?: Partial<LogoConfig>;
  /** Override the wordmark text (tenant store name). */
  wordmark?: string;
}

const sizes = {
  sm: { icon: 22, text: 16, gap: 8 },
  md: { icon: 28, text: 19, gap: 9 },
  lg: { icon: 34, text: 23, gap: 11 },
};

/**
 * UMKMStore wordmark — monogram + thin display-weight wordmark.
 * On dark canvas the monogram flips to an on-primary tone so it stays legible.
 * Accepts an optional `config` to render a tenant's fully custom logo.
 */
export default function UStoreMark({ className, size = "md", variant = "ink", markOnly = false, config, wordmark }: Props) {
  const s = sizes[size];
  const color = variant === "on-primary" ? "var(--on-primary)" : "var(--ink)";
  const markTone = variant === "on-primary" ? "on-primary" : "brand";

  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      style={{ color, gap: s.gap }}
    >
      <UMonogram size={s.icon} tone={markTone} config={config} />
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
          {wordmark ? (
            wordmark
          ) : (
            <>UMKM<span style={{ fontWeight: 380, opacity: 0.7 }}>Store</span></>
          )}
        </span>
      )}
    </span>
  );
}
