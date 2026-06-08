import { describe, it, expect } from "vitest";
import {
  tierFromSpent,
  applyTierMultiplier,
  spentToNextTier,
  TIER_LADDER,
} from "@/lib/loyalty-tiers";

describe("tierFromSpent", () => {
  it("returns BRONZE for new customers (zero or negative)", () => {
    expect(tierFromSpent(0).tier).toBe("BRONZE");
    expect(tierFromSpent(-100).tier).toBe("BRONZE");
    expect(tierFromSpent(NaN).tier).toBe("BRONZE");
  });

  it("returns BRONZE just below SILVER threshold", () => {
    expect(tierFromSpent(999_999).tier).toBe("BRONZE");
  });

  it("returns SILVER at exactly Rp 1.000.000", () => {
    expect(tierFromSpent(1_000_000).tier).toBe("SILVER");
  });

  it("returns GOLD at Rp 5.000.000", () => {
    expect(tierFromSpent(5_000_000).tier).toBe("GOLD");
    expect(tierFromSpent(10_000_000).tier).toBe("GOLD");
  });

  it("returns PLATINUM at Rp 20.000.000+", () => {
    expect(tierFromSpent(20_000_000).tier).toBe("PLATINUM");
    expect(tierFromSpent(100_000_000).tier).toBe("PLATINUM");
  });
});

describe("applyTierMultiplier", () => {
  it("BRONZE keeps base points unchanged", () => {
    expect(applyTierMultiplier(100, "BRONZE")).toBe(100);
  });

  it("SILVER adds 25% boost", () => {
    expect(applyTierMultiplier(100, "SILVER")).toBe(125);
    expect(applyTierMultiplier(40, "SILVER")).toBe(50);
  });

  it("GOLD adds 50% boost", () => {
    expect(applyTierMultiplier(100, "GOLD")).toBe(150);
  });

  it("PLATINUM doubles points", () => {
    expect(applyTierMultiplier(100, "PLATINUM")).toBe(200);
  });

  it("rounds down — never inflates points beyond floor()", () => {
    expect(applyTierMultiplier(3, "SILVER")).toBe(3); // 3.75 → 3
    expect(applyTierMultiplier(7, "GOLD")).toBe(10);  // 10.5 → 10
  });

  it("guards against invalid input", () => {
    expect(applyTierMultiplier(0, "GOLD")).toBe(0);
    expect(applyTierMultiplier(-5, "PLATINUM")).toBe(0);
    expect(applyTierMultiplier(NaN, "SILVER")).toBe(0);
  });
});

describe("spentToNextTier", () => {
  it("shows path from BRONZE to SILVER", () => {
    const r = spentToNextTier(500_000);
    expect(r).not.toBeNull();
    expect(r!.nextTier.tier).toBe("SILVER");
    expect(r!.remaining).toBe(500_000);
  });

  it("returns null when already PLATINUM (no upgrade left)", () => {
    expect(spentToNextTier(50_000_000)).toBeNull();
  });

  it("never returns negative remaining", () => {
    const r = spentToNextTier(999_999);
    expect(r!.remaining).toBeGreaterThanOrEqual(0);
  });
});

describe("TIER_LADDER invariants", () => {
  it("thresholds are strictly increasing", () => {
    for (let i = 1; i < TIER_LADDER.length; i++) {
      expect(TIER_LADDER[i].minSpent).toBeGreaterThan(TIER_LADDER[i - 1].minSpent);
    }
  });

  it("multipliers are non-decreasing (higher tier never worse)", () => {
    for (let i = 1; i < TIER_LADDER.length; i++) {
      expect(TIER_LADDER[i].pointMultiplier).toBeGreaterThanOrEqual(
        TIER_LADDER[i - 1].pointMultiplier,
      );
    }
  });

  it("every tier has a label, color, and perk", () => {
    for (const t of TIER_LADDER) {
      expect(t.label).toBeTruthy();
      expect(t.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.perk).toBeTruthy();
    }
  });
});
