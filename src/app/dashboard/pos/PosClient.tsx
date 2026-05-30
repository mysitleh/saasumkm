"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Trash, CheckCircle, CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { GLYPH } from "@/lib/glyphs";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  products: Product[];
  categories: string[];
  tenantSlug: string;
  tenantName: string;
}

export default function PosClient({ products, categories, tenantSlug, tenantName }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [customerName, setCustomerName] = useState("Walk-in");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === "all" || p.category === selectedCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(p: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id);
      if (ex) return prev.map((i) => (i.product.id === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stock) } : i));
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0),
    );
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    setLoading(true);
    setSuccess(null);
    try {
      const res = await fetch(`/api/store/${tenantSlug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          deliveryType: "PICKUP",
          items: cart.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.orderNumber);
        setCart([]);
        setCustomerName("Walk-in");
      } else {
        alert(data.error || "Gagal membuat order.");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
        <div className="card text-center ums-fade" style={{ padding: 40, maxWidth: 380, width: "100%" }}>
          <CheckCircle size={64} weight="fill" style={{ color: "var(--ink)", margin: "0 auto 16px" }} />
          <p className="eyebrow-cap mb-2"><span className="glyph">{GLYPH.endMark}</span> Berhasil</p>
          <h2 className="display-md mb-3" style={{ fontSize: 28 }}>Order Berhasil!</h2>
          <p className="heading-md tabular mb-2" style={{ color: "var(--ink)" }}>{success}</p>
          <p className="caption tabular mb-6" style={{ color: "var(--shade-50)" }}>Total: {formatRupiah(total)}</p>
          <button onClick={() => setSuccess(null)} className="pill pill-primary w-full">
            Order Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row" style={{ background: "var(--canvas-cream)" }}>
      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3" style={{ background: "var(--canvas-light)", borderBottom: "1px solid var(--hairline-light)", padding: "12px 16px" }}>
          <Link href="/dashboard" className="ums-tap" style={{ color: "var(--shade-50)" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="heading-md" style={{ color: "var(--ink)" }}>POS — {tenantName}</h1>
          <div className="ml-auto" style={{ maxWidth: 200 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="input"
              style={{ minHeight: 36, fontSize: 13, padding: "6px 12px", borderRadius: 9999 }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="tab-strip" style={{ padding: "8px 16px", background: "var(--canvas-light)", borderBottom: "1px solid var(--hairline-light)" }}>
          <button onClick={() => setSelectedCat("all")} className="tab-pill" data-active={selectedCat === "all"}>Semua</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCat(cat)} className="tab-pill" data-active={selectedCat === cat}>{cat}</button>
          ))}
        </div>

        {/* Product grid with images */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="card-flat ums-tap text-left"
                style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: 100, background: "var(--canvas-cream)", display: "grid", placeItems: "center" }}>
                    <ShoppingCart size={24} style={{ color: "var(--shade-30)" }} />
                  </div>
                )}
                <div style={{ padding: "10px 12px" }}>
                  <p className="caption truncate" style={{ color: "var(--ink)" }}>{p.name}</p>
                  <p className="micro tabular" style={{ color: "var(--ink)", fontWeight: 550 }}>{formatRupiah(p.price)}</p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>Stok: {p.stock}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-80 flex flex-col" style={{ background: "var(--canvas-light)", borderLeft: "1px solid var(--hairline-light)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline-light)" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="heading-sm flex items-center gap-2" style={{ color: "var(--ink)" }}>
              <ShoppingCart size={16} /> Cart ({itemCount})
            </h2>
          </div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama customer"
            className="input"
            style={{ minHeight: 36, fontSize: 13, padding: "6px 12px" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center caption py-8" style={{ color: "var(--shade-50)" }}>Tap produk untuk menambahkan</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2" style={{ background: "var(--canvas-cream)", borderRadius: 12, padding: 10 }}>
                {item.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.imageUrl} alt={item.product.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--canvas-light)", flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="caption truncate" style={{ color: "var(--ink)" }}>{item.product.name}</p>
                  <p className="micro tabular" style={{ color: "var(--shade-50)" }}>{formatRupiah(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, -1)} className="ums-tap" style={{ width: 26, height: 26, borderRadius: 9999, background: "var(--canvas-light)", border: "1px solid var(--hairline-light)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={12} />
                  </button>
                  <span className="caption tabular" style={{ minWidth: 22, textAlign: "center", fontWeight: 550 }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="ums-tap" style={{ width: 26, height: 26, borderRadius: 9999, background: "var(--aloe-10)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={12} />
                  </button>
                  <button onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== item.product.id))} className="ums-tap" style={{ marginLeft: 4, color: "var(--shade-40)" }}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--hairline-light)", padding: 16 }}>
          <div className="flex justify-between mb-3">
            <span className="body-strong">Total</span>
            <span className="body-strong tabular">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={submitOrder}
            disabled={loading || cart.length === 0}
            className="pill pill-primary w-full"
          >
            {loading && <CircleNotch size={16} className="animate-spin" />}
            {loading ? "Memproses..." : "Bayar & Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}
