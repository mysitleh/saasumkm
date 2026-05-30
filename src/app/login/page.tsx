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
    <div className="min-h-screen flex">
      {/* Left panel — visual/branding (hidden on mobile) */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden"
        style={{ background: "var(--canvas-night)", color: "var(--on-primary)", padding: "40px 48px" }}
      >
        <UStoreMark size="md" variant="on-primary" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow-cap on-dark mb-4">
            <span className="glyph">{GLYPH.sparkle}</span> Platform UMKM #1
          </p>
          <h2 className="display-lg" style={{ maxWidth: "16ch" }}>
            Kelola bisnis dari satu dashboard.
          </h2>
          <p className="body-md mt-4" style={{ color: "var(--link-cool-3)", maxWidth: 420 }}>
            Terima order, pantau omzet, dan baca insight bisnis — semua real-time.
          </p>
        </div>
        {/* Decorative product collage */}
        <div className="grid grid-cols-3 gap-3" style={{ maxWidth: 400 }}>
          {[
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200&h=200&fit=crop",
            "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop",
          ].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, opacity: 0.7 }}
            />
          ))}
        </div>
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center" style={{ background: "var(--canvas-cream)", padding: "32px 20px" }}>
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8 md:mb-10 lg:hidden">
            <Link href="/" className="inline-block mb-6"><UStoreMark size="lg" /></Link>
          </div>
          <div className="lg:text-left">
            <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.circle}</span> Masuk</p>
            <h1 className="display-md mb-2">Selamat datang kembali.</h1>
            <p className="body-md mb-8" style={{ color: "var(--shade-50)" }}>
              Masuk ke dashboard toko Anda.
            </p>
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
    </div>
  );
}
