"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UsersThree, ToggleLeft, ToggleRight, CircleNotch, Trash } from "@phosphor-icons/react";

interface Staff {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string | Date;
}

export default function StaffList({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleActive(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/dashboard/staff/${id}`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Nonaktifkan kasir "${name}"? Mereka tidak bisa login lagi.`)) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/dashboard/staff/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-warm)]">
        <h2 className="font-semibold text-[var(--ink)]">Daftar Kasir ({staff.length})</h2>
      </div>
      {staff.length === 0 ? (
        <div className="py-12 text-center text-[var(--ink-muted)]">
          <UsersThree size={40} className="mx-auto mb-2 text-[var(--border-warm)]" />
          <p className="text-sm">Belum ada kasir</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-warm)]">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm text-[var(--ink)]">{s.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">{s.email}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Ditambahkan {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-[var(--surface-deep)] text-[var(--ink-muted)]"}`}>
                  {s.isActive ? "Aktif" : "Nonaktif"}
                </span>
                <button
                  onClick={() => toggleActive(s.id)}
                  disabled={loadingId === s.id}
                  className="p-1.5 rounded-[14px] hover:bg-[var(--surface-cream)]"
                  title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {loadingId === s.id ? (
                    <CircleNotch size={16} className="animate-spin text-[var(--ink-muted)]" />
                  ) : s.isActive ? (
                    <ToggleRight size={20} weight="fill" className="text-[var(--accent)]" />
                  ) : (
                    <ToggleLeft size={20} className="text-[var(--ink-muted)]" />
                  )}
                </button>
                <button
                  onClick={() => remove(s.id, s.name)}
                  disabled={loadingId === s.id}
                  className="p-1.5 rounded-[14px] hover:bg-red-50 text-[var(--ink-muted)] hover:text-red-500"
                  title="Hapus"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
