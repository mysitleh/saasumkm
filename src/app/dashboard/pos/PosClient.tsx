"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Trash, CheckCircle, CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

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
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <CheckCircle size={64} weight="fill" className="text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">Order Berhasil!</h2>
          <p className="text-lg font-mono text-[var(--accent)] mb-6">{success}</p>
          <p className="text-[var(--ink-muted)] mb-6">Total: {formatRupiah(total)}</p>
          <button
            onClick={() => setSuccess(null)}
            className="bg-[var(--accent)] text-white px-8 py-3 rounded-[999px] font-semibold hover:bg-emerald-700"
          >
            Order Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--surface-cream)] z-50 flex flex-col md:flex-row">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-[var(--border-warm)] px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-[var(--ink)]">POS — {tenantName}</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="ml-auto border border-[var(--border-warm)] rounded-[14px] px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-white border-b border-[var(--border-warm)]">
          <button
            onClick={() => setSelectedCat("all")}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
              selectedCat === "all" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-cream)] text-[var(--ink-muted)]"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                selectedCat === cat ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-cream)] text-[var(--ink-muted)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white rounded-[14px] p-3 text-left hover:shadow-md transition-shadow border border-[var(--border-warm)]"
              >
                <p className="font-medium text-sm text-[var(--ink)] line-clamp-2 mb-1">{p.name}</p>
                <p className="text-[var(--accent)] font-bold text-sm">{formatRupiah(p.price)}</p>
                <p className="text-xs text-[var(--ink-muted)]">Stok: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-80 bg-white border-l border-[var(--border-warm)] flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--border-warm)]">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--ink)] flex items-center gap-2">
              <ShoppingCart size={16} /> Cart ({itemCount})
            </h2>
          </div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama customer"
            className="mt-2 w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-1.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-[var(--ink-muted)] text-sm py-8">Tap produk untuk menambahkan</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 bg-[var(--surface-cream)] rounded-[14px] p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)] truncate">{item.product.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{formatRupiah(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded bg-[var(--surface-deep)] flex items-center justify-center">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                    <Plus size={12} className="text-emerald-700" />
                  </button>
                  <button onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== item.product.id))} className="ml-1">
                    <Trash size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border-warm)] p-4">
          <div className="flex justify-between font-bold text-lg mb-3">
            <span>Total</span>
            <span className="text-[var(--accent)]">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={submitOrder}
            disabled={loading || cart.length === 0}
            className="w-full bg-[var(--accent)] text-white py-3 rounded-[999px] font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <CircleNotch size={16} className="animate-spin" />}
            {loading ? "Memproses..." : "Bayar & Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}
