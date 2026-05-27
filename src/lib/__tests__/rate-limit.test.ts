import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = rateLimit(key, { limit: 3, windowMs: 1000 });
      expect(r.ok).toBe(true);
    }
  });

  it("blocks once limit exceeded", () => {
    const key = `t:${Math.random()}`;
    rateLimit(key, { limit: 2, windowMs: 1000 });
    rateLimit(key, { limit: 2, windowMs: 1000 });
    const r = rateLimit(key, { limit: 2, windowMs: 1000 });
    expect(r.ok).toBe(false);
  });
});
