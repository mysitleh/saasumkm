"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

export default function CustomerSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/dashboard/customers${params.toString() ? `?${params}` : ""}`);
  }

  function clear() {
    setValue("");
    router.push("/dashboard/customers");
  }

  return (
    <form onSubmit={submit} className="mb-4">
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari nama atau HP pelanggan..."
          className="w-full bg-white border border-[var(--border-warm)] rounded-[14px] pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
        />
        {value && (
          <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]">
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
