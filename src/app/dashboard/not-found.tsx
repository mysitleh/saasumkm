import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export default function DashboardNotFound() {
  return (
    <div className="page-shell flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-sm">
        <MagnifyingGlass size={40} className="text-[var(--ink-muted)] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--ink)] mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="pill pill-primary pill-sm inline-flex"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
