"use client";

import { useRef, useState } from "react";
import { CircleNotch, Upload, X } from "@phosphor-icons/react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helper?: string;
  className?: string;
}

/**
 * Komponen unggah gambar ringan: pilih file → upload ke /api/dashboard/upload
 * → set URL hasilnya. Mendukung paste URL manual.
 */
export default function ImageUploader({ value, onChange, label = "Foto", helper, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Gagal upload.");
      else onChange(data.url);
    } catch {
      setError("Gagal upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">{label}</label>
      <div className="flex gap-2 items-start">
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-20 h-20 rounded-[14px] object-cover border border-[var(--border-warm)]"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow p-0.5 border border-[var(--border-warm)]"
              aria-label="Hapus"
            >
              <X size={12} className="text-[var(--ink-muted)]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-[14px] border-2 border-dashed border-[var(--border-warm)] flex flex-col items-center justify-center text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {loading ? <CircleNotch size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-[10px] mt-1">Pilih</span>
          </button>
        )}
        <div className="flex-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="atau paste URL gambar..."
            className="w-full border border-[var(--border-warm)] rounded-[14px] px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
          />
          {helper && <p className="text-xs text-[var(--ink-muted)] mt-1">{helper}</p>}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>
    </div>
  );
}
