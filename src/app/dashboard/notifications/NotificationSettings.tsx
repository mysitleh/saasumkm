"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Check, WhatsappLogo, TelegramLogo, PaperPlaneTilt } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";

interface Config {
  phone: string | null;
  notifyWhatsapp: boolean | null;
  notifyTelegram: boolean | null;
  telegramChatId: string | null;
  dailyDigestEnabled: boolean | null;
  dailyDigestHour: number | null;
  lowStockThreshold: number | null;
}

export default function NotificationSettings({ initial, botUsername }: { initial: Config; botUsername: string | null }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<Config>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testing, setTesting] = useState<"whatsapp" | "telegram" | null>(null);

  function set<K extends keyof Config>(k: K, v: Config[K]) {
    setCfg((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/dashboard/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyWhatsapp: cfg.notifyWhatsapp ?? false,
          notifyTelegram: cfg.notifyTelegram ?? false,
          telegramChatId: cfg.telegramChatId ?? "",
          dailyDigestEnabled: cfg.dailyDigestEnabled ?? false,
          dailyDigestHour: cfg.dailyDigestHour ?? 21,
          lowStockThreshold: cfg.lowStockThreshold ?? 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  async function testSend(channel: "whatsapp" | "telegram", preview: boolean) {
    setTestMsg("");
    setError("");
    setTesting(channel);
    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, preview }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Gagal kirim tes.");
      else setTestMsg(`Tes ${channel === "whatsapp" ? "WhatsApp" : "Telegram"} terkirim. Cek HP Anda.`);
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="space-y-5">
      {error && <div className="alert"><span className="glyph mr-2">{GLYPH.reference}</span>{error}</div>}
      {saved && (
        <div className="alert" style={{ background: "var(--aloe-10)", borderColor: "var(--aloe-10)" }}>
          <span className="glyph mr-2">{GLYPH.done}</span>Tersimpan.
        </div>
      )}
      {testMsg && (
        <div className="alert" style={{ background: "var(--pistachio-10)", borderColor: "var(--pistachio-10)" }}>
          <span className="glyph mr-2">{GLYPH.sparkle}</span>{testMsg}
        </div>
      )}

      {/* WhatsApp */}
      <section className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="eyebrow-cap"><WhatsappLogo size={14} weight="fill" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6, color: "#25D366" }} />WhatsApp</p>
          <label className="flex items-center gap-2 caption cursor-pointer">
            <input type="checkbox" checked={!!cfg.notifyWhatsapp} onChange={(e) => set("notifyWhatsapp", e.target.checked)} style={{ accentColor: "var(--ink)" }} />
            {cfg.notifyWhatsapp ? "Aktif" : "Nonaktif"}
          </label>
        </div>
        <p className="caption mb-3" style={{ color: "var(--shade-60)" }}>
          Laporan dikirim ke nomor toko:{" "}
          <span className="tabular" style={{ color: "var(--ink)", fontWeight: 550 }}>{cfg.phone ?? "(belum diatur)"}</span>.
          Ubah nomor di <a href="/dashboard/settings" style={{ color: "var(--ink)", textDecoration: "underline" }}>Pengaturan</a>.
        </p>
        <button
          onClick={() => testSend("whatsapp", false)}
          disabled={testing === "whatsapp" || !cfg.phone}
          className="pill pill-outline-light pill-sm"
        >
          {testing === "whatsapp" ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
          Tes kirim
        </button>
      </section>

      {/* Telegram */}
      <section className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="eyebrow-cap"><TelegramLogo size={14} weight="fill" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6, color: "#229ED9" }} />Telegram</p>
          <label className="flex items-center gap-2 caption cursor-pointer">
            <input type="checkbox" checked={!!cfg.notifyTelegram} onChange={(e) => set("notifyTelegram", e.target.checked)} style={{ accentColor: "var(--ink)" }} />
            {cfg.notifyTelegram ? "Aktif" : "Nonaktif"}
          </label>
        </div>
        <ol className="caption mb-3 space-y-1" style={{ color: "var(--shade-60)", paddingLeft: 18, listStyle: "decimal" }}>
          <li>Buka Telegram, cari bot {botUsername ? <code style={{ fontFamily: "var(--font-mono)" }}>@{botUsername}</code> : "platform"} lalu tekan Start.</li>
          <li>Kirim pesan apa saja, lalu chat <code style={{ fontFamily: "var(--font-mono)" }}>@userinfobot</code> untuk dapat Chat ID Anda.</li>
          <li>Tempel Chat ID di bawah ini.</li>
        </ol>
        <input
          value={cfg.telegramChatId ?? ""}
          onChange={(e) => set("telegramChatId", e.target.value)}
          placeholder="123456789"
          className="input mb-3"
          style={{ fontFamily: "var(--font-mono)", maxWidth: 280 }}
        />
        <div>
          <button
            onClick={() => testSend("telegram", false)}
            disabled={testing === "telegram" || !cfg.telegramChatId}
            className="pill pill-outline-light pill-sm"
          >
            {testing === "telegram" ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
            Tes kirim
          </button>
        </div>
      </section>

      {/* Daily digest */}
      <section className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="eyebrow-cap"><span className="glyph">{GLYPH.diamond}</span> Laporan Harian Otomatis</p>
          <label className="flex items-center gap-2 caption cursor-pointer">
            <input type="checkbox" checked={!!cfg.dailyDigestEnabled} onChange={(e) => set("dailyDigestEnabled", e.target.checked)} style={{ accentColor: "var(--ink)" }} />
            {cfg.dailyDigestEnabled ? "Aktif" : "Nonaktif"}
          </label>
        </div>
        <p className="caption mb-4" style={{ color: "var(--shade-60)" }}>
          Ringkasan omzet, order, pelanggan baru, top produk, breakdown per outlet, dan alert stok menipis — dikirim otomatis setiap hari ke channel aktif di atas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="micro tabular block mb-1" style={{ color: "var(--shade-60)" }}>Jam kirim (WIB)</label>
            <select
              value={cfg.dailyDigestHour ?? 21}
              onChange={(e) => set("dailyDigestHour", Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="micro tabular block mb-1" style={{ color: "var(--shade-60)" }}>Alert stok ≤</label>
            <input
              type="number"
              min={0}
              max={999}
              value={cfg.lowStockThreshold ?? 5}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => testSend(cfg.notifyTelegram ? "telegram" : "whatsapp", true)}
            disabled={testing !== null}
            className="pill pill-ghost pill-sm"
            style={{ border: "1px solid var(--hairline-light)" }}
          >
            {testing ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
            Preview laporan hari ini
          </button>
        </div>
      </section>

      <button onClick={save} disabled={pending} className="pill pill-primary">
        {pending ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
        {pending ? "Menyimpan…" : "Simpan pengaturan notifikasi"}
      </button>
    </div>
  );
}
