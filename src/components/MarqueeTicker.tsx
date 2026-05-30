import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";

/**
 * MarqueeTicker — compact scrolling status/reminder bar.
 *
 * A thin pill-strip that shows a small "TAG" badge plus an infinite-scrolling
 * list of short reminders. Each reminder can deep-link to the relevant page
 * (e.g. unpaid orders -> /dashboard/orders?status=WAITING_PAYMENT). Designed
 * to carry live notifications (orders, stock, trial, capacity).
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
  /** Optional deep-link target. */
  href?: string;
}

export interface MarqueeTickerProps {
  items: TickerItem[];
  /** Badge label on the left. Defaults to "Info". */
  tag?: string;
  /** Mark the whole strip (and tag) as an alert. */
  alert?: boolean;
  /** Seconds for one full loop. Lower = faster. */
  duration?: number;
}

function ItemInner({ it }: { it: TickerItem }) {
  return (
    <>
      <span className="glyph" aria-hidden="true">{it.glyph ?? GLYPH.diamondThin}</span>
      {it.text}
      {it.href && <span className="ticker-go glyph" aria-hidden="true">{GLYPH.arrow}</span>}
      <span className="ticker-sep glyph" aria-hidden="true">{GLYPH.hexFilled}</span>
    </>
  );
}

export default function MarqueeTicker({ items, tag = "Info", alert = false, duration }: MarqueeTickerProps) {
  if (items.length === 0) return null;

  // Scroll speed scales with content length so short lists don't whip past.
  const totalChars = items.reduce((n, i) => n + i.text.length + 6, 0);
  const dur = duration ?? Math.max(16, Math.min(64, Math.round(totalChars / 3.2)));

  return (
    <div className="ticker" role="status" aria-live="polite">
      <span className={alert ? "ticker-tag is-alert" : "ticker-tag"}>
        <span className="ticker-dot" aria-hidden="true" />
        {tag}
      </span>
      <div className="ticker-viewport">
        <div className="ticker-track" style={{ animationDuration: `${dur}s` }}>
          {[0, 1].map((group) => (
            <div className="ticker-group" key={group} aria-hidden={group === 1 ? true : undefined}>
              {items.map((it, i) => {
                const cls = it.alert ? "ticker-item is-alert" : "ticker-item";
                return it.href ? (
                  <Link key={i} href={it.href} className={`${cls} ticker-link`} tabIndex={group === 1 ? -1 : 0}>
                    <ItemInner it={it} />
                  </Link>
                ) : (
                  <span key={i} className={cls}>
                    <ItemInner it={it} />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
