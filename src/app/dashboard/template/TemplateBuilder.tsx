"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Eye, Check, Image as ImgIcon, Star, Heart, ShoppingCart, MagnifyingGlass } from "@phosphor-icons/react";
import {
  type TemplateConfig,
  type LayoutTemplate,
  type ButtonStyle,
  type IconStyle,
  type CategoryStyle,
  LAYOUT_TEMPLATES,
  BUTTON_STYLES,
  ICON_STYLES,
  CATEGORY_STYLES,
  buttonRadius,
} from "@/lib/template-runtime";
import { type TenantTheme, contrastOnColor, themeToCssVars } from "@/lib/theme-runtime";
import { GLYPH } from "@/lib/glyphs";
import ImageUploader from "@/components/ImageUploader";

interface ProductLite { id: string; name: string; price: number; imageUrl: string | null; stock: number }
interface Tenant { slug: string; name: string; logoUrl: string | null }

interface Props {
  tenant: Tenant;
  products: ProductLite[];
  initialTemplate: TemplateConfig;
  theme: TenantTheme;
}

export default function TemplateBuilder({ tenant, products, initialTemplate, theme }: Props) {
  const router = useRouter();
  const [tpl, setTpl] = useState<TemplateConfig>(initialTemplate);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) {
    setTpl((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function toggleCarouselProduct(id: string) {
    setTpl((p) => {
      const set = new Set(p.carouselProductIds);
      if (set.has(id)) set.delete(id);
      else if (set.size < 12) set.add(id);
      return { ...p, carouselProductIds: Array.from(set) };
    });
    setSaved(false);
  }

  async function save() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/dashboard/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tpl),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
      <div className="space-y-5 min-w-0">
        {error && <div className="alert"><span className="glyph mr-2">{GLYPH.reference}</span>{error}</div>}
        {saved && (
          <div className="alert" style={{ background: "var(--aloe-10)", borderColor: "var(--aloe-10)" }}>
            <span className="glyph mr-2">{GLYPH.done}</span>Template tersimpan. Storefront sudah update.
          </div>
        )}

        <LayoutPicker value={tpl.layoutTemplate} onChange={(v) => update("layoutTemplate", v)} />
        <ButtonPicker value={tpl.buttonStyle} onChange={(v) => update("buttonStyle", v)} theme={theme} />
        <IconPicker value={tpl.iconStyle} onChange={(v) => update("iconStyle", v)} />
        <CategoryPicker value={tpl.categoryStyle} onChange={(v) => update("categoryStyle", v)} />
        <HeroEditor tpl={tpl} update={update} />
        <CarouselEditor
          tpl={tpl}
          products={products}
          onToggle={toggleCarouselProduct}
          onCarouselToggle={(v) => update("carouselEnabled", v)}
        />

        <div className="flex gap-2 flex-wrap">
          <button onClick={save} disabled={pending} className="pill pill-primary">
            {pending ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
            {pending ? "Menyimpan…" : "Simpan template"}
          </button>
          <a href={`/store/${tenant.slug}`} target="_blank" rel="noreferrer" className="pill pill-outline-light">
            <Eye size={16} /> Lihat live storefront
          </a>
        </div>
      </div>

      <LivePreview tenant={tenant} products={products} tpl={tpl} theme={theme} />
    </div>
  );
}

/* ============================================================
   LAYOUT PICKER
   ============================================================ */
function LayoutPicker({ value, onChange }: { value: LayoutTemplate; onChange: (v: LayoutTemplate) => void }) {
  return (
    <section className="card">
      <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.hexFilled}</span> Layout</p>
      <div className="grid grid-cols-2 gap-2">
        {LAYOUT_TEMPLATES.map((l) => {
          const active = value === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange(l.value)}
              className="card-flat text-left"
              style={{
                padding: 14,
                border: active ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
              }}
            >
              <p className="body-md mb-1" style={{ fontWeight: 550 }}>
                {active && <span className="glyph mr-1.5">{GLYPH.done}</span>}
                {l.label}
              </p>
              <p className="micro" style={{ color: "var(--shade-60)", lineHeight: 1.4 }}>{l.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   BUTTON PICKER
   ============================================================ */
function ButtonPicker({ value, onChange, theme }: { value: ButtonStyle; onChange: (v: ButtonStyle) => void; theme: TenantTheme }) {
  return (
    <section className="card">
      <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.diamond}</span> Style Button</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BUTTON_STYLES.map((b) => {
          const active = value === b.value;
          const r = buttonRadius(b.value, theme.radius);
          const isGhost = b.value === "ghost";
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange(b.value)}
              className="card-flat text-left"
              style={{
                padding: 12,
                border: active ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 12px",
                  background: isGhost ? "transparent" : theme.primary,
                  color: isGhost ? theme.primary : contrastOnColor(theme.primary),
                  border: isGhost ? `1.5px solid ${theme.primary}` : "none",
                  borderRadius: r,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {b.label}
              </span>
              <span className="micro tabular" style={{ color: "var(--shade-60)" }}>
                {active && "✓ "}{b.label} ({r === 9999 ? "pill" : `${r}px`})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   ICON PICKER
   ============================================================ */
function IconPicker({ value, onChange }: { value: IconStyle; onChange: (v: IconStyle) => void }) {
  const sample = [Star, Heart, ShoppingCart, MagnifyingGlass];
  return (
    <section className="card">
      <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.lozenge}</span> Style Icon</p>
      <div className="grid grid-cols-5 gap-2">
        {ICON_STYLES.map((i) => {
          const active = value === i.value;
          return (
            <button
              key={i.value}
              type="button"
              onClick={() => onChange(i.value)}
              className="card-flat"
              style={{
                padding: 10,
                border: active ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <div className="flex gap-1">
                {sample.map((Icon, idx) => (
                  <Icon key={idx} size={16} weight={i.weight} />
                ))}
              </div>
              <span className="micro tabular" style={{ color: active ? "var(--ink)" : "var(--shade-60)" }}>
                {active && "✓ "}{i.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   CATEGORY PICKER
   ============================================================ */
function CategoryPicker({ value, onChange }: { value: CategoryStyle; onChange: (v: CategoryStyle) => void }) {
  return (
    <section className="card">
      <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.hex}</span> Style Kategori</p>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORY_STYLES.map((c) => {
          const active = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className="card-flat text-left"
              style={{
                padding: 12,
                border: active ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
              }}
            >
              <p className="body-md mb-1" style={{ fontWeight: 550 }}>
                {active && <span className="glyph mr-1.5">{GLYPH.done}</span>}
                {c.label}
              </p>
              <p className="micro" style={{ color: "var(--shade-60)", lineHeight: 1.4 }}>{c.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   HERO EDITOR
   ============================================================ */
function HeroEditor({
  tpl,
  update,
}: {
  tpl: TemplateConfig;
  update: <K extends keyof TemplateConfig>(k: K, v: TemplateConfig[K]) => void;
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow-cap"><span className="glyph">{GLYPH.sparkle}</span> Hero Section</p>
        <label className="flex items-center gap-2 caption cursor-pointer">
          <input
            type="checkbox"
            checked={tpl.heroEnabled}
            onChange={(e) => update("heroEnabled", e.target.checked)}
            style={{ accentColor: "var(--ink)" }}
          />
          {tpl.heroEnabled ? "Aktif" : "Nonaktif"}
        </label>
      </div>

      {tpl.heroEnabled && (
        <div className="space-y-3">
          <ImageUploader
            label="Gambar hero (recommended 1600×600)"
            value={tpl.heroImageUrl ?? ""}
            onChange={(url) => update("heroImageUrl", url || null)}
            helper="JPG/PNG, ratio 16:6 ideal. Kosong = hero pakai brand color saja."
          />
          <Field
            label="Headline"
            value={tpl.heroHeadline ?? ""}
            onChange={(v) => update("heroHeadline", v || null)}
            placeholder="Mis. Diskon Spesial Akhir Pekan"
            max={120}
          />
          <Field
            label="Sub-headline"
            value={tpl.heroSubheadline ?? ""}
            onChange={(v) => update("heroSubheadline", v || null)}
            placeholder="Mis. Hemat 30% untuk semua menu kopi sampai Minggu."
            max={240}
            multiline
          />
          <Field
            label="Label tombol CTA"
            value={tpl.heroCtaLabel ?? ""}
            onChange={(v) => update("heroCtaLabel", v || null)}
            placeholder="Mis. Belanja Sekarang"
            max={40}
          />
        </div>
      )}
    </section>
  );
}

/* ============================================================
   CAROUSEL EDITOR
   ============================================================ */
function CarouselEditor({
  tpl,
  products,
  onToggle,
  onCarouselToggle,
}: {
  tpl: TemplateConfig;
  products: ProductLite[];
  onToggle: (id: string) => void;
  onCarouselToggle: (v: boolean) => void;
}) {
  const selectedSet = new Set(tpl.carouselProductIds);
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="eyebrow-cap"><span className="glyph">{GLYPH.asterism}</span> Carousel Pilihan</p>
        <label className="flex items-center gap-2 caption cursor-pointer">
          <input
            type="checkbox"
            checked={tpl.carouselEnabled}
            onChange={(e) => onCarouselToggle(e.target.checked)}
            style={{ accentColor: "var(--ink)" }}
          />
          {tpl.carouselEnabled ? "Aktif" : "Nonaktif"}
        </label>
      </div>

      {tpl.carouselEnabled && (
        <>
          <p className="caption mb-3" style={{ color: "var(--shade-60)" }}>
            Pilih maksimal 12 produk yang akan tampil di carousel teratas storefront.
            Saat ini terpilih: <span className="tabular" style={{ color: "var(--ink)", fontWeight: 550 }}>{selectedSet.size}/12</span>
          </p>
          {products.length === 0 ? (
            <p className="empty-state">Tambahkan produk dulu untuk mengaktifkan carousel.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto" style={{ paddingRight: 4 }}>
              {products.map((p) => {
                const sel = selectedSet.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onToggle(p.id)}
                    disabled={!sel && selectedSet.size >= 12}
                    className="card-flat text-left"
                    style={{
                      padding: 8,
                      border: sel ? "2px solid var(--ink)" : "1px solid var(--hairline-light)",
                      opacity: !sel && selectedSet.size >= 12 ? 0.45 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : "var(--canvas-cream)",
                        borderRadius: 8,
                        marginBottom: 6,
                        position: "relative",
                      }}
                    >
                      {!p.imageUrl && (
                        <div className="absolute inset-0 grid place-items-center" style={{ color: "var(--shade-40)" }}>
                          <ImgIcon size={20} />
                        </div>
                      )}
                      {sel && (
                        <span
                          style={{
                            position: "absolute", top: 6, right: 6,
                            background: "var(--ink)", color: "var(--on-primary)",
                            width: 20, height: 20, borderRadius: 9999,
                            display: "grid", placeItems: "center", fontSize: 10,
                          }}
                        >✓</span>
                      )}
                    </div>
                    <p className="micro tabular truncate" style={{ color: "var(--ink)" }}>{p.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ============================================================
   FIELD (small reusable text input)
   ============================================================ */
function Field({
  label,
  value,
  onChange,
  placeholder,
  max,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="micro tabular block mb-1" style={{ color: "var(--shade-60)" }}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={max}
          rows={2}
          className="input"
          style={{ resize: "vertical", minHeight: 60 }}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={max}
          className="input"
          placeholder={placeholder}
        />
      )}
      {max && (
        <p className="micro tabular text-right mt-1" style={{ color: "var(--shade-50)" }}>
          {value.length}/{max}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   LIVE PREVIEW
   ============================================================ */
function LivePreview({
  tenant,
  products,
  tpl,
  theme,
}: {
  tenant: Tenant;
  products: ProductLite[];
  tpl: TemplateConfig;
  theme: TenantTheme;
}) {
  const onPrimary = contrastOnColor(theme.primary);
  const isDark = theme.mode === "dark";
  const bg = isDark ? "#0a0a0a" : theme.surface;
  const ink = isDark ? "#ffffff" : theme.ink;
  const cardBg = isDark ? "#1a1a1a" : "#ffffff";
  const cardBorder = isDark ? "#2a2a2a" : "rgba(0,0,0,0.06)";
  const r = buttonRadius(tpl.buttonStyle, theme.radius);
  const isGhost = tpl.buttonStyle === "ghost";
  const carouselProducts = tpl.carouselEnabled
    ? products.filter((p) => tpl.carouselProductIds.includes(p.id)).slice(0, 12)
    : [];
  const gridProducts = products.slice(0, 4);

  return (
    <div className="min-w-0">
      <p className="eyebrow-cap mb-3"><span className="glyph">{GLYPH.circle}</span> Live preview</p>
      <div
        aria-label="Preview storefront"
        style={{
          ...themeToCssVars(theme),
          background: bg,
          color: ink,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--hairline-light)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          fontFamily: `"${theme.font}", "Inter", system-ui, sans-serif`,
          position: "sticky",
          top: 76,
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${isDark ? "#222" : "rgba(0,0,0,0.08)"}`,
            background: bg,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <div className="flex items-center gap-2">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: theme.radius / 2 }} />
            ) : (
              <div
                style={{
                  width: 32, height: 32, background: theme.primary, color: onPrimary,
                  borderRadius: theme.radius / 2,
                  display: "grid", placeItems: "center",
                  fontWeight: 700, fontSize: 13,
                }}
              >{tenant.name.charAt(0)}</div>
            )}
            <p style={{ fontSize: 14, fontWeight: 600 }}>{tenant.name}</p>
            <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>{tpl.layoutTemplate.toUpperCase()}</span>
          </div>
        </div>

        {/* HERO */}
        {tpl.heroEnabled && tpl.layoutTemplate !== "minimal" && (
          <div
            style={{
              minHeight: tpl.layoutTemplate === "showcase" ? 220 : 160,
              background: tpl.heroImageUrl
                ? `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45)), url(${tpl.heroImageUrl}) center/cover`
                : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              color: tpl.heroImageUrl ? "#fff" : onPrimary,
              padding: tpl.layoutTemplate === "magazine" ? "32px 20px" : "24px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <p style={{
              fontSize: tpl.layoutTemplate === "showcase" ? 22 : 18,
              fontWeight: tpl.layoutTemplate === "magazine" ? 400 : 700,
              lineHeight: 1.15,
              letterSpacing: tpl.layoutTemplate === "magazine" ? "-0.01em" : 0,
              marginBottom: 6,
            }}>
              {tpl.heroHeadline || `Selamat datang di ${tenant.name}`}
            </p>
            {tpl.heroSubheadline && (
              <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 12, maxWidth: 320, lineHeight: 1.4 }}>
                {tpl.heroSubheadline}
              </p>
            )}
            <button
              style={{
                alignSelf: "flex-start",
                padding: "8px 14px",
                background: isGhost ? "transparent" : theme.primary,
                color: isGhost ? "#fff" : onPrimary,
                border: isGhost ? `1.5px solid #fff` : "none",
                borderRadius: r,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {tpl.heroCtaLabel || "Belanja Sekarang"}
            </button>
          </div>
        )}

        {/* CATEGORIES */}
        <div style={{ padding: "12px 16px 0" }}>
          <CategoryPreview style={tpl.categoryStyle} primary={theme.primary} onPrimary={onPrimary} radius={r} />
        </div>

        {/* CAROUSEL */}
        {tpl.carouselEnabled && carouselProducts.length > 0 && (
          <div style={{ padding: "12px 0 0" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", padding: "0 16px 8px", opacity: 0.7 }}>
              ✦ Pilihan Anda
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                padding: "0 16px 12px",
                scrollSnapType: "x mandatory",
              }}
            >
              {carouselProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    flex: "0 0 auto",
                    width: 120,
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: theme.radius,
                    padding: 8,
                    scrollSnapAlign: "start",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      background: p.imageUrl
                        ? `url(${p.imageUrl}) center/cover`
                        : `linear-gradient(135deg, ${theme.primary}33, ${theme.accent}33)`,
                      borderRadius: theme.radius - 4,
                      marginBottom: 6,
                    }}
                  />
                  <p style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, marginBottom: 2 }}>
                    {p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: theme.primary }}>
                    Rp {p.price.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        <div
          style={{
            padding: 16,
            display: "grid",
            gridTemplateColumns: tpl.layoutTemplate === "showcase" ? "1fr" : "1fr 1fr",
            gap: 10,
          }}
        >
          {gridProducts.map((p) => (
            <div
              key={p.id}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: theme.radius,
                padding: tpl.layoutTemplate === "showcase" ? 14 : 10,
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: tpl.layoutTemplate === "showcase" ? "16 / 9" : "1 / 1",
                  background: p.imageUrl
                    ? `url(${p.imageUrl}) center/cover`
                    : `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`,
                  borderRadius: theme.radius - 4,
                  marginBottom: 8,
                }}
              />
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, lineHeight: 1.2 }}>{p.name}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>
                Rp {p.price.toLocaleString("id-ID")}
              </p>
              <button
                style={{
                  width: "100%", padding: "8px 12px",
                  background: isGhost ? "transparent" : theme.primary,
                  color: isGhost ? theme.primary : onPrimary,
                  border: isGhost ? `1.5px solid ${theme.primary}` : "none",
                  borderRadius: r,
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                + Tambah
              </button>
            </div>
          ))}
          {gridProducts.length === 0 && (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 13, opacity: 0.5, padding: 24 }}>
              Belum ada produk untuk preview.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CATEGORY VARIANTS (preview helpers)
   ============================================================ */
function CategoryPreview({
  style, primary, onPrimary, radius,
}: {
  style: CategoryStyle; primary: string; onPrimary: string; radius: number;
}) {
  const cats = ["Kopi", "Non-Kopi", "Makanan", "Dessert"];

  if (style === "chips") {
    return (
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {cats.map((c, i) => (
          <span
            key={c}
            style={{
              padding: "6px 12px",
              background: i === 0 ? primary : "rgba(0,0,0,0.05)",
              color: i === 0 ? onPrimary : "currentColor",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >{c}</span>
        ))}
      </div>
    );
  }
  if (style === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {cats.map((c, i) => (
          <div
            key={c}
            style={{
              padding: "10px 4px",
              textAlign: "center",
              background: i === 0 ? `${primary}15` : "rgba(0,0,0,0.04)",
              border: i === 0 ? `1.5px solid ${primary}` : "1px solid rgba(0,0,0,0.06)",
              borderRadius: radius / 2,
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            <div style={{ fontSize: 14, marginBottom: 2 }}>◈</div>
            {c}
          </div>
        ))}
      </div>
    );
  }
  if (style === "tabs") {
    return (
      <div style={{ display: "flex", gap: 16, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {cats.map((c, i) => (
          <span
            key={c}
            style={{
              padding: "8px 0",
              borderBottom: i === 0 ? `2px solid ${primary}` : "2px solid transparent",
              color: i === 0 ? primary : "currentColor",
              fontSize: 12,
              fontWeight: 600,
            }}
          >{c}</span>
        ))}
      </div>
    );
  }
  // sidebar
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {cats.map((c, i) => (
        <span
          key={c}
          style={{
            padding: "6px 10px",
            background: i === 0 ? `${primary}15` : "transparent",
            borderLeft: i === 0 ? `3px solid ${primary}` : "3px solid transparent",
            fontSize: 11,
            fontWeight: i === 0 ? 600 : 500,
          }}
        >{c}</span>
      ))}
    </div>
  );
}
