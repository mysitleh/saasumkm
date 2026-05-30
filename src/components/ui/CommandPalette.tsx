"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface Cmd {
  label: string;
  hint?: string;
  group: string;
  href?: string;
  action?: () => void;
  keywords?: string;
}

/**
 * ⌘K / Ctrl-K command palette for fast dashboard navigation.
 * Pure client, no dependency. Fuzzy-ish substring matching, keyboard driven.
 */
export default function CommandPalette({ role }: { role: "OWNER" | "CASHIER" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const owner = role === "OWNER";
    const all: Cmd[] = [
      { label: "Dashboard", group: "Navigasi", href: "/dashboard", keywords: "home beranda" },
      { label: "Pesanan", group: "Navigasi", href: "/dashboard/orders", keywords: "order transaksi" },
      { label: "POS Kasir", group: "Navigasi", href: "/dashboard/pos", keywords: "cashier jualan" },
      ...(owner
        ? [
            { label: "Produk", group: "Navigasi", href: "/dashboard/products", keywords: "katalog barang" },
            { label: "Promo", group: "Navigasi", href: "/dashboard/promos", keywords: "diskon kupon" },
            { label: "Insights (BI)", group: "Navigasi", href: "/dashboard/insights", keywords: "analitik rfm forecast" },
            { label: "Analytics", group: "Navigasi", href: "/dashboard/analytics", keywords: "laporan omzet" },
            { label: "Pelanggan", group: "Navigasi", href: "/dashboard/customers", keywords: "customer member" },
            { label: "Loyalty", group: "Navigasi", href: "/dashboard/loyalty", keywords: "poin reward" },
            { label: "Outlet", group: "Navigasi", href: "/dashboard/outlets", keywords: "cabang" },
            { label: "Staff", group: "Navigasi", href: "/dashboard/staff", keywords: "kasir karyawan" },
            { label: "Notifikasi", group: "Navigasi", href: "/dashboard/notifications", keywords: "wa telegram digest laporan" },
            { label: "Theme Builder", group: "Branding", href: "/dashboard/theme", keywords: "warna font tema" },
            { label: "Template", group: "Branding", href: "/dashboard/template", keywords: "layout hero carousel" },
            { label: "Custom Domain", group: "Branding", href: "/dashboard/domain", keywords: "dns url" },
            { label: "Billing", group: "Akun", href: "/dashboard/billing", keywords: "paket langganan bayar" },
            { label: "Pengaturan", group: "Akun", href: "/dashboard/settings", keywords: "profil qris" },
            { label: "Tambah produk baru", group: "Aksi cepat", href: "/dashboard/products/new", keywords: "create new" },
            { label: "Update stok massal", group: "Aksi cepat", href: "/dashboard/products/stock", keywords: "bulk stock" },
          ]
        : []),
    ];
    return all;
  }, [role]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.group.toLowerCase().includes(term) ||
        (c.keywords ?? "").toLowerCase().includes(term),
    );
  }, [q, commands]);

  // Global ⌘K / Ctrl-K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          const next = !o;
          if (next) {
            // Reset state as we open (in the updater, not a separate effect).
            setQ("");
            setActive(0);
            setTimeout(() => inputRef.current?.focus(), 30);
          }
          return next;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(v: string) {
    setQ(v);
    setActive(0);
  }

  function run(cmd: Cmd) {
    setOpen(false);
    if (cmd.href) router.push(cmd.href);
    cmd.action?.();
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIdxForKey()]) {
      e.preventDefault();
      run(filtered[activeIdxForKey()]);
    }
  }

  function activeIdxForKey() {
    return Math.min(active, Math.max(0, filtered.length - 1));
  }

  if (!open) return null;

  let lastGroup = "";
  const activeIdx = Math.min(active, Math.max(0, filtered.length - 1));

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", paddingTop: "12vh" }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          background: "var(--canvas-light)",
          border: "1px solid var(--hairline-light)",
          borderRadius: 16,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        <div className="flex items-center gap-3" style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline-light)" }}>
          <MagnifyingGlass size={18} style={{ color: "var(--shade-50)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Cari halaman atau aksi…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 16,
              color: "var(--ink)",
              fontFeatureSettings: '"ss03" on',
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--shade-50)",
              border: "1px solid var(--hairline-light)",
              borderRadius: 6,
              padding: "2px 6px",
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: "52vh", overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 ? (
            <p style={{ padding: 24, textAlign: "center", color: "var(--shade-50)", fontSize: 14 }}>
              Tidak ada hasil untuk &ldquo;{q}&rdquo;
            </p>
          ) : (
            filtered.map((c, i) => {
              const showGroup = c.group !== lastGroup;
              lastGroup = c.group;
              const isActive = i === activeIdx;
              return (
                <div key={c.label}>
                  {showGroup && (
                    <p
                      className="eyebrow-cap"
                      style={{ padding: "10px 12px 4px", color: "var(--shade-40)", fontSize: 10.5 }}
                    >
                      {c.group}
                    </p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(c)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: isActive ? "var(--aloe-10)" : "transparent",
                      color: "var(--ink)",
                      fontSize: 14.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {c.label}
                    {isActive && <span style={{ fontSize: 12, color: "var(--shade-50)" }}>↵</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
