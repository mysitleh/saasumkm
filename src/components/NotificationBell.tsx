"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";
import type { TickerItem } from "@/components/MarqueeTicker";

/**
 * NotificationBell — header bell with unread count + dropdown panel.
 *
 * Shares the same reminder feed as the ticker, presented as a proper
 * notification center: a badge shows the alert count, the dropdown lists
 * each reminder with deep-links. This is the "notifikasi" evolution of the
 * ticker the user asked for.
 */
export default function NotificationBell({ items, alertCount }: { items: TickerItem[]; alertCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const count = items.length;

  return (
    <div className="notif" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="notif-trigger ums-tap"
        aria-label={`Notifikasi (${count})`}
        aria-expanded={open}
      >
        <Bell size={18} weight={alertCount > 0 ? "fill" : "regular"} />
        {count > 0 && (
          <span className={alertCount > 0 ? "notif-badge is-alert" : "notif-badge"}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel ums-fade" role="menu">
          <div className="notif-head">
            <span className="eyebrow-cap" style={{ color: "var(--shade-60)" }}>
              <span className="glyph" style={{ color: "var(--iso-violet)" }}>{GLYPH.sparkle}</span> Notifikasi
            </span>
            <span className="micro tabular" style={{ color: "var(--shade-50)" }}>{count} item</span>
          </div>
          <ul className="notif-list">
            {items.map((it, i) => {
              const body = (
                <>
                  <span className={it.alert ? "notif-dot is-alert" : "notif-dot"} aria-hidden="true" />
                  <span className="notif-text">{it.text}</span>
                  {it.href && <span className="notif-go glyph" aria-hidden="true">{GLYPH.arrow}</span>}
                </>
              );
              return (
                <li key={i}>
                  {it.href ? (
                    <Link href={it.href} className="notif-row" onClick={() => setOpen(false)} role="menuitem">
                      {body}
                    </Link>
                  ) : (
                    <span className="notif-row">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
