"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Plus } from "@phosphor-icons/react";
import ImageUploader from "@/components/ImageUploader";
import AiGenerateButton from "@/components/AiGenerateButton";
import VariantEditor, { type VariantGroup } from "@/components/VariantEditor";

interface Category {
  id: string;
  name: string;
}
interface Props {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    categoryId: string | null;
    variants: string | null;
  };
}

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [variants, setVariants] = useState<VariantGroup[]>(() => {
    if (product?.variants) {
      try { return JSON.parse(product.variants); } catch { return []; }
    }
    return [];
  });
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "0",
    imageUrl: product?.imageUrl ?? "",
    categoryId: product?.categoryId ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = isEdit ? `/api/dashboard/products/${product!.id}` : "/api/dashboard/products";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseInt(form.price || "0", 10),
          stock: parseInt(form.stock || "0", 10),
          imageUrl: form.imageUrl || undefined,
          categoryId: form.categoryId || null,
          variants: variants.length > 0 ? JSON.stringify(variants) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Terjadi kesalahan.");
      else {
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/dashboard/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      router.refresh();
      setNewCategory("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-[14px]">{error}</div>}
      <div className="bg-white rounded-[20px] p-4 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Nama Produk *</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Kopi Susu Gula Aren"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--ink-muted)]">Deskripsi</label>
            <AiGenerateButton
              productName={form.name}
              category={categories.find((c) => c.id === form.categoryId)?.name}
              onGenerated={(text) => update("description", text)}
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            placeholder="Deskripsi produk..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Harga (Rp) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              required
              min={0}
              className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              placeholder="25000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Stok *</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              required
              min={0}
              className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              placeholder="100"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Kategori</label>
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] mb-2"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Tambah kategori baru..."
              className="flex-1 border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={addCategory}
              className="bg-[var(--surface-cream)] text-[var(--ink-muted)] px-3 py-2 rounded-[14px] text-sm hover:bg-[var(--surface-deep)] flex items-center gap-1"
            >
              <Plus size={12} /> Tambah
            </button>
          </div>
        </div>
        <ImageUploader
          label="Foto Produk"
          value={form.imageUrl}
          onChange={(url) => update("imageUrl", url)}
          helper="JPG/PNG/WEBP, maks 2 MB."
        />
        <VariantEditor value={variants} onChange={setVariants} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="pill pill-primary"
      >
        {loading && <CircleNotch size={16} className="animate-spin" />}
        {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      </button>
    </form>
  );
}
