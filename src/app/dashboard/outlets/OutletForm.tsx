"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";

export default function OutletForm({ currentCount }: { currentCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  if (currentCount >= 5) {
    return <p className="text-sm text-[var(--ink-muted)]">Batas maksimal 5 outlet tercapai.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Gagal menambah outlet.");
      else {
        setForm({ name: "", address: "", phone: "" });
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-[14px]">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Nama Outlet *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Cabang Kemang"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Alamat</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Jl. Kemang Raya No. 5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Telepon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="pill pill-primary pill-sm"
      >
        {loading && <CircleNotch size={16} className="animate-spin" />}
        Tambah Outlet
      </button>
    </form>
  );
}
