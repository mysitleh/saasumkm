"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, X, QrCode, CheckCircle, Package, CircleNotch } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: { name: string } | null;
}
interface CartItem extends Product {
  quantity: number;
}
interface Tenant {
  id: string;
  name: string;
  slug: string;
  qrisImageUrl: string | null;
  qrisDynamicEnabled: boolean;
  themeColor: string;
}
interface Props {
  tenant: Tenant;
  products: Product[];
  categories: { id: string; name: string }[];
}
type Step = "catalog" | "cart" | "form" | "payment" | "success";

export default function StorefrontClient({ tenant, products, categories }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("catalog");
  const [selectedCat, setSelectedCat] = useState("all");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [dynamicQr, setDynamicQr] = useState<{ url: string; expiresAt: string | null } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ promoId: string; discount: number; label: string } | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerNote: "",
    deliveryType: "PICKUP",
    deliveryAddress: "",
  });

  const filtered = selectedCat === "all" ? products : products.filter((p) => p.category?.name === selectedCat);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const discount = promoResult?.discount ?? 0;
  const grandTotal = Math.max(0, cartTotal - discount);

  function addToCart(p: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => (i.id === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stock) } : i));
      return [...prev, { ...p, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0),
    );
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    const res = await fetch(`/api/store/${tenant.slug}/promo?code=${promoCode}&subtotal=${cartTotal}`);
    const data = await res.json();
    if (res.ok) setPromoResult(data);
    else alert(data.error || "Kode promo tidak valid.");
  }

  async function submitOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/${tenant.slug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          promoId: promoResult?.promoId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal membuat order.");
        return;
      }
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);

      if (tenant.qrisDynamicEnabled) {
        try {
          const payRes = await fetch(`/api/store/${tenant.slug}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId }),
          });
          const pay = await payRes.json();
          if (payRes.ok && pay.qrCodeUrl) {
            setDynamicQr({ url: pay.qrCodeUrl, expiresAt: pay.expiresAt ?? null });
          }
        } catch {
          // fallback ke statis
        }
      }
      setStep("payment");
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setCart([]);
    setStep("catalog");
    setPromoCode("");
    setPromoResult(null);
    setOrderId("");
    setOrderNumber("");
    setDynamicQr(null);
    setForm({ customerName: "", customerPhone: "", customerNote: "", deliveryType: "PICKUP", deliveryAddress: "" });
  }

  /* ===== CART STEP ===== */
  if (step === "cart")
    return (
      <Sheet onClose={() => setStep("catalog")} title={`Keranjang (${cartCount})`}>
        {cart.length === 0 ? (
          <Empty glyph={GLYPH.hexFilled} text="Keranjang kosong" />
        ) : (
          <div className="p-5 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3" style={{ background: "var(--canvas-cream)", padding: 12, borderRadius: 12 }}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--canvas-light)", display: "grid", placeItems: "center" }}>
                    <Package size={20} style={{ color: "var(--shade-40)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="body-md truncate">{item.name}</p>
                  <p className="caption tabular">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <QtyButton onClick={() => updateQty(item.id, -1)} aria="Kurangi"><Minus size={12} weight="bold" /></QtyButton>
                  <span className="caption tabular" style={{ minWidth: 22, textAlign: "center", fontWeight: 550 }}>{item.quantity}</span>
                  <QtyButton onClick={() => updateQty(item.id, 1)} aria="Tambah" accent><Plus size={12} weight="bold" /></QtyButton>
                  <button
                    onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
                    aria-label="Hapus"
                    style={{ marginLeft: 4, color: "var(--shade-40)" }}
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Kode promo"
                className="input flex-1"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <button onClick={applyPromo} className="pill pill-outline-light pill-sm">Pakai</button>
            </div>
            {promoResult && (
              <p className="caption" style={{ color: "var(--ink)" }}>
                <span className="glyph">{GLYPH.done}</span> {promoResult.label} — hemat {formatRupiah(promoResult.discount)}
              </p>
            )}
            <hr className="hairline mt-2" />
            <div className="space-y-1 caption tabular">
              <Row label="Subtotal" value={formatRupiah(cartTotal)} />
              {discount > 0 && <Row label="Diskon" value={`−${formatRupiah(discount)}`} muted />}
              <Row label="Total" value={formatRupiah(grandTotal)} bold />
            </div>
            <button onClick={() => setStep("form")} className="pill pill-primary w-full mt-3">
              Lanjut ke Checkout
            </button>
          </div>
        )}
      </Sheet>
    );

  /* ===== FORM STEP ===== */
  if (step === "form")
    return (
      <Sheet onClose={() => setStep("cart")} title="Detail Pesanan">
        <div className="p-5 space-y-4">
          <div>
            <label className="eyebrow-cap mb-2 block">Nama Pemesan *</label>
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="input"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="eyebrow-cap mb-2 block">No. HP</label>
            <input
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="input"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="eyebrow-cap mb-2 block">Tipe Pengiriman</label>
            <div className="grid grid-cols-2 gap-2">
              {(["PICKUP", "DELIVERY"] as const).map((type) => {
                const active = form.deliveryType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, deliveryType: type })}
                    className="pill pill-sm"
                    style={{
                      background: active ? "var(--ink)" : "var(--canvas-light)",
                      color: active ? "var(--on-primary)" : "var(--ink)",
                      border: active ? "1px solid var(--ink)" : "1px solid var(--hairline-light)",
                      width: "100%",
                    }}
                  >
                    <span className="glyph mr-1.5">{type === "PICKUP" ? GLYPH.hex : GLYPH.arrow}</span>
                    {type === "PICKUP" ? "Ambil di Toko" : "Diantar"}
                  </button>
                );
              })}
            </div>
          </div>
          {form.deliveryType === "DELIVERY" && (
            <div>
              <label className="eyebrow-cap mb-2 block">Alamat Pengiriman</label>
              <textarea
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                rows={3}
                className="input"
                style={{ resize: "vertical" }}
                placeholder="Alamat lengkap…"
              />
            </div>
          )}
          <div>
            <label className="eyebrow-cap mb-2 block">Catatan (opsional)</label>
            <textarea
              value={form.customerNote}
              onChange={(e) => setForm({ ...form, customerNote: e.target.value })}
              rows={2}
              className="input"
              style={{ resize: "vertical" }}
              placeholder="Catatan untuk penjual…"
            />
          </div>
          <div style={{ background: "var(--canvas-cream)", padding: 14, borderRadius: 12 }} className="space-y-1 caption tabular">
            <Row label={`Subtotal (${cartCount} item)`} value={formatRupiah(cartTotal)} muted />
            {discount > 0 && <Row label="Diskon" value={`−${formatRupiah(discount)}`} muted />}
            <Row label="Total Bayar" value={formatRupiah(grandTotal)} bold />
          </div>
          <button
            onClick={submitOrder}
            disabled={loading || !form.customerName}
            className="pill pill-primary w-full"
          >
            {loading && <CircleNotch size={16} className="animate-spin" />}
            {loading ? "Memproses…" : "Buat Pesanan"}
          </button>
        </div>
      </Sheet>
    );

  /* ===== PAYMENT STEP ===== */
  if (step === "payment") {
    const qrUrl = dynamicQr?.url ?? tenant.qrisImageUrl;
    return (
      <Sheet onClose={() => setStep("form")} title="Pembayaran">
        <div className="p-5 text-center">
          <p className="eyebrow-cap mb-1"><span className="glyph">{GLYPH.diamond}</span> QRIS</p>
          <h2 className="display-md mb-1" style={{ fontSize: 26 }}>Bayar via QRIS</h2>
          <p className="caption tabular mb-2" style={{ color: "var(--shade-50)" }}>
            Order {orderNumber} {dynamicQr ? "(dinamis)" : ""}
          </p>
          <p className="display-md tabular mb-6" style={{ fontSize: 36 }}>{formatRupiah(grandTotal)}</p>
          {qrUrl ? (
            <div style={{ background: "var(--canvas-cream)", padding: 16, borderRadius: 12, display: "inline-block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QRIS" style={{ width: 224, height: 224, objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ background: "var(--canvas-cream)", padding: 32, borderRadius: 12, color: "var(--shade-50)" }}>
              <QrCode size={64} style={{ margin: "0 auto 8px" }} />
              <p className="caption">QRIS belum diatur oleh toko</p>
            </div>
          )}
          <div className="card-pistachio-band mt-6 text-left" style={{ padding: 16 }}>
            <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.therefore}</span> Cara bayar</p>
            <ol className="caption space-y-1.5" style={{ paddingLeft: 18 }}>
              <li>Scan QR di atas dengan e-wallet / m-banking</li>
              <li>Masukkan nominal: <span className="body-strong tabular">{formatRupiah(grandTotal)}</span></li>
              <li>Konfirmasi pembayaran</li>
              <li>{dynamicQr ? "Status order otomatis terupdate." : "Tunjukkan bukti bayar ke kasir."}</li>
            </ol>
          </div>
          <button onClick={() => setStep("success")} className="pill pill-primary w-full mt-6">
            Selesai
          </button>
          <p className="micro tabular mt-3" style={{ color: "var(--shade-50)" }}>Order ID: {orderId.slice(0, 8)}…</p>
        </div>
      </Sheet>
    );
  }

  /* ===== SUCCESS STEP ===== */
  if (step === "success")
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.55)" }}>
        <div className="card text-center" style={{ padding: 32, maxWidth: 360, width: "100%" }}>
          <CheckCircle size={56} weight="fill" style={{ color: "var(--ink)", margin: "0 auto 16px" }} />
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.endMark}</span> Diterima</p>
          <h2 className="display-md mb-3" style={{ fontSize: 28 }}>Pesanan diterima.</h2>
          <p className="caption mb-1" style={{ color: "var(--shade-50)" }}>Nomor pesanan</p>
          <p className="heading-md tabular mb-4">{orderNumber}</p>
          <p className="caption mb-6" style={{ color: "var(--shade-50)" }}>
            Terima kasih sudah berbelanja di <span style={{ color: "var(--ink)" }}>{tenant.name}</span>.
          </p>
          <button onClick={resetAll} className="pill pill-primary w-full">Belanja lagi</button>
        </div>
      </div>
    );

  /* ===== CATALOG ===== */
  return (
    <>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <CategoryPill label="Semua" active={selectedCat === "all"} onClick={() => setSelectedCat("all")} />
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              label={cat.name}
              active={selectedCat === cat.name}
              onClick={() => setSelectedCat(cat.name)}
            />
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <Empty glyph={GLYPH.hex} text="Belum ada produk tersedia" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="card-flat"
              style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: 144, objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: 144, background: "var(--canvas-cream)", display: "grid", placeItems: "center" }}>
                  <Package size={40} style={{ color: "var(--shade-30)" }} />
                </div>
              )}
              <div className="p-3 flex-1 flex flex-col">
                <p className="body-md line-clamp-2 mb-1">{product.name}</p>
                {product.category && <p className="micro" style={{ color: "var(--shade-50)" }}>{product.category.name}</p>}
                <div className="flex items-end justify-between gap-2 mt-auto pt-2">
                  <div className="min-w-0">
                    <p className="body-strong tabular" style={{ lineHeight: 1.2 }}>{formatRupiah(product.price)}</p>
                    <p className="micro tabular" style={{ color: "var(--shade-50)" }}>Stok: {product.stock}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="store-add-btn ums-tap"
                    aria-label={`Tambah ${product.name}`}
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
          <button onClick={() => setStep("cart")} className="pill pill-primary" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <ShoppingCart size={18} />
            <span className="body-strong">{cartCount} item</span>
            <span className="caption tabular" style={{ background: "rgba(255,255,255,0.18)", padding: "2px 10px", borderRadius: 9999 }}>
              {formatRupiah(cartTotal)}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

/* ============================================================
   Small helpers
   ============================================================ */
function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div
        className="w-full max-w-2xl mx-auto"
        style={{
          background: "var(--canvas-light)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <div className="sticky top-0 px-5 py-4 flex items-center justify-between" style={{ background: "var(--canvas-light)", borderBottom: "1px solid var(--hairline-light)" }}>
          <h2 className="heading-md">{title}</h2>
          <button onClick={onClose} aria-label="Tutup">
            <X size={18} weight="bold" style={{ color: "var(--shade-50)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({ glyph, text }: { glyph: string; text: string }) {
  return (
    <div className="py-16 text-center body-md" style={{ color: "var(--shade-50)" }}>
      <span className="glyph block mb-3" style={{ fontSize: 32, color: "var(--shade-30)" }}>{glyph}</span>
      {text}
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between" style={{ color: muted ? "var(--shade-60)" : "var(--ink)", fontWeight: bold ? 550 : 420, fontSize: bold ? 16 : 14 }}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

function QtyButton({ children, onClick, aria, accent }: { children: React.ReactNode; onClick: () => void; aria: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        width: 26, height: 26, borderRadius: 9999, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: accent ? "var(--aloe-10)" : "var(--canvas-cream)",
        color: "var(--ink)",
        border: "1px solid var(--hairline-light)",
      }}
    >
      {children}
    </button>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0"
      style={{
        padding: "6px 14px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        background: active ? "var(--ink)" : "var(--canvas-light)",
        color: active ? "var(--on-primary)" : "var(--ink)",
        border: active ? "1px solid var(--ink)" : "1px solid var(--hairline-light)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
