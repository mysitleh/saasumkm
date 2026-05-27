import { describe, it, expect } from "vitest";
import { formatRupiah, generateOrderNumber, sanitizeText } from "@/lib/utils";

describe("formatRupiah", () => {
  it("formats integers as Indonesian rupiah", () => {
    expect(formatRupiah(25000).replace(/\u00a0/g, " ")).toBe("Rp 25.000");
    expect(formatRupiah(1_000_000).replace(/\u00a0/g, " ")).toBe("Rp 1.000.000");
  });

  it("handles zero", () => {
    expect(formatRupiah(0).replace(/\u00a0/g, " ")).toBe("Rp 0");
  });
});

describe("generateOrderNumber", () => {
  it("matches expected format", () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^ORD-\d{8}-\d{4}$/);
  });

  it("produces different values across calls", () => {
    const set = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    // Sangat tidak mungkin dapat banyak duplikat dengan 9000 ruang.
    expect(set.size).toBeGreaterThan(40);
  });
});

describe("sanitizeText", () => {
  it("trims and strips control + < >", () => {
    expect(sanitizeText("  Hello <script>  ")).toBe("Hello script");
  });

  it("respects max length", () => {
    expect(sanitizeText("abcdefg", 3)).toBe("abc");
  });

  it("returns empty for null/undefined", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
  });
});
