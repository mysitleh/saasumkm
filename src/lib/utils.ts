import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ORD-${d}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  PAID_MANUAL: "Sudah Dibayar",
  PROCESSING: "Diproses",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  WAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID_MANUAL: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

/**
 * Bersihkan input string dasar: trim & buang karakter HTML control.
 * Bukan pengganti DOMPurify untuk render HTML — ini untuk plain text fields.
 */
export function sanitizeText(input: string | null | undefined, maxLen = 500): string {
  if (!input) return "";
  return input.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, maxLen);
}

/**
 * Resolve base URL untuk app (untuk link absolut di email/WA).
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
