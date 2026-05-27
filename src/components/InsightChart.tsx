"use client";

import { formatRupiah } from "@/lib/utils";

interface ForecastPoint { day: string; total: number; predicted: boolean }

/**
 * Sales-with-forecast chart — pure SVG with aspect-respecting layout.
 * Solid bars = actual revenue (ink); aloe bars = Holt forecast.
 * Aspect ratio is preserved (preserveAspectRatio="xMidYMid meet") and
 * the SVG width adapts to its container. Bars are sized by the count
 * so they stay visually proportional at any width.
 */
export default function InsightChart({ data }: { data: ForecastPoint[] }) {
  if (data.length === 0) {
    return <p className="caption" style={{ color: "var(--shade-50)" }}>Belum ada data penjualan.</p>;
  }

  // Use a wide internal viewBox so each bar is a meaningful px count.
  // The element is rendered responsively via width:100% + intrinsic
  // aspect-ratio; preserving aspect prevents stretched/squashed bars.
  const VB_W = 800;
  const VB_H = 220;
  const PAD_X = 8;
  const PAD_Y = 12;
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  const max = Math.max(1, ...data.map((d) => d.total));
  const barSlot = innerW / data.length;
  const barW = Math.max(2, barSlot - 4);
  const splitIdx = data.findIndex((d) => d.predicted);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "auto", aspectRatio: `${VB_W} / ${VB_H}`, display: "block" }}
        role="img"
        aria-label="Grafik penjualan harian dengan forecast Holt"
      >
        {data.map((d, i) => {
          const h = (d.total / max) * innerH;
          const x = PAD_X + i * barSlot + (barSlot - barW) / 2;
          const y = PAD_Y + (innerH - h);
          const isPred = d.predicted;
          return (
            <g key={d.day}>
              <title>
                {d.day} — {formatRupiah(d.total)}{isPred ? " (forecast)" : ""}
              </title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, h)}
                fill={isPred ? "var(--aloe-10)" : "var(--ink)"}
                opacity={d.total > 0 ? 1 : 0.12}
                rx={2}
              />
            </g>
          );
        })}
        {splitIdx > 0 && (
          <line
            x1={PAD_X + splitIdx * barSlot}
            x2={PAD_X + splitIdx * barSlot}
            y1={PAD_Y}
            y2={VB_H - PAD_Y}
            stroke="var(--hairline-light)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
      </svg>
      <div className="flex justify-between micro tabular mt-2" style={{ color: "var(--shade-50)" }}>
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.day.slice(5)}</span>
        <span>
          {data[data.length - 1]?.day.slice(5)} <span className="glyph">✦</span>
        </span>
      </div>
    </div>
  );
}
