"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CircleNotch, FileCsv, CheckCircle, Warning } from "@phosphor-icons/react";

export default function ImportProducts() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[]; totalErrors: number } | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/dashboard/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResult({ imported: 0, errors: [data.error || "Gagal import."], totalErrors: 1 });
      } else {
        setResult({ imported: data.imported, errors: data.errors, totalErrors: data.totalErrors });
        if (data.imported > 0) router.refresh();
      }
    } catch {
      setResult({ imported: 0, errors: ["Terjadi kesalahan jaringan."], totalErrors: 1 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="bg-white border border-[var(--border-warm)] text-[var(--ink-muted)] px-4 py-2 rounded-[999px] text-sm font-semibold hover:bg-[var(--surface-cream)] flex items-center gap-2 disabled:opacity-60"
      >
        {loading ? <CircleNotch size={16} className="animate-spin" /> : <Upload size={16} />}
        Import CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {result && (
        <div className="mt-3 bg-[var(--surface-cream)] rounded-[14px] p-3 text-sm">
          {result.imported > 0 && (
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <CheckCircle size={16} weight="fill" />
              <span>{result.imported} produk berhasil diimport.</span>
            </div>
          )}
          {result.totalErrors > 0 && (
            <div className="text-red-600">
              <div className="flex items-center gap-2 mb-1">
                <Warning size={16} />
                <span>{result.totalErrors} error:</span>
              </div>
              <ul className="list-disc list-inside text-xs space-y-0.5 ml-6">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-[var(--ink-muted)] flex items-center gap-1">
        <FileCsv size={12} />
        Format: nama, harga, stok, kategori, deskripsi (CSV/semicolon)
      </div>
    </div>
  );
}
