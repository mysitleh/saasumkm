"use client";

interface Cell { hour: number; weekday: number; orders: number; revenue: number }

const WD = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * 24×7 hour-by-weekday order density heatmap.
 * Cells use canvas-cream (empty) → pistachio → aloe → ink ramp depending
 * on intensity. Cells size proportionally with the available width via
 * a percentage-based grid so it works on phones (560px) and 1440px alike.
 */
export default function HeatmapGrid({ cells }: { cells: Cell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.orders));
  const grid: Cell[][] = Array.from({ length: 7 }, () => Array(24).fill(null));
  for (const c of cells) grid[c.weekday][c.hour] = c;

  return (
    <div className="w-full" style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(28px, auto) repeat(24, minmax(0, 1fr))",
          gap: 2,
          minWidth: 480,
        }}
        role="table"
        aria-label="Heatmap order per jam dan hari"
      >
        {/* Header row */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={`h-${h}`}
            className="micro tabular"
            style={{ color: "var(--shade-50)", textAlign: "center", fontSize: 10, lineHeight: 1.2 }}
          >
            {h % 3 === 0 ? h : ""}
          </div>
        ))}

        {/* Body rows */}
        {grid.map((row, w) => (
          <div key={`r-${w}`} style={{ display: "contents" }}>
            <div
              className="micro tabular"
              style={{ color: "var(--shade-50)", display: "flex", alignItems: "center", paddingRight: 8 }}
            >
              {WD[w]}
            </div>
            {row.map((c, h) => {
              const v = c?.orders ?? 0;
              const intensity = v / max;
              let bg = "var(--canvas-cream)";
              if (intensity > 0 && intensity <= 0.25) bg = "var(--pistachio-10)";
              else if (intensity > 0.25 && intensity <= 0.6) bg = "var(--aloe-10)";
              else if (intensity > 0.6) bg = "var(--ink)";
              return (
                <div
                  key={`c-${w}-${h}`}
                  title={`${WD[w]} ${h}:00 — ${v} order`}
                  style={{
                    aspectRatio: "1 / 1",
                    background: bg,
                    borderRadius: 3,
                    border: intensity === 0 ? "1px solid var(--hairline-light)" : "none",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
