import { describe, it, expect } from "vitest";
import { calculatePpn, formatTaxLines, PPN_RATE } from "@/lib/tax";

describe("calculatePpn — EXCLUSIVE mode (tax added on top)", () => {
  it("adds 11% PPN to base price", () => {
    const r = calculatePpn(100_000, "EXCLUSIVE");
    expect(r.base).toBe(100_000);
    expect(r.tax).toBe(11_000);
    expect(r.total).toBe(111_000);
    expect(r.rate).toBe(PPN_RATE);
  });

  it("defaults to EXCLUSIVE mode", () => {
    const r = calculatePpn(50_000);
    expect(r.tax).toBe(5_500);
    expect(r.total).toBe(55_500);
  });

  it("rounds tax to nearest rupiah", () => {
    const r = calculatePpn(33_333, "EXCLUSIVE");
    expect(r.tax).toBe(Math.round(33_333 * 0.11)); // 3667
    expect(r.total).toBe(33_333 + r.tax);
  });
});

describe("calculatePpn — INCLUSIVE mode (tax extracted from total)", () => {
  it("extracts PPN from a tax-inclusive price", () => {
    const r = calculatePpn(111_000, "INCLUSIVE");
    expect(r.base).toBe(100_000);
    expect(r.tax).toBe(11_000);
    expect(r.total).toBe(111_000);
  });

  it("base + tax always equals the original total (no rupiah lost)", () => {
    for (const amount of [10_000, 55_500, 99_999, 250_000, 1_000_001]) {
      const r = calculatePpn(amount, "INCLUSIVE");
      expect(r.base + r.tax).toBe(amount);
      expect(r.total).toBe(amount);
    }
  });
});

describe("calculatePpn — edge cases", () => {
  it("returns zeros for non-positive or non-finite input", () => {
    for (const bad of [0, -100, NaN, Infinity, -Infinity]) {
      const r = calculatePpn(bad);
      expect(r.base).toBe(0);
      expect(r.tax).toBe(0);
      expect(r.total).toBe(0);
    }
  });

  it("supports a custom rate (e.g. future 12% PPN)", () => {
    const r = calculatePpn(100_000, "EXCLUSIVE", 0.12);
    expect(r.tax).toBe(12_000);
    expect(r.total).toBe(112_000);
  });
});

describe("formatTaxLines", () => {
  it("produces DPP / PPN / Total rows with the rate in the label", () => {
    const breakdown = calculatePpn(100_000, "EXCLUSIVE");
    const lines = formatTaxLines(breakdown);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({ label: "Subtotal (DPP)", value: 100_000 });
    expect(lines[1]).toEqual({ label: "PPN 11%", value: 11_000 });
    expect(lines[2]).toEqual({ label: "Total", value: 111_000 });
  });

  it("reflects a custom rate in the PPN label", () => {
    const breakdown = calculatePpn(100_000, "EXCLUSIVE", 0.12);
    const lines = formatTaxLines(breakdown);
    expect(lines[1].label).toBe("PPN 12%");
  });
});
