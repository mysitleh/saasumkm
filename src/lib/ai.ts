/**
 * Central AI engine for UMKMStore — single provider abstraction used by
 * every AI surface (assistant chat, content generation, insight narration,
 * reply drafting, etc).
 *
 * Provider: OpenAI Chat Completions when OPENAI_API_KEY is set, otherwise a
 * deterministic local fallback so the whole AI suite stays functional (and
 * demo-able) with zero API cost.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiResult {
  text: string;
  provider: "openai" | "fallback";
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Low-level chat completion. Accepts a full message list so callers can
 * provide a grounded system prompt + business context + conversation.
 */
export async function chatComplete(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { text: fallbackReply(messages), provider: "fallback" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err.slice(0, 160)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return { text, provider: "openai" };
}

/* ============================================================
   FALLBACK — heuristic assistant when no API key is configured.
   It reads the injected business context (a compact text block in
   the system message) and the latest user question, then returns a
   helpful, grounded-sounding answer. Not as fluent as the LLM, but
   keeps every AI surface usable offline / cost-free.
   ============================================================ */
function fallbackReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const context = messages.find((m) => m.role === "system")?.content ?? "";
  const q = lastUser.toLowerCase();

  const ctxLine = (label: string): string | null => {
    const re = new RegExp(`${label}[^\\n]*`, "i");
    const m = context.match(re);
    return m ? m[0] : null;
  };

  const bits: string[] = [];
  if (/omzet|revenue|penjualan|pendapatan|sales/.test(q)) {
    const l = ctxLine("Omzet") ?? ctxLine("Forecast");
    if (l) bits.push(l);
  }
  if (/stok|stock|restock|habis/.test(q)) {
    const l = ctxLine("Stok") ?? ctxLine("Reorder");
    if (l) bits.push(l);
  }
  if (/pelanggan|customer|churn|loyal/.test(q)) {
    const l = ctxLine("Pelanggan") ?? ctxLine("Champions") ?? ctxLine("Churn");
    if (l) bits.push(l);
  }
  if (/promo|diskon|bundling|cross/.test(q)) {
    const l = ctxLine("Promo") ?? ctxLine("Bundling") ?? ctxLine("Sering dibeli");
    if (l) bits.push(l);
  }
  if (/produk|terlaris|best ?seller/.test(q)) {
    const l = ctxLine("Produk terlaris") ?? ctxLine("Terlaris");
    if (l) bits.push(l);
  }

  if (bits.length > 0) {
    return (
      "Berdasarkan data toko Anda:\n\n" +
      bits.map((b) => `• ${b.trim()}`).join("\n") +
      "\n\nSaran: fokus tindak lanjuti poin di atas minggu ini. " +
      "(Catatan: jawaban ini dari mode ringkas. Aktifkan OPENAI_API_KEY untuk analisis AI penuh.)"
    );
  }

  // Generic guidance grounded in whatever context exists.
  const summary = context
    .split("\n")
    .filter((l) => l.includes(":") && !l.startsWith("Kamu") && !l.startsWith("Anda adalah"))
    .slice(0, 5)
    .map((l) => `• ${l.trim()}`)
    .join("\n");

  return (
    "Berikut ringkasan kondisi toko Anda saat ini:\n\n" +
    (summary || "• Data belum cukup untuk analisis mendalam.") +
    "\n\nTanyakan hal spesifik seperti \"produk apa yang harus direstock?\" atau " +
    "\"bagaimana cara naikkan omzet minggu ini?\".\n\n" +
    "(Mode ringkas — aktifkan OPENAI_API_KEY untuk jawaban AI penuh.)"
  );
}
