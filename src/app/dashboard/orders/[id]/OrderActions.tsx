"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, CheckCircle, XCircle } from "@phosphor-icons/react";
const TRANSITIONS: Record<string,{label:string;next:string;color:string}[]> = {
  WAITING_PAYMENT:[{label:"✓ Konfirmasi Sudah Bayar",next:"PAID_MANUAL",color:"bg-[var(--accent)] text-white"},{label:"✗ Batalkan Order",next:"CANCELLED",color:"bg-red-100 text-red-700"}],
  PAID_MANUAL:[{label:"🔄 Proses Pesanan",next:"PROCESSING",color:"bg-blue-600 text-white"},{label:"✗ Batalkan Order",next:"CANCELLED",color:"bg-red-100 text-red-700"}],
  PROCESSING:[{label:"✓ Selesaikan Pesanan",next:"COMPLETED",color:"bg-[var(--accent)] text-white"}],
  COMPLETED:[], CANCELLED:[]
};
export default function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string; isOwner?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const transitions = TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return (
    <div className="bg-[var(--surface-cream)] rounded-[20px] p-4 text-center text-sm text-[var(--ink-muted)]">
      {currentStatus==="COMPLETED" ? <div className="flex items-center justify-center gap-2 text-[var(--accent)]"><CheckCircle size={20} weight="fill"/>Pesanan selesai</div> : <div className="flex items-center justify-center gap-2 text-red-500"><XCircle size={20}/>Pesanan dibatalkan</div>}
    </div>
  );
  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) router.refresh();
      else { const d = await res.json(); alert(d.error||"Gagal mengubah status."); }
    } catch { alert("Terjadi kesalahan."); } finally { setLoading(false); }
  }
  return (
    <div className="bg-white rounded-[20px] p-4 shadow-sm">
      <h2 className="font-semibold text-[var(--ink)] mb-3">Aksi Pesanan</h2>
      <div className="space-y-2">
        {transitions.map(t => <button key={t.next} onClick={() => updateStatus(t.next)} disabled={loading} className={`w-full py-3 rounded-[999px] font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 ${t.color}`}>{loading&&<CircleNotch size={16} className="animate-spin"/>}{t.label}</button>)}
      </div>
    </div>
  );
}
