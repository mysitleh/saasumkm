"use client";

import { useState } from "react";
import { CircleNotch, Check, ArrowCounterClockwise } from "@phosphor-icons/react";
import LogoMark from "@/components/icons/LogoMark";
import { useToast } from "@/components/ui/Toast";
import {
  type LogoConfig,
  LOGO_SHAPES,
  LOGO_SYMBOLS,
  LOGO_FILLS,
  LOGO_PRESETS,
  DEFAULT_LOGO,
} from "@/lib/logo";

const SWATCHES = ["#6c4cf1", "#0a0a0a", "#10b981", "#2563eb", "#e11d48", "#f97316", "#7c3aed", "#0ea5e9"];
const ACCENTS = ["#c1fbd4", "#fcd34d", "#fb7185", "#93c5fd", "#34d399", "#c4b5fd", "#fdba74", "#ffffff"];

export default function LogoBuilder({ initialConfig, storeName }: { initialConfig: LogoConfig; storeName: string }) {
  const toast = useToast();
  const [cfg, setCfg] = useState<LogoConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof LogoConfig>(key: K, value: LogoConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (res.ok) toast.success("Logo tersimpan & aktif di storefront.");
      else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal menyimpan logo.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setCfg(DEFAULT_LOGO);
    await fetch("/api/dashboard/logo", { method: "DELETE" });
    toast.success("Logo dikembalikan ke default.");
  }

  return (
    <div className="logo-builder-grid">
      {/* ---- Controls ---- */}
      <div className="space-y-6">
        {/* Presets */}
        <section className="card" style={{ padding: 20 }}>
          <p className="eyebrow-cap mb-3">Preset cepat</p>
          <div className="logo-preset-grid">
            {LOGO_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setCfg(p.config)}
                className="logo-preset ums-tap"
                title={p.name}
                type="button"
              >
                <LogoMark config={p.config} size={36} idSeed={`pre-${p.name}`} />
                <span className="micro" style={{ color: "var(--shade-50)" }}>{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Shape */}
        <Control label="Bentuk">
          <div className="flex flex-wrap gap-2">
            {LOGO_SHAPES.map((s) => (
              <button key={s.value} type="button" onClick={() => set("shape", s.value)} className="tab-pill" data-active={cfg.shape === s.value}>
                {s.label}
              </button>
            ))}
          </div>
        </Control>

        {/* Symbol */}
        <Control label="Simbol">
          <div className="logo-symbol-grid">
            {LOGO_SYMBOLS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set("symbol", s.value)}
                className="logo-symbol-btn ums-tap"
                data-active={cfg.symbol === s.value}
                title={s.label}
              >
                <LogoMark config={{ ...cfg, symbol: s.value }} size={30} idSeed={`sym-${s.value}`} />
              </button>
            ))}
          </div>
          {cfg.symbol === "monogram" && (
            <input
              value={cfg.initial ?? ""}
              onChange={(e) => set("initial", e.target.value.slice(0, 2))}
              placeholder="Huruf (mis. U)"
              className="input mt-3"
              style={{ maxWidth: 160 }}
              maxLength={2}
            />
          )}
        </Control>

        {/* Fill */}
        <Control label="Gaya isi">
          <div className="flex flex-wrap gap-2">
            {LOGO_FILLS.map((f) => (
              <button key={f.value} type="button" onClick={() => set("fill", f.value)} className="tab-pill" data-active={cfg.fill === f.value}>
                {f.label}
              </button>
            ))}
          </div>
        </Control>

        {/* Colors */}
        <Control label="Warna utama">
          <SwatchRow values={SWATCHES} current={cfg.color} onPick={(v) => set("color", v)} onHex={(v) => set("color", v)} />
        </Control>
        <Control label="Warna aksen">
          <SwatchRow values={ACCENTS} current={cfg.accent} onPick={(v) => set("accent", v)} onHex={(v) => set("accent", v)} />
        </Control>

        {/* Pip toggle */}
        <label className="flex items-center justify-between caption cursor-pointer" style={{ maxWidth: 320 }}>
          <span style={{ color: "var(--shade-60)" }}>Tampilkan titik aksen (pip)</span>
          <input type="checkbox" checked={!!cfg.pip} onChange={(e) => set("pip", e.target.checked)} style={{ accentColor: "var(--iso-violet)" }} />
        </label>

        <div className="flex gap-2 flex-wrap">
          <button onClick={save} disabled={saving} className="pill pill-primary pill-sm">
            {saving ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} weight="bold" />} Simpan logo
          </button>
          <button onClick={reset} className="pill pill-outline-light pill-sm">
            <ArrowCounterClockwise size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ---- Live preview ---- */}
      <LogoPreview cfg={cfg} storeName={storeName} />
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow-cap mb-3">{label}</p>
      {children}
    </section>
  );
}

function SwatchRow({ values, current, onPick, onHex }: { values: string[]; current: string; onPick: (v: string) => void; onHex: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className="logo-swatch ums-tap"
          data-active={current.toLowerCase() === v.toLowerCase()}
          style={{ background: v }}
          aria-label={v}
        />
      ))}
      <input type="color" value={current} onChange={(e) => onHex(e.target.value)} className="logo-color-input" aria-label="Custom color" />
    </div>
  );
}

function LogoPreview({ cfg, storeName }: { cfg: LogoConfig; storeName: string }) {
  return (
    <div className="logo-preview-col">
      <div className="logo-preview-card">
        <p className="eyebrow-cap mb-4" style={{ color: "var(--shade-50)" }}>Live preview</p>
        {/* big mark */}
        <div className="logo-preview-hero">
          <LogoMark config={cfg} size={120} idSeed="hero" />
        </div>
        {/* lockup on light */}
        <div className="logo-lockup" style={{ background: "var(--canvas-light)" }}>
          <LogoMark config={cfg} size={32} idSeed="ll" />
          <span className="logo-wordmark" style={{ color: "var(--ink)" }}>{storeName}</span>
        </div>
        {/* lockup on dark */}
        <div className="logo-lockup" style={{ background: "var(--canvas-night)" }}>
          <LogoMark config={cfg} size={32} idSeed="ld" />
          <span className="logo-wordmark" style={{ color: "#fff" }}>{storeName}</span>
        </div>
        {/* favicon sizes */}
        <div className="flex items-center gap-3 mt-1">
          <LogoMark config={cfg} size={16} idSeed="f16" />
          <LogoMark config={cfg} size={24} idSeed="f24" />
          <LogoMark config={cfg} size={40} idSeed="f40" />
          <span className="micro" style={{ color: "var(--shade-50)" }}>Tetap tajam di ukuran kecil</span>
        </div>
      </div>
    </div>
  );
}
