"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
interface Category { id: string; name: string; }
interface Props { tenantId: string; categories: Category[]; product?: { id: string; name: string; description: string|null; price: number; stock: number; imageUrl: string|null; categoryId: string|null; }; }
export default function ProductForm({ tenantId, categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({ name:product?.name??"", description:product?.description??"", price:product?.price?.toString()??"", stock:product?.stock?.toString()??"0", imageUrl:product?.imageUrl??"", categoryId:product?.categoryId??"" });
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) { setForm({...form, [e.target.name]: e.target.value}); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const url = isEdit ? `/api/dashboard/products/${product.id}` : "/api/dashboard/products";
      const res = await fetch(url, { method: isEdit?"PUT":"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, price: parseInt(form.price), stock: parseInt(form.stock), categoryId: form.categoryId||null }) });
      const data = await res.json();
      if (!res.ok) setError(data.error||"Terjadi kesalahan.");
      else { router.push("/dashboard/products"); router.refresh(); }
    } catch { setError("Terjadi kesalahan jaringan."); } finally { setLoading(false); }
  }
  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/dashboard/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: newCategory }) });
    if (res.ok) { router.refresh(); setNewCategory(""); }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kopi Susu Gula Aren"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Deskripsi produk..."/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label><input name="price" type="number" value={form.price} onChange={handleChange} required min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="25000"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stok *</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="100"/></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-2">
            <option value="">Tanpa kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Tambah kategori baru..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/><button type="button" onClick={addCategory} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"><Plus className="w-3 h-3"/>Tambah</button></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Produk</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..."/>
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="mt-2 w-24 h-24 rounded-xl object-cover border border-gray-200" onError={e=>(e.currentTarget.style.display="none")}/>}
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
        {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?"Menyimpan...":isEdit?"Simpan Perubahan":"Tambah Produk"}
      </button>
    </form>
  );
}
