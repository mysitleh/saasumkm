"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import type { Plan } from "@/lib/features";

export default function BillingActions({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    if (!confirm(`Aktifkan paket ${plan}? (mock — tidak ada pembayaran sungguhan)`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, action: "activate" }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Gagal mengubah paket.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!confirm("Batalkan langganan? Akun akan turun ke Basic pada akhir periode.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Gagal membatalkan.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isCurrent) {
    if (plan === "BASIC") return <button disabled className="pill pill-ghost w-full" style={{ borderColor: "var(--hairline-light)", border: "1px solid var(--hairline-light)" }}>Paket aktif</button>;
    return (
      <button
        onClick={cancel}
        disabled={loading}
        className="pill pill-outline-light w-full"
      >
        {loading && <CircleNotch size={16} className="animate-spin" />} Batalkan langganan
      </button>
    );
  }

  return (
    <button
      onClick={activate}
      disabled={loading || plan === "BASIC"}
      className={plan === "PRO" ? "pill pill-primary w-full" : "pill pill-outline-light w-full"}
    >
      {loading && <CircleNotch size={16} className="animate-spin" />}
      {plan === "BASIC" ? "Tidak tersedia" : "Aktifkan"}
    </button>
  );
}
