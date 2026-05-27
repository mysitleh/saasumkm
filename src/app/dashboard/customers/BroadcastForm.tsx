"use client";

import { useState } from "react";
import { CircleNotch, PaperPlaneTilt, Sparkle } from "@phosphor-icons/react";

export default function BroadcastForm() {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all" | "recent">("recent");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");

  async function generateCaption() {
    const res = await fetch("/api/dashboard/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: "promo toko", type: "promo" }),
    });
    const data = await res.json();
    if (data.text) setMessage(data.text);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    if (!confirm(`Kirim broadcast ke ${target === "all" ? "semua" : "30 hari terakhir"} pelanggan?`)) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/dashboard/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, target }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Gagal mengirim broadcast.");
      else setResult(data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-sm mb-6">
      <h2 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
        <PaperPlaneTilt size={16} /> Broadcast WhatsApp
      </h2>

      <form onSubmit={handleSend} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[var(--ink-muted)]">Pesan</label>
            <button
              type="button"
              onClick={generateCaption}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Sparkle size={12} /> AI Caption
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Tulis pesan promo untuk pelanggan..."
          />
          <p className="text-xs text-[var(--ink-muted)] text-right">{message.length}/1000</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-[var(--ink-muted)]">Target:</label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="target"
              value="recent"
              checked={target === "recent"}
              onChange={() => setTarget("recent")}
              className="accent-emerald-600"
            />
            30 hari terakhir
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="target"
              value="all"
              checked={target === "all"}
              onChange={() => setTarget("all")}
              className="accent-emerald-600"
            />
            Semua
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-3 text-sm text-emerald-700">
            ✓ Terkirim: {result.sent} | Gagal: {result.failed} | Total: {result.total}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-[var(--accent)] text-white px-5 py-2 rounded-[999px] text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"
        >
          {loading && <CircleNotch size={16} className="animate-spin" />}
          {loading ? "Mengirim..." : "Kirim Broadcast"}
        </button>
      </form>
    </div>
  );
}
