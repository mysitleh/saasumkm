"use client";

import { useState } from "react";
import { Sparkle, CircleNotch, ArrowClockwise, Copy, Check } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";

interface Brief {
  headline: string;
  summary: string;
  actions: string[];
  provider?: string;
}

const CONTENT_TYPES = [
  { key: "description", label: "Deskripsi Produk" },
  { key: "promo", label: "Caption Promo" },
  { key: "whatsapp", label: "Pesan WhatsApp" },
  { key: "seo", label: "SEO Meta" },
  { key: "hashtags", label: "Hashtag" },
] as const;

const TONES = ["santai", "profesional", "lucu", "mewah"] as const;

export default function AiStudio({ liveProvider }: { liveProvider: "openai" | "fallback" }) {
  return (
    <div className="space-y-6">
      {liveProvider === "fallback" && (
        <div className="alert" role="status">
          <span className="glyph mr-2">{GLYPH.reference}</span>
          Mode ringkas aktif. Set <code style={{ fontFamily: "var(--font-mono)" }}>OPENAI_API_KEY</code> untuk AI penuh.
        </div>
      )}
      <DailyBrief />
      <ContentStudio />
    </div>
  );
}

function DailyBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ai/brief", { method: "POST" });
      const data = await res.json();
      if (res.ok) setBrief(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card-tint tint-lavender" style={{ padding: 24 }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="eyebrow-cap" style={{ color: "var(--shade-60)" }}>
          <span className="glyph" style={{ color: "var(--iso-violet)" }}>{GLYPH.sparkle}</span> Brief Harian AI
        </p>
        <button onClick={load} disabled={loading} className="pill pill-violet pill-sm">
          {loading ? <CircleNotch size={14} className="animate-spin" /> : <ArrowClockwise size={14} />}
          {brief ? "Perbarui" : "Buat brief"}
        </button>
      </div>
      {!brief && !loading && (
        <p className="body-md" style={{ color: "var(--shade-60)" }}>
          Klik &ldquo;Buat brief&rdquo; untuk ringkasan kondisi bisnis + 3 aksi prioritas hari ini.
        </p>
      )}
      {loading && <p className="body-md" style={{ color: "var(--shade-50)" }}>AI sedang menganalisis data toko Anda…</p>}
      {brief && (
        <div>
          <h3 className="heading-md mb-2">{brief.headline}</h3>
          <p className="body-md mb-4" style={{ color: "var(--shade-60)" }}>{brief.summary}</p>
          <div className="space-y-2">
            {brief.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5" style={{ background: "var(--canvas-light)", borderRadius: 12, padding: "10px 14px" }}>
                <span className="ai-action-num">{i + 1}</span>
                <span className="caption" style={{ color: "var(--ink)" }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ContentStudio() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<(typeof CONTENT_TYPES)[number]["key"]>("description");
  const [tone, setTone] = useState<(typeof TONES)[number]>("santai");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/dashboard/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name, category: category || undefined, type, tone }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.text || "");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="card" style={{ padding: 24 }}>
      <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamond}</span> Content Studio</p>
      <h2 className="heading-md mb-4">Generator konten AI</h2>

      <div className="field-row mb-3">
        <div>
          <label className="eyebrow-cap mb-2 block">Nama produk</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Kopi Susu Gula Aren" />
        </div>
        <div>
          <label className="eyebrow-cap mb-2 block">Kategori (opsional)</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="Minuman" />
        </div>
      </div>

      <label className="eyebrow-cap mb-2 block">Jenis konten</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {CONTENT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className="tab-pill"
            data-active={type === t.key}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="eyebrow-cap mb-2 block">Nada</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {TONES.map((t) => (
          <button key={t} onClick={() => setTone(t)} className="tab-pill" data-active={tone === t} type="button" style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading || !name.trim()} className="pill pill-primary">
        {loading ? <CircleNotch size={16} className="animate-spin" /> : <Sparkle size={16} weight="fill" />}
        {loading ? "Membuat…" : "Generate"}
      </button>

      {result && (
        <div className="mt-5" style={{ position: "relative", background: "var(--canvas-cream)", borderRadius: 14, padding: "16px 16px 16px 16px" }}>
          <p className="body-md" style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{result}</p>
          <button onClick={copy} className="pill pill-outline-light pill-sm mt-3">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
      )}
    </section>
  );
}
