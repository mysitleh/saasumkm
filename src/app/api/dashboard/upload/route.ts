import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, unauthorized, badRequest } from "@/lib/api-handler";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Upload gambar ke Cloudinary (jika dikonfigurasi).
 * Bila tidak, return data URL (cocok untuk dev / fallback ringan).
 *
 * Catatan: data URL akan disimpan di DB. Untuk production, atur Cloudinary
 * agar gambar tidak membebani DB.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const rl = rateLimit(`upload:${session.user.id}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) throw badRequest("Terlalu banyak upload, coba lagi nanti.");

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw badRequest("File tidak ditemukan.");
  if (!ALLOWED.has(file.type)) throw badRequest("Tipe file harus JPG/PNG/WEBP/GIF.");
  if (file.size > MAX_BYTES) throw badRequest("Ukuran file maksimal 2 MB.");

  const buf = Buffer.from(await file.arrayBuffer());

  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    return uploadToCloudinary(buf, file.type, session.user.tenantId);
  }

  // Fallback: data URL (kecil, langsung pakai)
  const base64 = buf.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;
  return NextResponse.json({ url: dataUrl, provider: "data-url" });
});

async function uploadToCloudinary(buf: Buffer, mime: string, folder: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folderName = `saasumkm/${folder}`;
  const paramsToSign = `folder=${folderName}&timestamp=${timestamp}`;
  const crypto = await import("node:crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`${paramsToSign}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: mime }));
  form.append("api_key", env.CLOUDINARY_API_KEY!);
  form.append("timestamp", String(timestamp));
  form.append("folder", folderName);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Cloudinary error: ${text.slice(0, 200)}` }, { status: 502 });
  }
  const data = (await res.json()) as { secure_url?: string };
  return NextResponse.json({ url: data.secure_url, provider: "cloudinary" });
}
