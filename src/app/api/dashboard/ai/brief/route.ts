import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, unauthorized, forbidden, tooMany } from "@/lib/api-handler";
import { rateLimit } from "@/lib/rate-limit";
import { hasFeature } from "@/lib/features";
import { chatComplete } from "@/lib/ai";
import { buildBusinessContext } from "@/lib/ai-context";

/**
 * AI Daily Brief — an executive summary + prioritized action list generated
 * from the live business snapshot. Powers the AI hub "today" card.
 */
export const POST = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (!(await hasFeature(session.user.tenantId, "aiAssistant"))) {
    throw forbidden("AI Assistant tersedia di paket Pro ke atas.");
  }
  const rl = rateLimit(`ai-brief:${session.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) throw tooMany("Tunggu sebentar sebelum minta brief lagi.");

  const snapshot = await buildBusinessContext(session.user.tenantId);
  const prompt = [
    "Buat ringkasan harian singkat untuk owner toko ini dalam Bahasa Indonesia.",
    "Format JSON valid TANPA markdown, persis seperti ini:",
    '{"headline":"...","summary":"...","actions":["...","...","..."]}',
    "- headline: 1 kalimat pendek kondisi bisnis hari ini.",
    "- summary: 2-3 kalimat insight dari data.",
    "- actions: 3 langkah konkret prioritas hari ini.",
    "Gunakan angka nyata dari DATA TOKO.",
    "",
    "=== DATA TOKO ===",
    snapshot.context,
  ].join("\n");

  const result = await chatComplete(
    [
      { role: "system", content: "Kamu analis bisnis ritel. Keluarkan HANYA JSON valid, tanpa teks lain." },
      { role: "user", content: prompt },
    ],
    { maxTokens: 500, temperature: 0.4 },
  );

  // Parse model output into a structured brief; fall back to a heuristic one.
  const parsed = safeParseBrief(result.text);
  if (parsed) return NextResponse.json({ ...parsed, provider: result.provider });

  return NextResponse.json({
    headline: snapshot.context.split("\n")[2] ?? "Ringkasan bisnis hari ini",
    summary: result.text.slice(0, 280) || "Belum cukup data untuk ringkasan mendalam.",
    actions: heuristicActions(snapshot.context),
    provider: result.provider,
  });
});

function safeParseBrief(text: string): { headline: string; summary: string; actions: string[] } | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    const obj = JSON.parse(text.slice(start, end + 1));
    if (typeof obj.headline === "string" && Array.isArray(obj.actions)) {
      return {
        headline: String(obj.headline),
        summary: String(obj.summary ?? ""),
        actions: obj.actions.slice(0, 5).map((a: unknown) => String(a)),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function heuristicActions(context: string): string[] {
  const actions: string[] = [];
  if (/menunggu konfirmasi bayar: ([1-9])/i.test(context)) actions.push("Konfirmasi pesanan yang menunggu pembayaran.");
  if (/Stok menipis|sisa 0|sisa 1|sisa 2/i.test(context)) actions.push("Restock produk yang stoknya menipis.");
  if (/berisiko churn/i.test(context)) actions.push("Kirim promo ke pelanggan yang berisiko churn.");
  if (actions.length === 0) actions.push("Bagikan link toko ke pelanggan via WhatsApp untuk dorong order.");
  return actions;
}
