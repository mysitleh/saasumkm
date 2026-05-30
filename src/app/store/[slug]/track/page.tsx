"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import { MagnifyingGlass, CircleNotch, Package, CheckCircle, Clock, XCircle, Truck } from "@phosphor-icons/react";

const STATUS_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  WAITING_PAYMENT: { icon: <Clock size={20} />, label: "Menunggu Pembayaran", color: "text-yellow-600" },
  PAID_MANUAL: { icon: <CheckCircle size={20} />, label: "Sudah Dibayar", color: "text-blue-600" },
  PROCESSING: { icon: <Truck size={20} />, label: "Sedang Diproses", color: "text-purple-600" },
  COMPLETED: { icon: <CheckCircle size={20} weight="fill" />, label: "Selesai", color: "text-[var(--accent)]" },
  CANCELLED: { icon: <XCircle size={20} />, label: "Dibatalkan", color: "text-red-500" },
};

interface OrderResult {
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export default function TrackOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/store/${slug}/track?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Pesanan tidak ditemukan.");
      else setOrder(data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = order ? STATUS_INFO[order.status] : null;

  return (
    <div className="min-h-screen bg-[var(--surface-cream)] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Package size={40} className="text-[var(--accent)] mx-auto mb-2" />
          <h1 className="text-xl font-bold text-[var(--ink)]">Lacak Pesanan</h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1">Masukkan nomor order atau nama Anda</p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ORD-20260101-1234 atau nama Anda"
              className="w-full bg-white border border-[var(--border-warm)] rounded-[14px] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="pill pill-primary w-full mt-3"
          >
            {loading && <CircleNotch size={16} className="animate-spin" />}
            {loading ? "Mencari..." : "Cari Pesanan"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-[14px] text-center">
            {error}
          </div>
        )}

        {order && statusInfo && (
          <div className="bg-white rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono font-bold text-[var(--ink)]">{order.orderNumber}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 ${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="text-sm font-semibold">{statusInfo.label}</span>
              </div>
            </div>

            <div className="border-t border-[var(--border-warm)] pt-3 space-y-2">
              <p className="text-sm text-[var(--ink-muted)]">
                Pemesan: <span className="font-medium text-[var(--ink)]">{order.customerName}</span>
              </p>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--ink-muted)]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-[var(--ink)]">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border-warm)]">
                <span>Total</span>
                <span className="text-[var(--accent)]">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
