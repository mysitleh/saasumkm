"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, FloppyDisk, CheckCircle } from "@phosphor-icons/react";
import { formatRupiah } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export default function BulkStockForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, p.stock])),
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasChanges = products.some((p) => stocks[p.id] !== p.stock);

  async function handleSave() {
    const updates = products
      .filter((p) => stocks[p.id] !== p.stock)
      .map((p) => ({ id: p.id, stock: stocks[p.id] }));

    if (updates.length === 0) return;
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/dashboard/products/bulk-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal update stok.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-[14px] mb-4 flex items-center gap-2">
          <CheckCircle size={16} weight="fill" /> Stok berhasil diupdate!
        </div>
      )}

      <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-warm)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--ink)]">{products.length} produk</h2>
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="pill pill-primary pill-sm"
          >
            {loading ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
            Simpan
          </button>
        </div>
        <div className="divide-y divide-[var(--border-warm)] max-h-[60vh] overflow-y-auto">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{p.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">{formatRupiah(p.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--ink-muted)] w-12 text-right">was: {p.stock}</span>
                <input
                  type="number"
                  min={0}
                  value={stocks[p.id]}
                  onChange={(e) => setStocks({ ...stocks, [p.id]: parseInt(e.target.value) || 0 })}
                  className={`w-20 border rounded-[14px] px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] ${
                    stocks[p.id] !== p.stock ? "border-[var(--accent)] bg-emerald-50" : "border-[var(--border-warm)]"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
