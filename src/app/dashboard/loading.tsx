import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

export default function DashboardLoading() {
  return (
    <div className="page-shell flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <CircleNotch size={28} className="animate-spin mx-auto mb-3" style={{ color: "var(--ink)" }} />
        <p className="caption" style={{ color: "var(--shade-50)" }}>Memuat…</p>
      </div>
    </div>
  );
}
