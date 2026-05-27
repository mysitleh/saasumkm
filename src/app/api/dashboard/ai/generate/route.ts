import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { withErrorHandler, unauthorized, badRequest } from "@/lib/api-handler";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productName: z.string().min(1).max(120),
  category: z.string().max(50).optional(),
  type: z.enum(["description", "promo"]).default("description"),
});

/**
 * AI-powered text generation untuk deskripsi produk dan caption promo.
 *
 * Jika OPENAI_API_KEY tidak di-set, gunakan template sederhana (fallback).
 * Ini memungkinkan fitur tetap berjalan tanpa biaya API di awal.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const rl = rateLimit(`ai:${session.user.id}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) throw badRequest("Terlalu banyak permintaan AI, coba lagi nanti.");

  const data = schema.parse(await req.json());
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    return generateWithOpenAI(apiKey, data);
  }
  return generateFallback(data);
});

async function generateWithOpenAI(
  apiKey: string,
  data: { productName: string; category?: string; type: string },
) {
  const prompt =
    data.type === "description"
      ? `Buat deskripsi produk yang menarik untuk "${data.productName}"${data.category ? ` kategori ${data.category}` : ""}. Maksimal 80 kata, bahasa Indonesia, fokus pada manfaat dan keunikan produk. Jangan gunakan markdown.`
      : `Buat caption promosi Instagram/WhatsApp untuk produk "${data.productName}"${data.category ? ` kategori ${data.category}` : ""}. Gunakan emoji, bahasa santai, dan CTA yang kuat. Maksimal 100 kata.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 100)}` }, { status: 502 });
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return NextResponse.json({ text, provider: "openai" });
}

function generateFallback(data: { productName: string; category?: string; type: string }) {
  const name = data.productName;
  const cat = data.category || "produk";

  if (data.type === "promo") {
    const templates = [
      `🔥 PROMO SPESIAL! ${name} sekarang tersedia dengan harga terbaik! Yuk order sekarang sebelum kehabisan. Pesan via link di bio! 🛒✨`,
      `✨ Cobain ${name} yang lagi hits! Rasanya bikin nagih, harganya ramah di kantong. Order sekarang, gratis ongkir! 🚀`,
      `🎉 ${name} READY STOCK! Kualitas premium, harga bersahabat. Langsung order ya, stok terbatas! 💯`,
    ];
    return NextResponse.json({ text: templates[Math.floor(Math.random() * templates.length)], provider: "template" });
  }

  const templates = [
    `${name} — pilihan terbaik untuk pecinta ${cat}. Dibuat dengan bahan berkualitas dan proses yang higienis. Cocok untuk dinikmati kapan saja.`,
    `Nikmati ${name} yang fresh dan berkualitas. Produk ${cat} favorit pelanggan kami. Pesan sekarang dan rasakan bedanya!`,
    `${name} hadir untuk memenuhi kebutuhan ${cat} Anda. Kualitas terjamin, rasa yang konsisten, dan harga yang terjangkau.`,
  ];
  return NextResponse.json({ text: templates[Math.floor(Math.random() * templates.length)], provider: "template" });
}
