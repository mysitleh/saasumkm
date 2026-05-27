"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash, CircleNotch } from "@phosphor-icons/react";

export default function ProductDelete({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus produk "${productName}"? Produk akan dinonaktifkan.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/products/${productId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus produk.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-[var(--ink-muted)] hover:text-red-500 hover:bg-red-50 rounded-[14px]"
      title="Hapus"
    >
      {loading ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
    </button>
  );
}
