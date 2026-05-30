import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { withErrorHandler, unauthorized, tooMany } from "@/lib/api-handler";
import { rateLimit } from "@/lib/rate-limit";
import { chatComplete } from "@/lib/ai";

const schema = z.object({
  productName: z.string().min(1).max(120),
  category: z.string().max(50).optional(),
  type: z.enum(["description", "promo", "whatsapp", "seo", "hashtags"]).default("description"),
  tone: z.enum(["santai", "profesional", "lucu", "mewah"]).optional(),
});

type GenData = z.infer<typeof schema>;

/**
 * AI content generation — product descriptions, promo captions, WhatsApp
 * broadcast copy, SEO meta, and hashtag sets. Uses the central AI engine
 * (OpenAI when configured, deterministic templates otherwise).
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const rl = rateLimit(`ai:${session.user.id}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) throw tooMany("Terlalu banyak permintaan AI, coba lagi nanti.");

  const data = schema.parse(await req.json());

  try {
    const result = await chatComplete(
      [
        { role: "system", content: "Kamu copywriter ahli untuk UMKM Indonesia. Tulis dalam Bahasa Indonesia, tanpa markdown." },
        { role: "user", content: buildPrompt(data) },
      ],
      { maxTokens: 220, temperature: 0.75 },
    );
    if (result.provider === "fallback") return NextResponse.json(generateFallback(data));
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch {
    return NextResponse.json(generateFallback(data));
  }
});

function buildPrompt(d: GenData): string {
  const tone = d.tone ? ` Gunakan nada ${d.tone}.` : "";
  const cat = d.category ? ` kategori ${d.category}` : "";
  switch (d.type) {
    case "promo":
      return `Buat caption promosi Instagram/WhatsApp untuk produk "${d.productName}"${cat}. Pakai emoji, CTA kuat, maks 100 kata.${tone}`;
    case "whatsapp":
      return `Buat pesan WhatsApp broadcast untuk menawarkan "${d.productName}"${cat} ke pelanggan. Ramah, personal, ada CTA. Maks 90 kata.${tone}`;
    case "seo":
      return `Buat meta title (maks 60 karakter) dan meta description (maks 155 karakter) SEO untuk halaman produk "${d.productName}"${cat}. Format: "Title: ...\\nDescription: ...".`;
    case "hashtags":
      return `Buat 12 hashtag relevan untuk produk "${d.productName}"${cat} di Instagram/TikTok, dipisah spasi, diawali #.`;
    default:
      return `Buat deskripsi produk menarik untuk "${d.productName}"${cat}. Maks 80 kata, fokus manfaat dan keunikan.${tone}`;
  }
}

function generateFallback(data: GenData) {
  const name = data.productName;
  const cat = data.category || "produk";

  if (data.type === "promo") {
    const t = [
      `🔥 PROMO SPESIAL! ${name} sekarang tersedia dengan harga terbaik! Yuk order sebelum kehabisan. Pesan via link di bio! 🛒✨`,
      `✨ Cobain ${name} yang lagi hits! Rasanya bikin nagih, harganya ramah di kantong. Order sekarang, gratis ongkir! 🚀`,
    ];
    return { text: t[Math.floor(Math.random() * t.length)], provider: "template" };
  }
  if (data.type === "whatsapp") {
    return { text: `Halo Kak! 👋 Ada kabar baik, ${name} kami lagi ready nih. Kualitas terjamin, harga bersahabat. Mau pesan sekarang? Balas chat ini ya 😊`, provider: "template" };
  }
  if (data.type === "seo") {
    return { text: `Title: ${name} Berkualitas - Pesan Online\nDescription: Beli ${name} ${cat} terbaik dengan harga terjangkau. Pesan mudah, pengiriman cepat. Order sekarang!`, provider: "template" };
  }
  if (data.type === "hashtags") {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return { text: `#${slug} #${cat.replace(/\s+/g, "")} #umkm #umkmindonesia #jajananviral #kulinerindonesia #produklokal #belanjaonline #promo #readystock #orderhere #supportlokal`, provider: "template" };
  }
  const t = [
    `${name} — pilihan terbaik untuk pecinta ${cat}. Dibuat dengan bahan berkualitas dan proses higienis. Cocok dinikmati kapan saja.`,
    `Nikmati ${name} yang fresh dan berkualitas. Produk ${cat} favorit pelanggan kami. Pesan sekarang dan rasakan bedanya!`,
  ];
  return { text: t[Math.floor(Math.random() * t.length)], provider: "template" };
}
