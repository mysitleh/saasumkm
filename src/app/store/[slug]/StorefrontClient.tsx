"use client";
import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, X, QrCode, CheckCircle, Package, Loader2 } from "lucide-react";
interface Product { id: string; name: string; description: string|null; price: number; stock: number; imageUrl: string|null; category: { name: string }|null; }
interface CartItem extends Product { quantity: number; }
interface Tenant { id: string; name: string; slug: string; qrisImageUrl: string|null; }
interface Props { tenant: Tenant; products: Product[]; categories: { id: string; name: string }[]; }
type Step = "catalog"|"cart"|"form"|"payment"|"success";
export default function StorefrontClient({ tenant, products, categories }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("catalog");
  const [selectedCat, setSelectedCat] = useState("all");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ promoId: string; discount: number; label: string }|null>(null);
  const [form, setForm] = useState({ customerName:"", customerPhone:"", customerNote:"", deliveryType:"PICKUP", deliveryAddress:"" });
  const filtered = selectedCat === "all" ? products : products.filter(p => p.category?.name === selectedCat);
  const cartTotal = cart.reduce((s,i) => s + i.price*i.quantity, 0);
  const cartCount = cart.reduce((s,i) => s + i.quantity, 0);
  const discount = promoResult?.discount ?? 0;
  const grandTotal = Math.max(0, cartTotal - discount);
  function addToCart(p: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: Math.min(i.quantity+1, p.stock) } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  }
  function updateQty(id: string, delta: number) { setCart(prev => prev.map(i => i.id===id ? { ...i, quantity: i.quantity+delta } : i).filter(i => i.quantity > 0)); }
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
      const res = await fetch(`/api/store/${tenant.slug}/order`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })), promoId: promoResult?.promoId??null, subtotal: cartTotal, discountAmount: discount, total: grandTotal }) });
      const data = await res.json();
      if (res.ok) { setOrderNumber(data.orderNumber); setStep("payment"); }
      else alert(data.error || "Gagal membuat order.");
    } catch { alert("Terjadi kesalahan."); } finally { setLoading(false); }
  }
  if (step === "cart") return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Keranjang ({cartCount})</h2>
          <button onClick={() => setStep("catalog")}><X className="w-6 h-6 text-gray-500"/></button>
        </div>
        {cart.length === 0 ? <div className="py-16 text-center text-gray-500"><ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300"/><p>Keranjang kosong</p></div> : (
          <div className="p-4 space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-lg object-cover"/> : <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400"/></div>}
                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{item.name}</p><p className="text-green-600 text-sm font-semibold">{formatRupiah(item.price)}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id,-1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"><Minus className="w-3 h-3"/></button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id,1)} className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><Plus className="w-3 h-3 text-green-700"/></button>
                  <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}><X className="w-4 h-4 text-red-400 ml-1"/></button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Kode promo" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              <button onClick={applyPromo} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Pakai</button>
            </div>
            {promoResult && <p className="text-green-600 text-sm">✓ {promoResult.label} — hemat {formatRupiah(promoResult.discount)}</p>}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatRupiah(cartTotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Diskon</span><span>-{formatRupiah(discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-600">{formatRupiah(grandTotal)}</span></div>
            </div>
            <button onClick={() => setStep("form")} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Lanjut ke Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
  if (step === "form") return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Detail Pesanan</h2>
          <button onClick={() => setStep("cart")}><X className="w-6 h-6 text-gray-500"/></button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemesan *</label><input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nama lengkap"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label><input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="08xxxxxxxxxx"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pengiriman</label>
            <div className="grid grid-cols-2 gap-2">
              {["PICKUP","DELIVERY"].map(type => <button key={type} onClick={() => setForm({...form, deliveryType: type})} className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${form.deliveryType===type ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"}`}>{type==="PICKUP" ? "🏪 Ambil di Toko" : "🛵 Diantar"}</button>)}
            </div>
          </div>
          {form.deliveryType === "DELIVERY" && <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</label><textarea value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Alamat lengkap..."/></div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label><textarea value={form.customerNote} onChange={e => setForm({...form, customerNote: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Catatan untuk penjual..."/></div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal ({cartCount} item)</span><span>{formatRupiah(cartTotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Diskon</span><span>-{formatRupiah(discount)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total Bayar</span><span className="text-green-600">{formatRupiah(grandTotal)}</span></div>
          </div>
          <button onClick={submitOrder} disabled={loading || !form.customerName} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin"/>}{loading ? "Memproses..." : "Buat Pesanan"}
          </button>
        </div>
      </div>
    </div>
  );
  if (step === "payment") return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-6 text-center">
          <QrCode className="w-12 h-12 text-green-600 mx-auto mb-3"/>
          <h2 className="font-bold text-xl mb-1">Bayar via QRIS</h2>
          <p className="text-gray-600 text-sm mb-2">Order #{orderNumber}</p>
          <p className="text-3xl font-extrabold text-green-600 mb-6">{formatRupiah(grandTotal)}</p>
          {tenant.qrisImageUrl ? <div className="bg-gray-50 rounded-2xl p-4 mb-6 inline-block"><img src={tenant.qrisImageUrl} alt="QRIS" className="w-56 h-56 object-contain mx-auto"/></div> : <div className="bg-gray-100 rounded-2xl p-8 mb-6 text-gray-500"><QrCode className="w-24 h-24 mx-auto mb-2 text-gray-300"/><p className="text-sm">QRIS belum diatur oleh toko</p></div>}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-1">📋 Cara Bayar:</p>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside"><li>Scan QR di atas dengan e-wallet / m-banking</li><li>Masukkan nominal: <strong>{formatRupiah(grandTotal)}</strong></li><li>Konfirmasi pembayaran</li><li>Tunjukkan bukti bayar ke kasir</li></ol>
          </div>
          <button onClick={() => setStep("success")} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Saya Sudah Bayar</button>
        </div>
      </div>
    </div>
  );
  if (step === "success") return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Diterima!</h2>
        <p className="text-gray-600 mb-2">Nomor pesanan Anda:</p>
        <p className="text-xl font-bold text-green-600 mb-4">{orderNumber}</p>
        <p className="text-sm text-gray-500 mb-6">Kasir akan memverifikasi pembayaran Anda. Terima kasih sudah berbelanja di <strong>{tenant.name}</strong>!</p>
        <button onClick={() => { setCart([]); setStep("catalog"); setPromoCode(""); setPromoResult(null); setForm({ customerName:"", customerPhone:"", customerNote:"", deliveryType:"PICKUP", deliveryAddress:"" }); }} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Belanja Lagi</button>
      </div>
    </div>
  );
  return (
    <>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button onClick={() => setSelectedCat("all")} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCat==="all" ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>Semua</button>
          {categories.map(cat => <button key={cat.id} onClick={() => setSelectedCat(cat.name)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCat===cat.name ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{cat.name}</button>)}
        </div>
      )}
      {filtered.length === 0 ? <div className="text-center py-16 text-gray-500"><Package className="w-12 h-12 mx-auto mb-3 text-gray-300"/><p>Belum ada produk tersedia</p></div> : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover"/> : <div className="w-full h-36 bg-gray-100 flex items-center justify-center"><Package className="w-10 h-10 text-gray-300"/></div>}
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{product.name}</p>
                {product.category && <span className="text-xs text-gray-400">{product.category.name}</span>}
                <p className="text-green-600 font-bold text-sm mt-1">{formatRupiah(product.price)}</p>
                <p className="text-xs text-gray-400 mb-2">Stok: {product.stock}</p>
                <button onClick={() => addToCart(product)} className="w-full bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"><Plus className="w-3 h-3"/> Tambah</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
          <button onClick={() => setStep("cart")} className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 hover:bg-green-700">
            <ShoppingCart className="w-5 h-5"/>
            <span className="font-semibold">{cartCount} item</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{formatRupiah(cartTotal)}</span>
          </button>
        </div>
      )}
    </>
  );
}
