import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}
export function generateOrderNumber(): string {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `ORD-${d}-${Math.floor(Math.random()*9000)+1000}`;
}
export const ORDER_STATUS_LABELS: Record<string,string> = {
  WAITING_PAYMENT:"Menunggu Pembayaran", PAID_MANUAL:"Sudah Dibayar", PROCESSING:"Diproses", COMPLETED:"Selesai", CANCELLED:"Dibatalkan"
};
export const ORDER_STATUS_COLORS: Record<string,string> = {
  WAITING_PAYMENT:"bg-yellow-100 text-yellow-800", PAID_MANUAL:"bg-blue-100 text-blue-800",
  PROCESSING:"bg-purple-100 text-purple-800", COMPLETED:"bg-green-100 text-green-800", CANCELLED:"bg-red-100 text-red-800"
};
