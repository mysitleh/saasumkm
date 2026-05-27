"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, ArrowCounterClockwise, Eye, Check } from "@phosphor-icons/react";
import {
  type TenantTheme,
  type ThemeMode,
  contrastOnColor,
  themeToCssVars,
  RADIUS_PRESETS,
  FONT_OPTIONS,
  isValidHex,
} from "@/lib/theme-runtime";
import { GLYPH } from "@/lib/glyphs";

interface Props {
  tenant: { slug: string; name: string; logoUrl: string | null };
  initialTheme: TenantTheme;
}

const SWATCH_PRESETS: Array<{ name: string; primary: string; accent: string }> = [
  { name: "Emerald",   primary: "#10b981", accent: "#34d399" },
  { name: "Indigo",    primary: "#4f46e5", accent: "#818cf8" },
  { name: "Coral",     primary: "#f43f5e", accent: "#fb7185" },
  { name: "Amber",     primary: "#d97706", accent: "#fbbf24" },
  { name: "Sky",       primary: "#0284c7", accent: "#38bdf8" },
  { name: "Plum",      primary: "#7c3aed", accent: "#a78bfa" },
  { name: "Mocha",     primary: "#78350f", accent: "#a16207" },
  { name: "Charcoal",  primary: "#0a0a0a", accent: "#525252" },
];

export default function ThemeBuilder({ tenant, initialTheme }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState<TenantTheme>(initialTheme);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function update<K extends keyof TenantTheme>(key: K, value: TenantTheme[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setError("");
    setSaved(false);
    const fields = ["primary", "accent", "surface", "ink"] as const;
    for (const f of fields) {
      if (!isValidHex(theme[f])) {
        setError(`Hex tidak valid untuk ${f}: ${theme[f]}`);
        return;
      }
    }
    startTransition(async () => {
      const res = await fetch("/api/dashboard/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeMode: theme.mode,
          themePrimary: theme.primary,
          themeAccent: theme.accent,
          themeSurface: theme.surface,
          themeInk: theme.ink,
          themeRadius: theme.radius,
          themeFont: theme.font,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan tema.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  async function reset() {
    if (!confirm("Reset tema ke default?")) return;
    startTransition(async () => {
      const res = await fetch("/api/dashboard/theme", { method: "DELETE" });
      if (res.ok) {
        setTheme({
          mode: "light",
          primary: "#10b981",
          accent: "#34d399",
          surface: "#fbfbf5",
          ink: "#0a0a0a",
          radius: 12,
          font: "Inter",
        });
        router.refresh();
      }
    });
  }

  const previewBg = theme.mode === "dark" ? "#0a0a0a" : theme.surface;
  const previewInk = theme.mode === "dark" ? "#ffffff" : theme.ink;

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
      {/* --------------- Form --------------- */}
      <div className="space-y-5 min-w-0">
        {error && (
          <div className="alert" role="alert">
            <span className="glyph mr-2">{GLYPH.reference}</span>{error}
          </div>
        )}
        {saved && (
          <div className="alert" style={{ background: "var(--aloe-10)", borderColor: "var(--aloe-10)" }}>
            <span className="glyph mr-2">{GLYPH.done}</span>Tema tersimpan. Storefront sudah update.
          </div>
        )}

        <Section title="Mode" glyph={GLYPH.circle}>
          <div className="flex gap-2 flex-wrap">
            {(["light", "dark", "auto"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update("mode", m)}
                className="pill pill-sm"
                style={{
                  background: theme.mode === m ? "var(--ink)" : "var(--canvas-light)",
                  color: theme.mode === m ? "var(--on-primary)" : "var(--ink)",
                  border: theme.mode === m ? "1px solid var(--ink)" : "1px solid var(--hairline-light)",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Preset palet" glyph={GLYPH.diamond}>
          <div className="grid grid-cols-4 gap-2">
            {SWATCH_PRESETS.map((p) => {
              const active = theme.primary.toLowerCase() === p.primary.toLowerCase();
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    update("primary", p.primary);
                    update("accent", p.accent);
                  }}
                  className="card-flat flex flex-col items-stretch gap-2 text-left"
                  style={{
                    padding: 10,
                    border: active ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
                  }}
                >
                  <div className="flex gap-1 h-7">
                    <span style={{ flex: 1, background: p.primary, borderRadius: 4 }} />
                    <span style={{ flex: 1, background: p.accent, borderRadius: 4 }} />
                  </div>
                  <span className="micro tabular" style={{ color: "var(--ink)" }}>
                    {active ? "✓ " : ""}{p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Warna kustom" glyph={GLYPH.sparkle}>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Primary (CTA)" value={theme.primary} onChange={(v) => update("primary", v)} />
            <ColorField label="Accent" value={theme.accent} onChange={(v) => update("accent", v)} />
            <ColorField label="Surface (BG)" value={theme.surface} onChange={(v) => update("surface", v)} />
            <ColorField label="Ink (Text)" value={theme.ink} onChange={(v) => update("ink", v)} />
          </div>
        </Section>

        <Section title="Font" glyph={GLYPH.section}>
          <select
            value={theme.font}
            onChange={(e) => update("font", e.target.value)}
            className="input"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: `"${f.value}", sans-serif` }}>
                {f.label}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Rounded corner" glyph={GLYPH.hex}>
          <div className="flex gap-2 flex-wrap">
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => update("radius", r.value)}
                className="pill pill-sm"
                style={{
                  background: theme.radius === r.value ? "var(--ink)" : "var(--canvas-light)",
                  color: theme.radius === r.value ? "var(--on-primary)" : "var(--ink)",
                  border: theme.radius === r.value ? "1px solid var(--ink)" : "1px solid var(--hairline-light)",
                  borderRadius: r.value === 0 ? 4 : r.value,
                }}
                title={`${r.value}px`}
              >
                {r.label} <span className="micro tabular" style={{ marginLeft: 6, opacity: 0.7 }}>{r.value}px</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={32}
              value={theme.radius}
              onChange={(e) => update("radius", Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--ink)" }}
            />
            <p className="micro tabular text-right" style={{ color: "var(--shade-50)" }}>{theme.radius}px</p>
          </div>
        </Section>

        <div className="flex gap-2 flex-wrap">
          <button onClick={save} disabled={pending} className="pill pill-primary">
            {pending ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
            {pending ? "Menyimpan…" : "Simpan tema"}
          </button>
          <button onClick={reset} disabled={pending} className="pill pill-outline-light">
            <ArrowCounterClockwise size={16} /> Reset default
          </button>
          <a
            href={`/store/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="pill pill-ghost"
            style={{ border: "1px solid var(--hairline-light)" }}
          >
            <Eye size={16} /> Lihat live storefront
          </a>
        </div>
      </div>

      {/* --------------- Live Preview --------------- */}
      <div className="min-w-0">
        <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.circle}</span> Live preview</p>
        <div
          aria-label="Preview storefront tenant"
          style={{
            ...themeToCssVars(theme),
            background: previewBg,
            color: previewInk,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--hairline-light)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            fontFamily: `"${theme.font}", "Inter", system-ui, sans-serif`,
            position: "sticky",
            top: 76,
          }}
        >
          {/* Storefront header mock */}
          <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${theme.mode === "dark" ? "#222" : "rgba(0,0,0,0.08)"}` }}>
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: theme.radius / 2 }}
                />
              ) : (
                <div
                  style={{
                    width: 44, height: 44,
                    background: theme.primary,
                    color: contrastOnColor(theme.primary),
                    borderRadius: theme.radius / 2,
                    display: "grid", placeItems: "center",
                    fontWeight: 700, fontSize: 18,
                  }}
                >
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>{tenant.name}</p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>/{tenant.slug}</p>
              </div>
            </div>
          </div>

          {/* Product grid mock */}
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { name: "Kopi Susu Aren", price: "Rp 25.000" },
              { name: "Croissant Butter", price: "Rp 22.000" },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  background: theme.mode === "dark" ? "#1a1a1a" : "#ffffff",
                  borderRadius: theme.radius,
                  padding: 12,
                  border: `1px solid ${theme.mode === "dark" ? "#2a2a2a" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    background: `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`,
                    borderRadius: theme.radius - 4,
                    marginBottom: 10,
                  }}
                />
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>{p.price}</p>
                <button
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: theme.primary,
                    color: contrastOnColor(theme.primary),
                    borderRadius: theme.radius * 99, // pill
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Tambah
                </button>
              </div>
            ))}
          </div>

          {/* CTA mock */}
          <div style={{ padding: "12px 16px 20px" }}>
            <button
              style={{
                width: "100%",
                padding: "12px 24px",
                background: theme.primary,
                color: contrastOnColor(theme.primary),
                borderRadius: theme.radius * 99,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Lanjut ke checkout
            </button>
            <p style={{ fontSize: 11, opacity: 0.6, textAlign: "center", marginTop: 8 }}>
              <span style={{ color: theme.accent }}>●</span> {theme.font} · {theme.radius}px radius · {theme.mode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Section({ title, glyph, children }: { title: string; glyph: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <p className="eyebrow-cap mb-3"><span className="glyph">{glyph}</span> {title}</p>
      {children}
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = isValidHex(value);
  return (
    <div>
      <label className="micro tabular block mb-1" style={{ color: "var(--shade-60)" }}>{label}</label>
      <div className="flex items-stretch gap-0">
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: 44,
            height: 44,
            background: valid ? value : "transparent",
            border: "1px solid var(--hairline-light)",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <input
            type="color"
            value={valid ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            aria-label={`Pilih warna ${label}`}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          style={{
            borderRadius: "0 8px 8px 0",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            borderColor: valid ? "var(--hairline-light)" : "#e11d48",
          }}
          placeholder="#10b981"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
