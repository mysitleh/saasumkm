import { GLYPH } from "@/lib/glyphs";

/**
 * StatTile — isometricon-style pastel KPI tile.
 *
 * A rounded, soft-shadow card with a rotating pastel tint and an
 * icon-chip holding a brand glyph. Used across dashboard pages
 * (analytics, loyalty, insights) for a consistent, colorful look.
 */
const TINTS = ["tint-lavender", "tint-peach", "tint-sky", "tint-mint", "tint-lemon", "tint-rose"] as const;

export interface StatTileProps {
  glyph: string;
  label: string;
  value: string;
  caption?: string;
  /** Index drives the rotating pastel tint. */
  index?: number;
  /** Force a specific tint instead of the rotation. */
  tint?: (typeof TINTS)[number];
  /** Optional delta percentage (renders an up/down chip). */
  delta?: number | null;
}

export default function StatTile({ glyph, label, value, caption, index = 0, tint, delta }: StatTileProps) {
  const tone = tint ?? TINTS[index % TINTS.length];
  return (
    <div className={`card-tint ${tone}`} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="flex items-center justify-between">
        <span className="icon-chip" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 17 }}>
          <span className="glyph">{glyph}</span>
        </span>
        {delta !== undefined && delta !== null && (
          <span
            className="micro tabular"
            style={{
              color: delta >= 0 ? "var(--iso-violet-deep)" : "var(--shade-50)",
              background: "var(--canvas-light)",
              padding: "2px 8px",
              borderRadius: 9999,
              fontWeight: 600,
            }}
          >
            {delta >= 0 ? GLYPH.up : GLYPH.down} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="kpi-eyebrow" style={{ color: "var(--shade-60)" }}>{label}</p>
      <p className="kpi-value" title={value}>{value}</p>
      {caption && <p className="kpi-sub" style={{ color: "var(--shade-60)" }}>{caption}</p>}
    </div>
  );
}
