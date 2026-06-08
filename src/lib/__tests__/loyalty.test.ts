import { describe, it, expect } from "vitest";
import { calculatePoints, pointsToDiscount } from "@/lib/loyalty";

describe("calculatePoints", () => {
  it("awards 1 point per Rp 10.000 spent", () => {
    expect(calculatePoints(10_000)).toBe(1);
    expect(calculatePoints(50_000)).toBe(5);
    expect(calculatePoints(100_000)).toBe(10);
  });

  it("rounds down (floor) — partial 10K does not earn a point", () => {
    expect(calculatePoints(9_999)).toBe(0);
    expect(calculatePoints(19_999)).toBe(1);
    expect(calculatePoints(25_500)).toBe(2);
  });

  it("returns 0 for zero, negative, or non-finite input (safe default)", () => {
    expect(calculatePoints(0)).toBe(0);
    expect(calculatePoints(-1)).toBe(0);
    expect(calculatePoints(-50_000)).toBe(0);
    expect(calculatePoints(NaN)).toBe(0);
    expect(calculatePoints(Infinity)).toBe(0);
    expect(calculatePoints(-Infinity)).toBe(0);
  });

  it("handles large totals without overflow", () => {
    expect(calculatePoints(1_000_000)).toBe(100);
    expect(calculatePoints(50_000_000)).toBe(5_000);
  });
});

describe("pointsToDiscount", () => {
  it("converts 100 points to Rp 10.000 discount", () => {
    expect(pointsToDiscount(100)).toBe(10_000);
    expect(pointsToDiscount(500)).toBe(50_000);
    expect(pointsToDiscount(1_000)).toBe(100_000);
  });

  it("rounds down — fewer than 100 points yields zero discount", () => {
    expect(pointsToDiscount(99)).toBe(0);
    expect(pointsToDiscount(199)).toBe(10_000);
  });

  it("returns 0 for zero, negative, or non-finite input", () => {
    expect(pointsToDiscount(0)).toBe(0);
    expect(pointsToDiscount(-100)).toBe(0);
    expect(pointsToDiscount(NaN)).toBe(0);
    expect(pointsToDiscount(Infinity)).toBe(0);
  });

  it("never produces fractional rupiah", () => {
    for (const p of [101, 150, 199, 250, 333, 777]) {
      const discount = pointsToDiscount(p);
      expect(discount % 10_000).toBe(0);
    }
  });
});

describe("loyalty round-trip economics", () => {
  it("earning then redeeming preserves a 1% effective cashback rate", () => {
    // Spend Rp 1.000.000 → earn 100 points → redeem 100 points = Rp 10.000 discount
    // Effective rate = 10.000 / 1.000.000 = 1%
    const spent = 1_000_000;
    const earned = calculatePoints(spent);
    const discount = pointsToDiscount(earned);
    expect(discount / spent).toBeCloseTo(0.01, 5);
  });
});
