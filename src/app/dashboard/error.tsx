"use client";

import { useEffect } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="page-shell flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-sm">
        <Warning size={40} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--ink)] mb-2">Terjadi Kesalahan</h2>
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          {error.message || "Sesuatu tidak berjalan dengan benar. Silakan coba lagi."}
        </p>
        <button
          onClick={reset}
          className="pill pill-primary pill-sm inline-flex"
        >
          <ArrowClockwise size={16} /> Coba Lagi
        </button>
      </div>
    </div>
  );
}
