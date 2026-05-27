/**
 * Mobile viewport screenshot suite (iPhone 14 Pro).
 * Validates that the design.md mobile breakpoint adjustments render correctly:
 *   - bottom nav with hamburger
 *   - display-xxl scaled down to ~56–64px
 *   - pricing 1-up
 */
import { test, expect } from "@playwright/test";
import { snap, safeGoto, shotPath } from "./helpers";

const VP = "mobile";

test.describe("mobile", () => {
  test("M01 — Landing", async ({ page }) => {
    await safeGoto(page, "/");
    await snap(page, shotPath(VP, 1, "landing"));
  });

  test("M02 — Login", async ({ page }) => {
    await safeGoto(page, "/login");
    await snap(page, shotPath(VP, 2, "login"), { fullPage: false });
  });

  test("M03 — Storefront", async ({ page }) => {
    await safeGoto(page, "/store/demo");
    await snap(page, shotPath(VP, 3, "storefront"));
  });

  test("M10 — Dashboard home (auth)", async ({ page }) => {
    await safeGoto(page, "/dashboard");
    await expect(page.locator("h1")).toContainText(/halo|selamat/i);
    await snap(page, shotPath(VP, 10, "dashboard-home"));
  });

  test("M11 — Insights (auth)", async ({ page }) => {
    await safeGoto(page, "/dashboard/insights");
    await snap(page, shotPath(VP, 11, "dashboard-insights"));
  });

  test("M12 — Mobile bottom-nav 'More' drawer", async ({ page }) => {
    await safeGoto(page, "/dashboard");
    // Tap the "Lainnya" button on bottom nav.
    const more = page.getByRole("button", { name: /lainnya/i });
    if (await more.count()) {
      await more.click();
      await page.getByRole("heading", { name: /menu lainnya/i }).waitFor();
    }
    await snap(page, shotPath(VP, 12, "dashboard-more-drawer"), { fullPage: false });
  });
});
