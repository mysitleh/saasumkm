"use client";

import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { formatRupiah } from "@/lib/utils";
import { GLYPH } from "@/lib/glyphs";

export interface KpiItem {
  glyph: string;
  label: string;
  /** Numeric value for the count-up animation. */
  value: number;
  /** "rupiah" formats with currency; "plain" uses thousands separator. */
  format: "rupiah" | "plain";
  sub: string;
  delta?: number | null;
  accent?: "ink";
}

const TINTS = ["tint-lavender", "tint-peach", "tint-sky", "tint-mint"];

/**
 * Animated KPI strip — counts up on mount, shows day-over-day delta.
 * Client component so the numbers animate; data comes pre-computed
 * from the server page. Cards use rotating isometricon pastel tints.
 */
export default function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-grid mb-7">
      {items.map((k, i) => (
        <div key={k.label} className={`card-tint ${TINTS[i % TINTS.length]}`} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="flex items-center justify-between">
            <span className="icon-chip" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 17 }}>
              <span className="glyph">{k.glyph}</span>
            </span>
            {k.delta !== undefined && k.delta !== null && (
              <span
                className="micro tabular"
                style={{
                  color: k.delta >= 0 ? "var(--iso-violet-deep)" : "var(--shade-50)",
                  background: "var(--canvas-light)",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontWeight: 600,
                }}
              >
                {k.delta >= 0 ? GLYPH.up : GLYPH.down} {Math.abs(k.delta)}%
              </span>
            )}
          </div>
          <p className="kpi-eyebrow" style={{ color: "var(--shade-60)" }}>{k.label}</p>
          <p className="kpi-value">
            <AnimatedNumber
              value={k.value}
              format={k.format === "rupiah" ? (n) => formatRupiah(n) : undefined}
            />
          </p>
          <p className="kpi-sub" style={{ color: "var(--shade-60)" }}>{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
