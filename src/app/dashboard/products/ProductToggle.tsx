"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
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
    <button onClick={toggle} disabled={loading} className="p-2 rounded-lg hover:bg-gray-100" title={active?"Nonaktifkan":"Aktifkan"}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400"/> : active ? <ToggleRight className="w-5 h-5 text-green-600"/> : <ToggleLeft className="w-5 h-5 text-gray-400"/>}
    </button>
  );
}
