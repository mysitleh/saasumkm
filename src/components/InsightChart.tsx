"use client";

import { formatRupiah } from "@/lib/utils";

interface ForecastPoint { day: string; total: number; predicted: boolean }

/**
 * Sales-with-forecast chart — pure SVG, no dependency.
 * Solid bars = actual revenue (ink); dashed bars = Holt forecast (aloe).
 */
export default function InsightChart({ data, height = 180 }: { data: ForecastPoint[]; height?: number }) {
  if (data.length === 0) {
    return <p className="caption" style={{ color: "var(--shade-50)" }}>Belum ada data penjualan.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.total));
  const barW = 100 / data.length;
  const splitIdx = data.findIndex((d) => d.predicted);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }} role="img" aria-label="Grafik penjualan & forecast">
        {data.map((d, i) => {
          const h = (d.total / max) * (height - 24);
          const x = i * barW;
          const y = height - h - 4;
          const isPred = d.predicted;
          return (
            <g key={d.day}>
              <title>
                {d.day} — {formatRupiah(d.total)}{isPred ? " (forecast)" : ""}
              </title>
              <rect
                x={x + 0.4}
                y={y}
                width={Math.max(0, barW - 0.8)}
                height={Math.max(0, h)}
                fill={isPred ? "var(--aloe-10)" : "var(--ink)"}
                opacity={d.total > 0 ? 1 : 0.12}
                rx={0.6}
              />
            </g>
          );
        })}
        {splitIdx > 0 && (
          <line
            x1={splitIdx * barW}
            x2={splitIdx * barW}
            y1={4}
            y2={height - 4}
            stroke="var(--hairline-light)"
            strokeDasharray="1.5 1.5"
            strokeWidth={0.4}
          />
        )}
      </svg>
      <div className="flex justify-between micro tabular mt-2" style={{ color: "var(--shade-50)" }}>
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)} <span className="glyph">✦</span></span>
      </div>
    </div>
  );
}
