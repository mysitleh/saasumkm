import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/notifications";

describe("normalizePhone", () => {
  it("converts leading 0 to 62", () => {
    expect(normalizePhone("08123456789")).toBe("628123456789");
  });

  it("strips formatting characters", () => {
    expect(normalizePhone("+62 812-3456-789")).toBe("628123456789");
  });

  it("returns null for invalid", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});
