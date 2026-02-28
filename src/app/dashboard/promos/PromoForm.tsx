"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
export default function PromoForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code:"", type:"PERCENT", value:"", minOrder:"0", maxDiscount:"", expiresAt:"" });
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) { setForm({...form, [e.target.name]: e.target.value}); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard/promos", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, code: form.code.toUpperCase(), value: parseInt(form.value), minOrder: parseInt(form.minOrder||"0"), maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : null, expiresAt: form.expiresAt||null }) });
      const data = await res.json();
      if (!res.ok) setError(data.error||"Terjadi kesalahan.");
      else { setForm({ code:"", type:"PERCENT", value:"", minOrder:"0", maxDiscount:"", expiresAt:"" }); router.refresh(); }
    } catch { setError("Terjadi kesalahan jaringan."); } finally { setLoading(false); }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Kode Promo *</label><input name="code" value={form.code} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" placeholder="HEMAT10"/></div>
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Tipe Diskon *</label><select name="type" value={form.type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"><option value="PERCENT">Persen (%)</option><option value="NOMINAL">Nominal (Rp)</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nilai Diskon *</label><input name="value" type="number" value={form.value} onChange={handleChange} required min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={form.type==="PERCENT"?"10":"10000"}/></div>
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Min. Order (Rp)</label><input name="minOrder" type="number" value={form.minOrder} onChange={handleChange} min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {form.type==="PERCENT" && <div><label className="block text-xs font-medium text-gray-700 mb-1">Maks. Diskon (Rp)</label><input name="maxDiscount" type="number" value={form.maxDiscount} onChange={handleChange} min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Opsional"/></div>}
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Berlaku Sampai</label><input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
        {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?"Membuat...":"Buat Promo"}
      </button>
    </form>
  );
}
