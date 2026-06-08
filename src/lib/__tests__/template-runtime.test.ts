import { describe, it, expect } from "vitest";
import {
  resolveTemplate,
  buttonRadius,
  DEFAULT_TEMPLATE,
} from "@/lib/template-runtime";

describe("resolveTemplate", () => {
  it("returns defaults when all fields are null/empty", () => {
    const config = resolveTemplate({});
    expect(config).toMatchObject(DEFAULT_TEMPLATE);
  });

  it("overrides individual fields", () => {
    const config = resolveTemplate({
      layoutTemplate: "magazine",
      buttonStyle: "square",
      heroEnabled: false,
    });
    expect(config.layoutTemplate).toBe("magazine");
    expect(config.buttonStyle).toBe("square");
    expect(config.heroEnabled).toBe(false);
    // Non-overridden keep defaults
    expect(config.iconStyle).toBe("regular");
    expect(config.categoryStyle).toBe("chips");
  });

  it("parses carouselProductIds JSON string to array", () => {
    const config = resolveTemplate({
      carouselProductIds: JSON.stringify(["prod1", "prod2", "prod3"]),
      carouselEnabled: true,
    });
    expect(config.carouselEnabled).toBe(true);
    expect(config.carouselProductIds).toEqual(["prod1", "prod2", "prod3"]);
  });

  it("filters out non-string values from carouselProductIds", () => {
    const config = resolveTemplate({
      carouselProductIds: JSON.stringify(["valid", 123, null, "also-valid"]),
    });
    expect(config.carouselProductIds).toEqual(["valid", "also-valid"]);
  });

  it("handles malformed JSON in carouselProductIds gracefully (empty array)", () => {
    const config = resolveTemplate({ carouselProductIds: "{broken" });
    expect(config.carouselProductIds).toEqual([]);
  });

  it("handles non-array JSON in carouselProductIds gracefully", () => {
    const config = resolveTemplate({ carouselProductIds: JSON.stringify({ not: "array" }) });
    expect(config.carouselProductIds).toEqual([]);
  });
});

describe("buttonRadius", () => {
  it("pill and ghost always return 9999 regardless of tenant radius", () => {
    expect(buttonRadius("pill", 0)).toBe(9999);
    expect(buttonRadius("pill", 28)).toBe(9999);
    expect(buttonRadius("ghost", 0)).toBe(9999);
    expect(buttonRadius("ghost", 28)).toBe(9999);
  });

  it("rounded returns at least 8, respects tenant radius if larger", () => {
    expect(buttonRadius("rounded", 20)).toBe(20);
    expect(buttonRadius("rounded", 6)).toBe(8);  // clamped to min 8
    expect(buttonRadius("rounded", 0)).toBe(8);
  });

  it("square returns at most 4, respects tenant radius if smaller", () => {
    expect(buttonRadius("square", 20)).toBe(4);  // clamped to max 4
    expect(buttonRadius("square", 2)).toBe(2);
    expect(buttonRadius("square", 0)).toBe(0);
  });
});
