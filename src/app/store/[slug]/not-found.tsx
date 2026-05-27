import Link from "next/link";
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr";

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-[var(--surface-cream)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <ShoppingBag size={48} className="text-[var(--border-warm)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Toko Tidak Ditemukan</h1>
        <p className="text-sm text-[var(--ink-muted)] mb-6">
          Toko yang Anda cari tidak ada atau sudah tidak aktif.
        </p>
        <Link
          href="/"
          className="bg-[var(--accent)] text-white px-6 py-2.5 rounded-[999px] text-sm font-semibold hover:bg-emerald-700 inline-block"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
