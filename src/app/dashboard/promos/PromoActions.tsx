"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, Trash, CircleNotch } from "@phosphor-icons/react";

export default function PromoActions({
  promoId,
  isActive,
  code,
}: {
  promoId: string;
  isActive: boolean;
  code: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/promos/${promoId}`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm(`Hapus promo "${code}"? Aksi ini tidak bisa dibatalkan.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/promos/${promoId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-3">
      <button
        onClick={toggle}
        disabled={loading}
        className="p-1.5 rounded-[14px] hover:bg-[var(--surface-cream)]"
        title={isActive ? "Nonaktifkan" : "Aktifkan"}
      >
        {loading ? (
          <CircleNotch size={20} className="animate-spin text-[var(--ink-muted)]" />
        ) : isActive ? (
          <ToggleRight size={20} weight="fill" className="text-[var(--accent)]" />
        ) : (
          <ToggleLeft size={20} className="text-[var(--ink-muted)]" />
        )}
      </button>
      <button
        onClick={remove}
        disabled={loading}
        className="p-1.5 rounded-[14px] hover:bg-red-50 text-[var(--ink-muted)] hover:text-red-500"
        title="Hapus"
      >
        <Trash size={16} />
      </button>
    </div>
  );
}
