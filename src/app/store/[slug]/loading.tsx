import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-cream)] flex items-center justify-center">
      <div className="text-center">
        <CircleNotch size={32} className="animate-spin text-[var(--accent)] mx-auto mb-3" />
        <p className="text-sm text-[var(--ink-muted)]">Memuat toko...</p>
      </div>
    </div>
  );
}
