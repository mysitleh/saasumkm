"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

/** Hook to fire toasts from any client component. */
export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Graceful no-op fallback so components don't crash if provider missing.
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return ctx;
}

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string; glyph: string }> = {
  success: { bg: "var(--ink)", fg: "var(--on-primary)", glyph: "▣" },
  error: { bg: "#e11d48", fg: "#ffffff", glyph: "✕" },
  info: { bg: "var(--aloe-10)", fg: "var(--ink)", glyph: "◈" },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value: ToastCtx = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 88,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 100,
          pointerEvents: "none",
          padding: "0 16px",
        }}
      >
        {toasts.map((t) => {
          const s = KIND_STYLE[t.kind];
          return (
            <button
              key={t.id}
              onClick={() => remove(t.id)}
              className="ums-toast"
              style={{
                pointerEvents: "auto",
                background: s.bg,
                color: s.fg,
                border: "none",
                borderRadius: 9999,
                padding: "11px 20px",
                fontSize: 14,
                fontWeight: 500,
                fontFeatureSettings: '"ss03" on',
                boxShadow: "0 10px 30px -8px rgba(0,0,0,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                maxWidth: 480,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.9 }}>{s.glyph}</span>
              {t.message}
            </button>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

/** Tailwind-free keyframe injected once. */
export function ToastKeyframes() {
  useEffect(() => {
    const id = "ums-toast-kf";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes umsToastIn { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: none; } }
      .ums-toast { animation: umsToastIn .28s cubic-bezier(.16,1,.3,1); }
      @media (prefers-reduced-motion: reduce) { .ums-toast { animation: none; } }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}
