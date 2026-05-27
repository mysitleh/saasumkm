/**
 * Cross-browser smoke (only runs when PW_ALL_BROWSERS=1).
 * Just checks that the dashboard home and insights page render without errors
 * in Firefox + WebKit.
 */
import { test, expect } from "@playwright/test";
import { safeGoto } from "./helpers";

test("dashboard renders cross-browser", async ({ page }) => {
  await safeGoto(page, "/dashboard");
  await expect(page.locator("h1")).toContainText(/halo|selamat/i);
});

test("insights renders cross-browser", async ({ page }) => {
  await safeGoto(page, "/dashboard/insights");
  await expect(page.locator("h1").first()).toBeVisible();
});
