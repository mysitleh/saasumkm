/**
 * Loyalty Tier System — Bronze / Silver / Gold / Platinum
 *
 * Tier ditentukan dari total belanja kumulatif (totalSpent) di LoyaltyCard.
 * Setiap tier memberi point multiplier saat earning, sehingga pelanggan
 * loyal mendapat poin lebih cepat — pendorong retensi jangka panjang.
 *
 * Semua fungsi di sini PURE (tidak akses DB) supaya gampang ditest dan
 * bisa dipakai untuk preview di UI tanpa side-effect.
 */

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface TierDefinition {
  tier: LoyaltyTier;
  label: string;
  /** Total spent threshold (IDR) untuk masuk tier ini. */
  minSpent: number;
  /** Multiplier poin saat earning (1.0 = no boost). */
  pointMultiplier: number;
  /** Warna badge — siap dipakai di UI tanpa lookup tambahan. */
  color: string;
  /** Deskripsi singkat untuk dashboard customer. */
  perk: string;
}

/**
 * Tier ladder. Urut dari rendah ke tinggi.
 * Threshold IDR realistis untuk UMKM Indonesia:
 *   - BRONZE: 0 (default semua customer)
 *   - SILVER: Rp 1.000.000 (≈ 100 transaksi @ 10rb)
 *   - GOLD: Rp 5.000.000 (loyal regular)
 *   - PLATINUM: Rp 20.000.000 (whale customer)
 */
export const TIER_LADDER: TierDefinition[] = [
  {
    tier: "BRONZE",
    label: "Bronze",
    minSpent: 0,
    pointMultiplier: 1.0,
    color: "#a78661",
    perk: "Selamat datang! Mulai kumpulkan poin.",
  },
  {
    tier: "SILVER",
    label: "Silver",
    minSpent: 1_000_000,
    pointMultiplier: 1.25,
    color: "#94a3b8",
    perk: "+25% poin di setiap belanja.",
  },
  {
    tier: "GOLD",
    label: "Gold",
    minSpent: 5_000_000,
    pointMultiplier: 1.5,
    color: "#eab308",
    perk: "+50% poin & akses promo eksklusif.",
  },
  {
    tier: "PLATINUM",
    label: "Platinum",
    minSpent: 20_000_000,
    pointMultiplier: 2.0,
    color: "#7c3aed",
    perk: "Poin 2x lipat, prioritas pelayanan, perks spesial.",
  },
];

/**
 * Tentukan tier berdasarkan total spent.
 * Selalu return tier valid (minimal BRONZE).
 */
export function tierFromSpent(totalSpent: number): TierDefinition {
  if (!Number.isFinite(totalSpent) || totalSpent <= 0) return TIER_LADDER[0];
  // Cari tier tertinggi yang masih ≤ totalSpent.
  let current = TIER_LADDER[0];
  for (const t of TIER_LADDER) {
    if (totalSpent >= t.minSpent) current = t;
    else break;
  }
  return current;
}

/**
 * Hitung poin dengan multiplier tier diterapkan.
 * basePoints biasanya hasil dari calculatePoints(orderTotal) di loyalty.ts.
 */
export function applyTierMultiplier(basePoints: number, tier: LoyaltyTier): number {
  if (!Number.isFinite(basePoints) || basePoints <= 0) return 0;
  const def = TIER_LADDER.find((t) => t.tier === tier) ?? TIER_LADDER[0];
  return Math.floor(basePoints * def.pointMultiplier);
}

/**
 * Berapa Rupiah lagi untuk naik ke tier berikutnya?
 * Return null jika sudah di tier tertinggi.
 */
export function spentToNextTier(
  totalSpent: number,
): { nextTier: TierDefinition; remaining: number } | null {
  const current = tierFromSpent(totalSpent);
  const idx = TIER_LADDER.findIndex((t) => t.tier === current.tier);
  if (idx === -1 || idx >= TIER_LADDER.length - 1) return null;
  const next = TIER_LADDER[idx + 1];
  return { nextTier: next, remaining: Math.max(0, next.minSpent - totalSpent) };
}
