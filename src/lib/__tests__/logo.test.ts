import { describe, it, expect } from "vitest";
import { parseLogoConfig, DEFAULT_LOGO } from "@/lib/logo";

describe("parseLogoConfig", () => {
  it("returns null for empty/nullish input", () => {
    expect(parseLogoConfig(null)).toBeNull();
    expect(parseLogoConfig(undefined)).toBeNull();
    expect(parseLogoConfig("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseLogoConfig("{not json")).toBeNull();
    expect(parseLogoConfig("undefined")).toBeNull();
  });

  it("returns null when required keys are missing or wrong type", () => {
    expect(parseLogoConfig(JSON.stringify({ shape: "circle" }))).toBeNull();
    expect(parseLogoConfig(JSON.stringify({ symbol: "bag" }))).toBeNull();
    expect(parseLogoConfig(JSON.stringify({ shape: 1, symbol: 2 }))).toBeNull();
    expect(parseLogoConfig(JSON.stringify([1, 2, 3]))).toBeNull();
  });

  it("merges a valid partial config over DEFAULT_LOGO", () => {
    const result = parseLogoConfig(JSON.stringify({ shape: "hexagon", symbol: "bolt" }));
    expect(result).not.toBeNull();
    expect(result!.shape).toBe("hexagon");
    expect(result!.symbol).toBe("bolt");
    // Unspecified fields fall back to defaults
    expect(result!.fill).toBe(DEFAULT_LOGO.fill);
    expect(result!.color).toBe(DEFAULT_LOGO.color);
    expect(result!.accent).toBe(DEFAULT_LOGO.accent);
  });

  it("preserves all provided custom fields", () => {
    const custom = {
      shape: "diamond",
      symbol: "monogram",
      fill: "outline",
      color: "#000000",
      accent: "#ffffff",
      initial: "Z",
      pip: false,
    };
    const result = parseLogoConfig(JSON.stringify(custom));
    expect(result).toMatchObject(custom);
  });

  it("round-trips a serialized DEFAULT_LOGO", () => {
    const result = parseLogoConfig(JSON.stringify(DEFAULT_LOGO));
    expect(result).toMatchObject(DEFAULT_LOGO);
  });
});
