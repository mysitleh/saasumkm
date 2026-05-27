"use client";

import { formatRupiah } from "@/lib/utils";

interface DailyPoint {
  day: string;
  total: number;
  count: number;
}

/**
 * Daily revenue bar chart — pure SVG, no dependency.
 * Aspect-respecting layout (wide internal viewBox + aspect-ratio CSS)
 * so bars stay proportional at any container width. Newest day uses
 * the aloe accent.
 */
export default function RevenueChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) {
    return <p className="caption" style={{ color: "var(--shade-50)" }}>Belum ada data omzet.</p>;
  }
  const VB_W = 800;
  const VB_H = 200;
  const PAD_X = 8;
  const PAD_Y = 12;
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  const max = Math.max(1, ...data.map((d) => d.total));
  const barSlot = innerW / data.length;
  const barW = Math.max(3, barSlot - 6);
  const lastIdx = data.length - 1;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "auto", aspectRatio: `${VB_W} / ${VB_H}`, display: "block" }}
        role="img"
        aria-label="Grafik omzet harian"
      >
        {data.map((d, i) => {
          const h = (d.total / max) * innerH;
          const x = PAD_X + i * barSlot + (barSlot - barW) / 2;
          const y = PAD_Y + (innerH - h);
          const isLast = i === lastIdx;
          return (
            <g key={d.day}>
              <title>
                {d.day} — {formatRupiah(d.total)} ({d.count} order)
              </title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, h)}
                fill={isLast ? "var(--aloe-10)" : "var(--ink)"}
                opacity={d.total > 0 ? 1 : 0.1}
                rx={2}
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between micro tabular mt-2" style={{ color: "var(--shade-50)" }}>
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}
