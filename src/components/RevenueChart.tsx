"use client";

import { formatRupiah } from "@/lib/utils";

interface DailyPoint {
  day: string;
  total: number;
  count: number;
}

/**
 * Daily revenue bar chart — pure SVG, no dependency.
 * design.md compliant: ink bars on light, aloe accent for the most recent day.
 */
export default function RevenueChart({ data, height = 160 }: { data: DailyPoint[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const barWidth = 100 / Math.max(1, data.length);
  const lastIdx = data.length - 1;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }} role="img" aria-label="Grafik omzet harian">
        {data.map((d, i) => {
          const h = (d.total / max) * (height - 24);
          const x = i * barWidth;
          const isLast = i === lastIdx;
          return (
            <g key={d.day}>
              <title>
                {d.day} — {formatRupiah(d.total)} ({d.count} order)
              </title>
              <rect
                x={x + 0.5}
                y={height - h - 4}
                width={Math.max(0, barWidth - 1)}
                height={Math.max(0, h)}
                fill={isLast ? "var(--aloe-10)" : "var(--ink)"}
                opacity={d.total > 0 ? 1 : 0.1}
                rx={0.6}
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between micro tabular mt-1" style={{ color: "var(--shade-50)" }}>
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}
