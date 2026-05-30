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

/**
 * Animated KPI strip — counts up on mount, shows day-over-day delta.
 * Client component so the numbers animate; data comes pre-computed
 * from the server page.
 */
export default function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-grid mb-7">
      {items.map((k) => (
        <div key={k.label} className={k.accent === "ink" ? "kpi-card kpi-card-ink ums-hover-lift" : "kpi-card ums-hover-lift"}>
          <p className="kpi-eyebrow">
            <span className="glyph">{k.glyph}</span> {k.label}
          </p>
          <p className="kpi-value">
            <AnimatedNumber
              value={k.value}
              format={k.format === "rupiah" ? (n) => formatRupiah(n) : undefined}
            />
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="kpi-sub">{k.sub}</p>
            {k.delta !== undefined && k.delta !== null && (
              <span
                className="micro tabular"
                style={{
                  color: k.delta >= 0 ? (k.accent === "ink" ? "var(--aloe-10)" : "var(--ink)") : "var(--shade-50)",
                }}
              >
                {k.delta >= 0 ? GLYPH.up : GLYPH.down} {Math.abs(k.delta)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
