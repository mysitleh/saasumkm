"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkle, X, PaperPlaneRight, CircleNotch } from "@phosphor-icons/react";
import { GLYPH } from "@/lib/glyphs";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Bagaimana kondisi bisnis saya hari ini?",
  "Produk apa yang harus saya restock?",
  "Cara naikkan omzet minggu ini?",
  "Pelanggan mana yang berisiko churn?",
];

/**
 * AiAssistant — floating 360° AI business advisor.
 *
 * A FAB that opens a chat panel grounded in the store's real data (the API
 * injects a live business snapshot). Available on every dashboard page.
 */
export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.text || "Maaf, tidak ada jawaban." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.error || "Terjadi kesalahan." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Gagal terhubung ke AI. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="ai-fab"
        aria-label="Buka Asisten AI"
        data-open={open}
      >
        {open ? <X size={22} weight="bold" /> : <Sparkle size={22} weight="fill" />}
        {!open && <span className="ai-fab-pulse" aria-hidden="true" />}
      </button>

      {open && (
        <div className="ai-panel ums-sheet" role="dialog" aria-label="Asisten AI 360">
          {/* Header */}
          <div className="ai-head">
            <div className="flex items-center gap-2.5">
              <span className="ai-head-badge"><Sparkle size={16} weight="fill" /></span>
              <div>
                <p className="body-strong" style={{ fontSize: 14, lineHeight: 1.2 }}>Asisten AI 360</p>
                <p className="micro" style={{ color: "var(--shade-50)" }}>Penasihat bisnis cerdas</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup" className="ums-tap" style={{ color: "var(--shade-50)" }}>
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="ai-empty">
                <span className="ai-empty-glyph glyph">{GLYPH.sparkle}</span>
                <p className="body-md" style={{ color: "var(--ink)", marginBottom: 4 }}>Halo! Saya asisten bisnis Anda.</p>
                <p className="micro" style={{ color: "var(--shade-50)", marginBottom: 16 }}>
                  Tanya apa saja tentang penjualan, stok, atau pelanggan toko Anda.
                </p>
                <div className="ai-suggest-grid">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="ai-suggest">{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "ai-msg is-user" : "ai-msg is-ai"}>
                  {m.role === "assistant" && <span className="ai-msg-icon glyph">{GLYPH.sparkle}</span>}
                  <div className="ai-bubble">{m.content}</div>
                </div>
              ))
            )}
            {loading && (
              <div className="ai-msg is-ai">
                <span className="ai-msg-icon glyph">{GLYPH.sparkle}</span>
                <div className="ai-bubble ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            className="ai-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya asisten AI…"
              className="ai-input"
              disabled={loading}
            />
            <button type="submit" className="ai-send ums-tap" disabled={loading || !input.trim()} aria-label="Kirim">
              {loading ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneRight size={18} weight="fill" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
