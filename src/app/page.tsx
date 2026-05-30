import Link from "next/link";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";

/**
 * Landing page — Shopifi-style two-canvas split.
 *
 * Track 1 (cinematic, canvas-night):
 *   - Top nav (nav-bar-dark) + giant display-xxl headline + outline-on-dark CTA
 *   - Editorial whitespace, no emoji clutter, type does the work
 *
 * Track 2 (transactional, canvas-cream/light):
 *   - Pricing (card-pricing + one card-pricing-featured)
 *   - Feature pistachio band
 *   - footer-light
 */
export default function LandingPage() {
  return (
    <div>
      {/* ============================================================
          CINEMATIC TRACK — canvas-night
          ============================================================ */}
      <div style={{ background: "var(--canvas-night)", color: "var(--on-primary)" }}>
        {/* nav-bar-dark */}
        <nav className="sticky top-0 z-50" style={{ background: "var(--canvas-night)", borderBottom: "1px solid var(--hairline-dark)" }}>
          <div className="container-wide flex items-center justify-between" style={{ padding: "16px 20px" }}>
            <UStoreMark size="md" variant="on-primary" />
            <div className="flex items-center gap-3">
              <Link href="/login" className="caption hidden sm:inline" style={{ color: "var(--on-primary)" }}>
                Masuk
              </Link>
              <Link href="/register" className="pill pill-outline-dark pill-sm">
                Mulai Gratis
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="section-cinematic">
          <div className="container-wide">
            <p className="eyebrow-cap on-dark mb-6">
              <span className="glyph">{GLYPH.sparkle}</span> Untuk UMKM Indonesia
            </p>
            <h1 className="display-xxl" style={{ maxWidth: "14ch" }}>
              Toko digital, sekali setup.
            </h1>
            <p className="body-lg mt-8" style={{ color: "var(--link-cool-3)", maxWidth: 640, fontWeight: 420 }}>
              Bangun katalog, terima order, bayar via QRIS, dan baca bisnis Anda lewat business intelligence
              kelas internasional — semua dari satu HP.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/register" className="pill pill-outline-dark pill-lg">
                Mulai gratis
              </Link>
              <Link href="/store/demo" className="pill pill-lg" style={{ background: "transparent", color: "var(--link-cool-3)", border: "2px solid var(--hairline-dark)" }}>
                Lihat demo toko
              </Link>
            </div>
          </div>
        </section>

        {/* Hero mockup — dashboard preview in device frame */}
        <section style={{ padding: "0 20px 80px" }}>
          <div className="container-wide" style={{ position: "relative" }}>
            {/* Glow effect behind the frame */}
            <div style={{ position: "absolute", inset: "-20%", background: "radial-gradient(ellipse at center, rgba(193,251,212,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "1px solid var(--hairline-dark)", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset" }}>
              {/* Browser chrome bar */}
              <div style={{ background: "#1a1a1a", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
                <span style={{ flex: 1, marginLeft: 12, background: "#2a2a2a", borderRadius: 6, padding: "5px 12px", fontSize: 11, color: "var(--link-cool-3)", fontFamily: "var(--font-mono)" }}>
                  umkmstore.id/dashboard
                </span>
              </div>
              {/* Dashboard screenshot mockup — collage of product images */}
              <div style={{ background: "var(--canvas-cream)", padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, minHeight: 320 }}>
                {/* KPI cards mockup */}
                <div style={{ background: "var(--canvas-light)", borderRadius: 12, padding: 16, border: "1px solid var(--hairline-light)", gridColumn: "span 2" }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--shade-50)", marginBottom: 8 }}>Total Omzet</p>
                  <p style={{ fontSize: 28, fontWeight: 330, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Rp 12.450.000</p>
                  <p style={{ fontSize: 11, color: "var(--shade-50)", marginTop: 4 }}>Hari ini: Rp 1.250.000 (+18%)</p>
                </div>
                <div style={{ background: "var(--aloe-10)", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--shade-60)", marginBottom: 8 }}>Order</p>
                  <p style={{ fontSize: 28, fontWeight: 330, color: "var(--ink)" }}>156</p>
                </div>
                <div style={{ background: "var(--canvas-light)", borderRadius: 12, padding: 16, border: "1px solid var(--hairline-light)" }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--shade-50)", marginBottom: 8 }}>Produk</p>
                  <p style={{ fontSize: 28, fontWeight: 330, color: "var(--ink)" }}>20</p>
                </div>
                {/* Product image grid */}
                {[
                  "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=300&fit=crop",
                ].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12 }} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          TRANSACTIONAL TRACK — canvas-cream
          ============================================================ */}
      <div style={{ background: "var(--canvas-cream)", color: "var(--ink)" }}>
        {/* Feature grid with images */}
        <section className="section-marketing">
          <div className="container-xl">
            <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.diamond}</span> Kapabilitas</p>
            <h2 className="display-md mb-12" style={{ maxWidth: 720 }}>
              Semua yang UMKM butuhkan, dalam satu platform.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {[
                { glyph: GLYPH.hex, title: "Toko Digital", desc: "Katalog produk dengan foto, harga, stok. Share link ke pelanggan.", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop", tint: "tint-lavender" },
                { glyph: GLYPH.diamond, title: "QRIS Otomatis", desc: "Statis & dinamis (Midtrans). Order otomatis terkonfirmasi saat dibayar.", img: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=600&h=400&fit=crop", tint: "tint-peach" },
                { glyph: GLYPH.hexFilled, title: "Kelola Pesanan", desc: "Konfirmasi, proses, selesaikan — semua dari satu dashboard.", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop", tint: "tint-sky" },
                { glyph: GLYPH.lozenge, title: "POS Cashier", desc: "Mode kasir dengan grid produk dan keranjang persisten.", img: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=600&h=400&fit=crop", tint: "tint-mint" },
                { glyph: GLYPH.sparkle, title: "Business Intelligence", desc: "RFM, forecasting Holt, cohort retention, market basket — standar global.", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop", tint: "tint-lemon" },
                { glyph: GLYPH.premium, title: "Loyalty & Promo", desc: "Poin pelanggan, kode diskon, broadcast WhatsApp, segmentation.", img: "https://images.unsplash.com/photo-1556742205-e10c9486e506?w=600&h=400&fit=crop", tint: "tint-rose" },
              ].map((f) => (
                <article key={f.title} className={`card-tint ${f.tint}`} style={{ padding: 0, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.img} alt={f.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                  <div style={{ padding: "20px 24px 24px" }}>
                    <span className="icon-chip mb-4" style={{ marginBottom: 16 }}>
                      <span className="glyph">{f.glyph}</span>
                    </span>
                    <h3 className="heading-md mb-2" style={{ marginTop: 4 }}>{f.title}</h3>
                    <p className="body-md" style={{ color: "var(--shade-60)" }}>{f.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pistachio band — BI value proposition */}
        <section style={{ padding: "0 20px 64px" }}>
          <div className="container-xl card-pistachio-band">
            <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.sparkle}</span> Business Intelligence</p>
            <h2 className="display-md mb-4" style={{ maxWidth: 720 }}>
              Baca bisnis Anda seperti analis profesional.
            </h2>
            <p className="body-lg mb-8" style={{ maxWidth: 680 }}>
              UMKMStore memasang RFM segmentation (Hughes 1996), Holt-smoothing forecast, cohort retention,
              dan market-basket affinity langsung di dashboard. Tanpa belajar Excel, tanpa konsultan.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { k: "RFM", v: "8 segmen pelanggan" },
                { k: "Forecast", v: "7 hari ke depan" },
                { k: "Cohort", v: "Retensi 6 bulan" },
                { k: "Basket", v: "Cross-sell otomatis" },
              ].map((m) => (
                <div key={m.k} style={{ background: "var(--canvas-light)", padding: 20, borderRadius: 12 }}>
                  <p className="eyebrow-cap mb-1">{m.k}</p>
                  <p className="heading-sm">{m.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — light track */}
        <section className="section-marketing" style={{ paddingTop: 32 }}>
          <div className="container-lg">
            <p className="eyebrow-cap text-center mb-3"><span className="glyph">{GLYPH.diamondThin}</span> Paket</p>
            <h2 className="display-lg text-center mb-3">Mulai gratis, upgrade saat siap.</h2>
            <p className="body-md text-center mb-12" style={{ color: "var(--shade-50)" }}>
              Trial 14 hari gratis untuk semua paket berbayar. Tanpa kartu kredit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Basic */}
              <article className="card-pricing">
                <h3 className="heading-xl mb-2">Basic</h3>
                <p className="kpi-value-lg mb-1">Gratis</p>
                <p className="micro mb-6" style={{ color: "var(--shade-50)" }}>Selamanya</p>
                <ul className="space-y-2 mb-8 caption flex-1">
                  {["1 toko", "50 produk", "QRIS statis", "Order manual", "Dashboard dasar"].map((f) => (
                    <li key={f}><span className="glyph mr-2" style={{ color: "var(--ink)" }}>{GLYPH.diamondThin}</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register" className="pill pill-outline-light w-full">Mulai gratis</Link>
              </article>

              {/* Pro — featured */}
              <article className="card-pricing-featured">
                <p className="tag-mint mb-3 self-start" style={{ background: "var(--ink)", color: "var(--on-primary)" }}>
                  Paling Populer
                </p>
                <h3 className="heading-xl mb-2">Pro</h3>
                <p className="kpi-value-lg mb-1">Rp 99.000</p>
                <p className="micro mb-6" style={{ color: "var(--shade-60)" }}>per bulan</p>
                <ul className="space-y-2 mb-8 caption flex-1">
                  {[
                    "Produk unlimited",
                    "QRIS dinamis",
                    "Notifikasi WA",
                    "Export CSV",
                    "Business Intelligence",
                    "Promo lanjutan",
                  ].map((f) => (
                    <li key={f}><span className="glyph mr-2">{GLYPH.diamondThin}</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register" className="pill pill-primary w-full">Mulai trial 14 hari</Link>
              </article>

              {/* Business */}
              <article className="card-pricing">
                <h3 className="heading-xl mb-2">Business</h3>
                <p className="kpi-value-lg mb-1">Rp 299.000</p>
                <p className="micro mb-6" style={{ color: "var(--shade-50)" }}>per bulan</p>
                <ul className="space-y-2 mb-8 caption flex-1">
                  {[
                    "Multi outlet (5)",
                    "Staff management",
                    "Insights lanjutan",
                    "Priority support",
                    "Semua fitur Pro",
                  ].map((f) => (
                    <li key={f}><span className="glyph mr-2" style={{ color: "var(--ink)" }}>{GLYPH.diamondThin}</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register" className="pill pill-outline-light w-full">Hubungi sales</Link>
              </article>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          SOCIAL PROOF — testimonials
          ============================================================ */}
      <section style={{ background: "var(--canvas-light)", padding: "80px 20px" }}>
        <div className="container-xl">
          <p className="eyebrow-cap text-center mb-3"><span className="glyph">{GLYPH.hexMolecule}</span> Dipercaya UMKM</p>
          <h2 className="display-md text-center mb-12">Kata mereka yang sudah pakai.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Rina Susanti", role: "Owner, Kopi Kenangan Lokal", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", quote: "Setup toko cuma 5 menit. Sekarang order masuk otomatis via QRIS, nggak perlu konfirmasi manual lagi." },
              { name: "Pak Hendra", role: "Owner, Warung Nasi Padang", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", quote: "Fitur BI-nya gila. Saya bisa tahu produk mana yang laku, kapan peak hour, dan siapa pelanggan loyal." },
              { name: "Dian Permata", role: "Owner, Bakery Artisan", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", quote: "Multi-outlet dan laporan harian otomatis ke WA sangat membantu. Nggak perlu tanya kasir satu-satu." },
            ].map((t) => (
              <article key={t.name} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p className="body-md" style={{ color: "var(--shade-60)", flex: 1 }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <p className="caption" style={{ color: "var(--ink)" }}>{t.name}</p>
                    <p className="micro" style={{ color: "var(--shade-50)" }}>{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA strip — back to cinematic
          ============================================================ */}
      <section className="section-cinematic">
        <div className="container-md text-center">
          <p className="eyebrow-cap on-dark mb-4"><span className="glyph">{GLYPH.endMark}</span> Mulai sekarang</p>
          <h2 className="display-lg mb-6">
            Punya ide jualan? Buka toko dalam 5 menit.
          </h2>
          <Link href="/register" className="pill pill-outline-dark pill-lg">
            Daftar gratis <span className="glyph">{GLYPH.arrow}</span>
          </Link>
        </div>
      </section>

      {/* footer-light */}
      <footer style={{ background: "var(--canvas-light)", color: "var(--ink)", borderTop: "1px solid var(--hairline-light)" }}>
        <div className="container-xl grid grid-cols-2 sm:grid-cols-4 gap-8" style={{ padding: "48px 20px" }}>
          <div className="col-span-2 sm:col-span-1">
            <UStoreMark size="md" />
            <p className="micro mt-3" style={{ color: "var(--shade-50)" }}>
              Platform SaaS untuk UMKM Indonesia.
            </p>
          </div>
          <div>
            <p className="eyebrow-cap mb-3">Produk</p>
            <ul className="space-y-1.5 caption" style={{ color: "var(--shade-60)" }}>
              <li><Link href="/register">Daftar</Link></li>
              <li><Link href="/login">Masuk</Link></li>
              <li><Link href="/store/demo">Demo</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow-cap mb-3">Sumber</p>
            <ul className="space-y-1.5 caption" style={{ color: "var(--shade-60)" }}>
              <li>Dokumentasi</li>
              <li>Status</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow-cap mb-3">Legal</p>
            <ul className="space-y-1.5 caption" style={{ color: "var(--shade-60)" }}>
              <li>Privasi</li>
              <li>Syarat</li>
              <li>Kontak</li>
            </ul>
          </div>
        </div>
        <div className="container-xl micro tabular" style={{ color: "var(--shade-50)", borderTop: "1px solid var(--hairline-light)", padding: "20px" }}>
          © 2026 UMKMStore <span className="glyph">·</span> Jakarta, Indonesia
        </div>
      </footer>
    </div>
  );
}
