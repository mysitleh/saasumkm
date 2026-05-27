import UMonogram from "./UMonogram";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** "ink" (default, on light canvas) or "on-primary" (on cinematic black). */
  variant?: "ink" | "on-primary";
}

const sizes = {
  sm: { icon: 18, text: "text-[15px]" },
  md: { icon: 22, text: "text-[18px]" },
  lg: { icon: 28, text: "text-[22px]" },
};

/**
 * UMKMStore wordmark.
 * Renders the monogram + thin display-weight wordmark per design.md.
 */
export default function UStoreMark({ className, size = "md", variant = "ink" }: Props) {
  const s = sizes[size];
  const color = variant === "on-primary" ? "var(--on-primary)" : "var(--ink)";
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} style={{ color }}>
      <UMonogram size={s.icon} />
      <span
        className={s.text}
        style={{
          fontFamily: "var(--font-display), Inter, system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          fontFeatureSettings: '"ss03" on',
        }}
      >
        UMKMStore
      </span>
    </span>
  );
}
