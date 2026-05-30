"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** Format the running value (e.g. Rupiah). */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

function prefersReduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts up to `value` on mount / when it changes, using rAF + easeOutExpo.
 * Respects prefers-reduced-motion (jumps straight to final value).
 */
export default function AnimatedNumber({ value, format, durationMs = 900, className }: Props) {
  // Initialize at final value when reduced-motion to avoid an effect setState.
  const [display, setDisplay] = useState(() => (prefersReduced() ? value : 0));
  const fromRef = useRef(prefersReduced() ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced()) {
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return <span className={className}>{format ? format(display) : display.toLocaleString("id-ID")}</span>;
}
