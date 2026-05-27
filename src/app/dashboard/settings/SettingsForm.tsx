"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, QrCode, ArrowSquareOut, Palette } from "@phosphor-icons/react";
import ImageUploader from "@/components/ImageUploader";
import { THEME_OPTIONS } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  qrisImageUrl: string | null;
  themeColor: string | null;
}

export default function SettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: tenant.name,
    description: tenant.description ?? "",
    logoUrl: tenant.logoUrl ?? "",
    address: tenant.address ?? "",
    phone: tenant.phone ?? "",
    qrisImageUrl: tenant.qrisImageUrl ?? "",
    themeColor: tenant.themeColor ?? "green",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Terjadi kesalahan.");
      else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-[14px]">{error}</div>}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-[14px]">
          ✓ Pengaturan berhasil disimpan!
        </div>
      )}
      <div className="bg-white rounded-[20px] p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-[var(--ink)]">Profil Toko</h2>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Nama Toko *</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">URL Toko</label>
          <div className="flex items-center gap-2 bg-[var(--surface-cream)] border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5">
            <span className="text-sm text-[var(--ink-muted)]">/store/{tenant.slug}</span>
            <a href={`/store/${tenant.slug}`} target="_blank" className="ml-auto text-[var(--accent)]">
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Deskripsi Toko</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Ceritakan tentang toko Anda..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">No. HP / WhatsApp</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Alamat Toko</label>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Jl. Contoh No. 1"
          />
        </div>
        <ImageUploader label="Logo Toko" value={form.logoUrl} onChange={(url) => update("logoUrl", url)} />
      </div>

      <div className="bg-white rounded-[20px] p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-purple-600" />
          <h2 className="font-semibold text-[var(--ink)]">Warna Tema Toko</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("themeColor", opt.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-[14px] border-2 text-sm font-medium transition-colors",
                form.themeColor === opt.value ? `${opt.swatch.replace("bg-", "border-")} bg-[var(--surface-cream)]` : "border-transparent hover:bg-[var(--surface-cream)]",
              )}
            >
              <span className={cn("w-4 h-4 rounded-full", opt.swatch)} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <QrCode size={20} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-[var(--ink)]">QRIS Statis (fallback)</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">📋 Cara setup</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Daftar QRIS via bank/e-wallet (BSI/BCA/GoPay/OVO).</li>
            <li>Download gambar QR statis Anda.</li>
            <li>Upload di sini, atau tempel URL gambar.</li>
            <li>Untuk QRIS dinamis (auto-konfirmasi), gunakan paket Pro.</li>
          </ol>
        </div>
        <ImageUploader
          label="Gambar QRIS"
          value={form.qrisImageUrl}
          onChange={(url) => update("qrisImageUrl", url)}
          helper="Akan ditampilkan ke pelanggan saat checkout."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--accent)] text-white py-3 rounded-[999px] font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <CircleNotch size={16} className="animate-spin" />}
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
