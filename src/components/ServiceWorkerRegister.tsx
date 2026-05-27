"use client";

import { useEffect } from "react";

/**
 * Register service worker untuk PWA offline support.
 * Hanya aktif di production.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail — SW registration is best-effort
      });
    }
  }, []);

  return null;
}
