"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";

export default function StaffForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Gagal menambah kasir.");
      else {
        setSuccess(`Kasir "${form.name}" berhasil ditambahkan.`);
        setForm({ name: "", email: "", password: "" });
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-[14px]">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-[14px]">{success}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Nama *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Nama kasir"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="kasir@toko.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Min. 6 karakter"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-[var(--accent)] text-white px-5 py-2 rounded-[999px] text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"
      >
        {loading && <CircleNotch size={16} className="animate-spin" />}
        {loading ? "Menambahkan..." : "Tambah Kasir"}
      </button>
    </form>
  );
}
