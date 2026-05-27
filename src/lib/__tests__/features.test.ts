import { describe, it, expect } from "vitest";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES } from "@/lib/features";

describe("PLAN_FEATURES matrix", () => {
  it("BASIC limits products to 50", () => {
    expect(PLAN_FEATURES.BASIC.maxProducts).toBe(50);
    expect(PLAN_FEATURES.BASIC.qrisDynamic).toBe(false);
  });

  it("PRO unlocks QRIS dinamis", () => {
    expect(PLAN_FEATURES.PRO.qrisDynamic).toBe(true);
    expect(PLAN_FEATURES.PRO.exportCsv).toBe(true);
    expect(PLAN_FEATURES.PRO.maxProducts).toBe(Number.POSITIVE_INFINITY);
  });

  it("BUSINESS adds multi outlet", () => {
    expect(PLAN_FEATURES.BUSINESS.multiOutlet).toBe(true);
    expect(PLAN_FEATURES.BUSINESS.staffManagement).toBe(true);
  });
});

describe("PLAN metadata", () => {
  it("each plan has label & price", () => {
    expect(PLAN_LABELS.BASIC).toBe("Basic");
    expect(PLAN_LABELS.PRO).toBe("Pro");
    expect(PLAN_LABELS.BUSINESS).toBe("Business");
    expect(PLAN_PRICES.BASIC).toBe(0);
    expect(PLAN_PRICES.PRO).toBeGreaterThan(0);
    expect(PLAN_PRICES.BUSINESS).toBeGreaterThan(PLAN_PRICES.PRO);
  });
});
