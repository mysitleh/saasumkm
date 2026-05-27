"use client";

interface Cell { hour: number; weekday: number; orders: number; revenue: number }

const WD = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * 24×7 hour-by-weekday order density heatmap.
 * Cells use aloe-10 → pistachio-10 → ink ramp depending on intensity.
 */
export default function HeatmapGrid({ cells }: { cells: Cell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.orders));
  const grid: Cell[][] = Array.from({ length: 7 }, () => Array(24).fill(null));
  for (const c of cells) grid[c.weekday][c.hour] = c;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 2, minWidth: 560 }}>
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="micro tabular" style={{ color: "var(--shade-50)", fontWeight: 400, textAlign: "center", padding: 0 }}>
                {h % 3 === 0 ? h : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, w) => (
            <tr key={w}>
              <td className="micro tabular pr-2" style={{ color: "var(--shade-50)" }}>{WD[w]}</td>
              {row.map((c, h) => {
                const v = c?.orders ?? 0;
                const intensity = v / max;
                let bg = "transparent";
                if (intensity > 0 && intensity <= 0.25) bg = "var(--pistachio-10)";
                else if (intensity > 0.25 && intensity <= 0.6) bg = "var(--aloe-10)";
                else if (intensity > 0.6) bg = "var(--ink)";
                return (
                  <td
                    key={h}
                    title={`${WD[w]} ${h}:00 — ${v} order`}
                    style={{
                      width: 16,
                      height: 16,
                      background: bg,
                      borderRadius: 2,
                      border: bg === "transparent" ? "1px solid var(--hairline-light)" : "none",
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
