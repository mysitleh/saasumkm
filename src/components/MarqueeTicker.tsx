import { GLYPH } from "@/lib/glyphs";

/**
 * MarqueeTicker — compact scrolling status/reminder bar.
 *
 * A thin pill-strip (height ~36px) that shows a small "TAG" badge plus an
 * infinite-scrolling list of short reminders. Designed to later carry live
 * notifications (pending orders, low stock, trial expiry, new messages).
 *
 * Pure CSS marquee: two identical groups translate -50% for a seamless loop.
 * Pauses on hover, edge-faded, reduced-motion safe.
 */
export interface TickerItem {
  /** Short text shown in the ticker. */
  text: string;
  /** Optional leading glyph (defaults to a small diamond). */
  glyph?: string;
  /** Render in alert (red) tone instead of the default. */
  alert?: boolean;
}

export interface MarqueeTickerProps {
  items: TickerItem[];
  /** Badge label on the left. Defaults to "INFO". */
  tag?: string;
  /** Mark the whole strip (and tag) as an alert. */
  alert?: boolean;
  /** Seconds for one full loop. Lower = faster. */
  duration?: number;
}

export default function MarqueeTicker({ items, tag = "Info", alert = false, duration }: MarqueeTickerProps) {
  if (items.length === 0) return null;

  // Scroll speed scales with content length so short lists don't whip past.
  const totalChars = items.reduce((n, i) => n + i.text.length + 6, 0);
  const dur = duration ?? Math.max(14, Math.min(60, Math.round(totalChars / 4)));

  return (
    <div className="ticker" role="status" aria-live="polite">
      <span className={alert ? "ticker-tag is-alert" : "ticker-tag"}>
        <span className="glyph" aria-hidden="true">{alert ? GLYPH.circleRing : GLYPH.sparkle}</span>
        {tag}
      </span>
      <div className="ticker-viewport">
        <div className="ticker-track" style={{ animationDuration: `${dur}s` }}>
          {[0, 1].map((group) => (
            <div className="ticker-group" key={group} aria-hidden={group === 1 ? true : undefined}>
              {items.map((it, i) => (
                <span className={it.alert ? "ticker-item is-alert" : "ticker-item"} key={i}>
                  <span className="glyph" aria-hidden="true">{it.glyph ?? GLYPH.diamondThin}</span>
                  {it.text}
                  <span className="ticker-sep glyph" aria-hidden="true">{GLYPH.hexFilled}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
