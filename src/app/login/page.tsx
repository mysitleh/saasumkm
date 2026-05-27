"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeSlash, CircleNotch } from "@phosphor-icons/react";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email atau password salah.");
    else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="auth-shell">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8 md:mb-10">
          <Link href="/" className="inline-block mb-6"><UStoreMark size="lg" /></Link>
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.circle}</span> Masuk</p>
          <h1 className="display-md">Selamat datang kembali.</h1>
        </div>
        <div className="auth-card">
          {error && (
            <div className="alert mb-4">
              <span className="glyph mr-2">{GLYPH.reference}</span>{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow-cap mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="email@toko.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="eyebrow-cap mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--shade-50)" }}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="pill pill-primary w-full">
              {loading && <CircleNotch size={16} className="animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
          <p className="caption text-center mt-6" style={{ color: "var(--shade-50)" }}>
            Belum punya akun? <Link href="/register" className="hover:underline" style={{ color: "var(--ink)", fontWeight: 550 }}>Daftar gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
