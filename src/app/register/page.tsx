"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ownerName: "", email: "", password: "", storeName: "", storeSlug: "", phone: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const u = { ...prev, [name]: value };
      if (name === "storeName") u.storeSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return u;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Terjadi kesalahan.");
      else router.push("/login?registered=1");
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8 md:mb-10">
          <Link href="/" className="inline-block mb-6"><UStoreMark size="lg" /></Link>
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.sparkle}</span> Daftar</p>
          <h1 className="display-md">Buat toko gratis.</h1>
          <p className="body-md mt-3" style={{ color: "var(--shade-50)" }}>
            Trial 14 hari semua fitur Pro. Tanpa kartu kredit.
          </p>
        </div>
        <div className="auth-card">
          {error && (
            <div className="alert mb-4">
              <span className="glyph mr-2">{GLYPH.reference}</span>{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="ownerName" label="Nama Pemilik" placeholder="Nama lengkap Anda" value={form.ownerName} onChange={handleChange} />
            <Field name="email" label="Email" type="email" placeholder="email@toko.com" value={form.email} onChange={handleChange} />
            <Field name="password" label="Password" type="password" placeholder="Min. 6 karakter" value={form.password} onChange={handleChange} />
            <hr className="hairline" />
            <Field name="storeName" label="Nama Toko" placeholder="Kedai Kopi Pak Budi" value={form.storeName} onChange={handleChange} />
            <div>
              <label className="eyebrow-cap mb-2 block">Slug Toko (URL)</label>
              <div className="flex items-center" style={{ background: "var(--canvas-light)", border: "1px solid var(--hairline-light)", borderRadius: 8, overflow: "hidden", minHeight: 44 }}>
                <span className="caption px-3" style={{ color: "var(--shade-50)", borderRight: "1px solid var(--hairline-light)", height: 44, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>/store/</span>
                <input
                  name="storeSlug"
                  value={form.storeSlug}
                  onChange={handleChange}
                  required
                  pattern="[a-z0-9-]+"
                  className="flex-1 px-3 body-md min-w-0"
                  style={{ background: "transparent", border: "none", outline: "none", height: 44 }}
                  placeholder="kedai-kopi-pak-budi"
                />
              </div>
            </div>
            <Field name="phone" label="No. HP (opsional)" placeholder="08xxxxxxxxxx" value={form.phone} onChange={handleChange} required={false} />
            <button type="submit" disabled={loading} className="pill pill-primary w-full">
              {loading && <CircleNotch size={16} className="animate-spin" />}
              {loading ? "Membuat toko..." : "Buat toko sekarang"}
            </button>
          </form>
          <p className="caption text-center mt-6" style={{ color: "var(--shade-50)" }}>
            Sudah punya akun? <Link href="/login" className="hover:underline" style={{ color: "var(--ink)", fontWeight: 550 }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  name, label, type = "text", placeholder, value, onChange, required = true,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="eyebrow-cap mb-2 block">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="input"
        placeholder={placeholder}
      />
    </div>
  );
}
