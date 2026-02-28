"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode, ExternalLink } from "lucide-react";
interface Tenant { id:string; name:string; slug:string; description:string|null; logoUrl:string|null; address:string|null; phone:string|null; qrisImageUrl:string|null; }
export default function SettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:tenant.name, description:tenant.description??"", logoUrl:tenant.logoUrl??"", address:tenant.address??"", phone:tenant.phone??"", qrisImageUrl:tenant.qrisImageUrl??"" });
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) { setForm({...form, [e.target.name]: e.target.value}); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/dashboard/settings", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) setError(data.error||"Terjadi kesalahan.");
      else { setSuccess(true); router.refresh(); }
    } catch { setError("Terjadi kesalahan jaringan."); } finally { setLoading(false); }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">✓ Pengaturan berhasil disimpan!</div>}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Profil Toko</h2>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">URL Toko</label><div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5"><span className="text-sm text-gray-500">/store/{tenant.slug}</span><a href={`/store/${tenant.slug}`} target="_blank" className="ml-auto text-green-600"><ExternalLink className="w-4 h-4"/></a></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Toko</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ceritakan tentang toko Anda..."/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">No. HP / WhatsApp</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="08xxxxxxxxxx"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Toko</label><input name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Jl. Contoh No. 1"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">URL Logo Toko</label><input name="logoUrl" value={form.logoUrl} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..."/>{form.logoUrl && <img src={form.logoUrl} alt="Logo" className="mt-2 w-16 h-16 rounded-xl object-cover border border-gray-200" onError={e=>(e.currentTarget.style.display="none")}/>}</div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2"><QrCode className="w-5 h-5 text-green-600"/><h2 className="font-semibold text-gray-900">Pembayaran QRIS Statis</h2></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">📋 Cara setup QRIS Statis:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs"><li>Daftar ke bank/e-wallet yang mendukung QRIS</li><li>Download gambar QR code statis Anda</li><li>Upload ke hosting gambar (imgbb.com, cloudinary)</li><li>Paste URL gambar di bawah ini</li></ol>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar QRIS</label><input name="qrisImageUrl" value={form.qrisImageUrl} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..."/>{form.qrisImageUrl && <div className="mt-2 bg-gray-50 rounded-xl p-3 inline-block"><img src={form.qrisImageUrl} alt="QRIS" className="w-32 h-32 object-contain" onError={e=>(e.currentTarget.style.display="none")}/></div>}</div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
        {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?"Menyimpan...":"Simpan Pengaturan"}
      </button>
    </form>
  );
}
