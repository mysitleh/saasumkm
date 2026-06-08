/**
 * Indonesian tax (PPN) calculator.
 *
 * PPN (Pajak Pertambahan Nilai) = Indonesian VAT, currently 11%
 * (UU HPP, berlaku sejak 1 April 2022; akan naik ke 12% sesuai roadmap).
 *
 * Mendukung dua mode harga umum di UMKM:
 *   - EXCLUSIVE: harga belum termasuk PPN → PPN ditambahkan di atas
 *   - INCLUSIVE: harga sudah termasuk PPN → PPN diekstrak dari total
 *
 * Semua perhitungan integer-rupiah (tanpa pecahan sen). Pure functions.
 */

export const PPN_RATE = 0.11; // 11%

export type TaxMode = "EXCLUSIVE" | "INCLUSIVE";

export interface TaxBreakdown {
  /** Harga dasar sebelum pajak (DPP — Dasar Pengenaan Pajak). */
  base: number;
  /** Nilai PPN. */
  tax: number;
  /** Total termasuk PPN. */
  total: number;
  rate: number;
}

/**
 * Hitung PPN dari sebuah harga.
 *
 * @param amount  Harga input (arti tergantung mode).
 * @param mode    EXCLUSIVE: amount = base, PPN ditambah di atas.
 *                INCLUSIVE: amount = total, PPN diekstrak dari dalam.
 * @param rate    Tarif pajak (default PPN_RATE = 0.11).
 */
export function calculatePpn(
  amount: number,
  mode: TaxMode = "EXCLUSIVE",
  rate: number = PPN_RATE,
): TaxBreakdown {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { base: 0, tax: 0, total: 0, rate };
  }
  if (mode === "INCLUSIVE") {
    // amount sudah termasuk pajak. base = amount / (1 + rate).
    const base = Math.round(amount / (1 + rate));
    const tax = amount - base;
    return { base, tax, total: amount, rate };
  }
  // EXCLUSIVE: pajak ditambahkan di atas base.
  const tax = Math.round(amount * rate);
  return { base: amount, tax, total: amount + tax, rate };
}

/**
 * Format breakdown pajak jadi baris-baris siap tampil di struk/invoice.
 */
export function formatTaxLines(breakdown: TaxBreakdown): { label: string; value: number }[] {
  const pct = Math.round(breakdown.rate * 100);
  return [
    { label: "Subtotal (DPP)", value: breakdown.base },
    { label: `PPN ${pct}%`, value: breakdown.tax },
    { label: "Total", value: breakdown.total },
  ];
}
