"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Loader2 } from "lucide-react";
export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ownerName:"", email:"", password:"", storeName:"", storeSlug:"", phone:"" });
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => {
      const u = { ...prev, [name]: value };
      if (name === "storeName") u.storeSlug = value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
      return u;
    });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) setError(data.error||"Terjadi kesalahan.");
      else router.push("/login?registered=1");
    } catch { setError("Terjadi kesalahan jaringan."); } finally { setLoading(false); }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4"><ShoppingBag className="w-8 h-8 text-green-600"/><span className="text-2xl font-bold text-gray-900">UMKMStore</span></Link>
          <h1 className="text-2xl font-bold text-gray-900">Buat Toko Gratis</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{name:"ownerName",label:"Nama Pemilik",placeholder:"Nama lengkap Anda"},{name:"email",label:"Email",type:"email",placeholder:"email@toko.com"},{name:"password",label:"Password",type:"password",placeholder:"Min. 6 karakter"}].map(f=>(
              <div key={f.name}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label><input name={f.name} type={f.type||"text"} value={(form as any)[f.name]} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={f.placeholder}/></div>
            ))}
            <hr className="border-gray-100"/>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label><input name="storeName" value={form.storeName} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kedai Kopi Pak Budi"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug Toko (URL)</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-300">/store/</span>
                <input name="storeSlug" value={form.storeSlug} onChange={handleChange} required pattern="[a-z0-9-]+" className="flex-1 px-3 py-2.5 text-sm focus:outline-none" placeholder="kedai-kopi-pak-budi"/>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">No. HP (opsional)</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="08xxxxxxxxxx"/></div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?"Membuat toko...":"Buat Toko Sekarang"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-6">Sudah punya akun? <Link href="/login" className="text-green-600 font-semibold hover:underline">Masuk</Link></p>
        </div>
      </div>
    </div>
  );
}
