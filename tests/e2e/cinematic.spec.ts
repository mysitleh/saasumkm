/**
 * Cinematic-wide (1600×1000) capture set.
 *
 * The design.md hero is meant to be experienced edge-to-edge at desktop
 * widths. This project captures the public hero + pricing band on a
 * 1600px viewport so Stakeholders see the cinematic display-xxl headline
 * exactly as the brand intends.
 */
import { test } from "@playwright/test";
import { snap, safeGoto, shotPath } from "./helpers";

const VP = "cinematic-wide";

test.describe("cinematic", () => {
  test("C01 — Hero (canvas-night, display-xxl)", async ({ page }) => {
    await safeGoto(page, "/");
    // Capture only the first viewport (above-the-fold cinematic frame)
    await snap(page, shotPath(VP, 1, "hero-cinematic"), { fullPage: false });
  });

  test("C02 — Full landing edit-to-edge", async ({ page }) => {
    await safeGoto(page, "/");
    await snap(page, shotPath(VP, 2, "landing-full"));
  });

  test("C03 — Pricing band", async ({ page }) => {
    await safeGoto(page, "/");
    // Scroll to pricing section
    const pricing = page.getByRole("heading", { name: /mulai gratis/i });
    await pricing.scrollIntoViewIfNeeded();
    await snap(page, shotPath(VP, 3, "pricing-band"), { fullPage: false });
  });
});
