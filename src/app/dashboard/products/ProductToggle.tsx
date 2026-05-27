"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, CircleNotch } from "@phosphor-icons/react";
export default function ProductToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(isActive);
  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/products/${productId}/toggle`, { method:"PATCH" });
      if (res.ok) { setActive(!active); router.refresh(); }
    } catch {} finally { setLoading(false); }
  }
  return (
    <button onClick={toggle} disabled={loading} className="p-2 rounded-[14px] hover:bg-[var(--surface-cream)]" title={active?"Nonaktifkan":"Aktifkan"}>
      {loading ? <CircleNotch size={20} className="animate-spin text-[var(--ink-muted)]"/> : active ? <ToggleRight size={20} weight="fill" className="text-[var(--accent)]"/> : <ToggleLeft size={20} className="text-[var(--ink-muted)]"/>}
    </button>
  );
}
