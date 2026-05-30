import { GLYPH } from "@/lib/glyphs";

/**
 * MarqueeHeading — an infinite horizontal scrolling display heading.
 *
 * Replaces the static `<h1 className="display-md">` page titles with a
 * modern, anti-mainstream marquee band. Pure CSS (no JS): two identical
 * groups translate -50% for a seamless loop, edges fade via mask, and the
 * animation pauses on hover + disables under prefers-reduced-motion.
 *
 * Accessibility: the wrapper is an <h1> carrying the real text via
 * aria-label; the repeated visual copies are aria-hidden.
 */
export interface MarqueeHeadingProps {
  text: string;
  /** Separator glyph between repeats. Defaults to a small brand diamond. */
  sep?: string;
  /** Seconds for one full loop. Lower = faster. */
  duration?: number;
  /** Scroll right-to-left (default) or reverse. */
  reverse?: boolean;
  /** Repeats per group — more = denser band. */
  repeat?: number;
}

export default function MarqueeHeading({
  text,
  sep = GLYPH.diamond,
  duration = 22,
  reverse = false,
  repeat = 4,
}: MarqueeHeadingProps) {
  const items = Array.from({ length: repeat });
  return (
    <h1 className="marquee-heading" aria-label={text}>
      <span
        className="marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((group) => (
          <span className="marquee-group" key={group} aria-hidden={group === 1 ? true : undefined}>
            {items.map((_, i) => (
              <span className="marquee-item" key={i}>
                {text}
                <span className="marquee-sep glyph">{sep}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}
