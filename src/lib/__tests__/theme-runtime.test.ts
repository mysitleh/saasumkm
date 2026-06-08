import { describe, it, expect } from "vitest";
import {
  resolveTenantTheme,
  contrastOnColor,
  isValidHex,
} from "@/lib/theme-runtime";

describe("resolveTenantTheme", () => {
  it("returns defaults when all fields are null/undefined", () => {
    const theme = resolveTenantTheme({});
    expect(theme.mode).toBe("light");
    expect(theme.primary).toBe("#10b981"); // green preset default
    expect(theme.font).toBe("Inter");
    expect(theme.radius).toBe(12);
  });

  it("overrides with custom values when provided", () => {
    const theme = resolveTenantTheme({
      themeMode: "dark",
      themePrimary: "#ff0000",
      themeAccent: "#00ff00",
      themeSurface: "#111111",
      themeInk: "#eeeeee",
      themeRadius: 20,
      themeFont: "Poppins",
    });
    expect(theme.mode).toBe("dark");
    expect(theme.primary).toBe("#ff0000");
    expect(theme.accent).toBe("#00ff00");
    expect(theme.surface).toBe("#111111");
    expect(theme.ink).toBe("#eeeeee");
    expect(theme.radius).toBe(20);
    expect(theme.font).toBe("Poppins");
  });

  it("uses legacy preset colors when custom primary/accent not set", () => {
    const theme = resolveTenantTheme({ themeColor: "purple" });
    expect(theme.primary).toBe("#7c3aed");
    expect(theme.accent).toBe("#a78bfa");
  });

  it("falls back to green if themeColor is unknown", () => {
    const theme = resolveTenantTheme({ themeColor: "neon" });
    expect(theme.primary).toBe("#10b981");
  });
});

describe("contrastOnColor", () => {
  it("returns white for dark colors", () => {
    expect(contrastOnColor("#000000")).toBe("#ffffff");
    expect(contrastOnColor("#1a1a1a")).toBe("#ffffff");
    expect(contrastOnColor("#7c3aed")).toBe("#ffffff");
  });

  it("returns dark ink for light colors", () => {
    expect(contrastOnColor("#ffffff")).toBe("#0a0a0a");
    expect(contrastOnColor("#c1fbd4")).toBe("#0a0a0a");
  });

  it("handles 3-char hex gracefully (returns white as fallback)", () => {
    // Implementation checks h.length < 6 → returns white
    expect(contrastOnColor("#fff")).toBe("#ffffff");
  });
});

describe("isValidHex", () => {
  it("accepts valid 3-char and 6-char hex codes", () => {
    expect(isValidHex("#abc")).toBe(true);
    expect(isValidHex("#ABC")).toBe(true);
    expect(isValidHex("#10b981")).toBe(true);
    expect(isValidHex("#FFFFFF")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidHex("10b981")).toBe(false);    // no hash
    expect(isValidHex("#1234")).toBe(false);      // 4 chars
    expect(isValidHex("#12345")).toBe(false);     // 5 chars
    expect(isValidHex("#gggggg")).toBe(false);    // invalid hex chars
    expect(isValidHex("")).toBe(false);
    expect(isValidHex("red")).toBe(false);
  });
});
