/**
 * Authenticated dashboard screenshot suite.
 *
 * Runs against `desktop-auth` project — uses the pre-captured OWNER
 * `storageState.json` so individual tests don't repeat the login flow.
 *
 * Each test is a single page capture; numbering is stable so consumers
 * can diff by filename across runs.
 */
import { test, expect } from "@playwright/test";
import { snap, safeGoto, shotPath } from "./helpers";

const VP = "desktop-auth";

test.describe("dashboard", () => {
  test("10 — Dashboard home", async ({ page }) => {
    await safeGoto(page, "/dashboard");
    await expect(page.locator("h1")).toContainText(/halo|selamat/i);
    await snap(page, shotPath(VP, 10, "dashboard-home"));
  });

  test("11 — Insights (BI)", async ({ page }) => {
    await safeGoto(page, "/dashboard/insights");
    await expect(page.locator("h1")).toContainText(/insights/i);
    // Wait for the forecast chart to render (svg present).
    await page.locator('svg[role="img"]').first().waitFor({ state: "visible" });
    await snap(page, shotPath(VP, 11, "dashboard-insights"));
  });

  test("12 — Analytics", async ({ page }) => {
    await safeGoto(page, "/dashboard/analytics");
    await expect(page.locator("h1")).toContainText(/14 hari|analytics/i);
    await snap(page, shotPath(VP, 12, "dashboard-analytics"));
  });

  test("13 — Orders list", async ({ page }) => {
    await safeGoto(page, "/dashboard/orders");
    await expect(page.locator("h1")).toContainText(/pesanan/i);
    await snap(page, shotPath(VP, 13, "dashboard-orders"));
  });

  test("14 — Order detail", async ({ page }) => {
    await safeGoto(page, "/dashboard/orders");
    const firstOrder = page.locator("a[href*='/dashboard/orders/']").first();
    await firstOrder.click();
    await page.waitForURL(/\/dashboard\/orders\/[^/]+$/);
    await snap(page, shotPath(VP, 14, "dashboard-order-detail"));
  });

  test("15 — Products list", async ({ page }) => {
    await safeGoto(page, "/dashboard/products");
    await expect(page.locator("h1")).toContainText(/produk/i);
    await snap(page, shotPath(VP, 15, "dashboard-products"));
  });

  test("16 — Product new", async ({ page }) => {
    await safeGoto(page, "/dashboard/products/new");
    await snap(page, shotPath(VP, 16, "dashboard-product-new"));
  });

  test("17 — Bulk stock", async ({ page }) => {
    await safeGoto(page, "/dashboard/products/stock");
    await snap(page, shotPath(VP, 17, "dashboard-stock"));
  });

  test("18 — Promos", async ({ page }) => {
    await safeGoto(page, "/dashboard/promos");
    await snap(page, shotPath(VP, 18, "dashboard-promos"));
  });

  test("19 — Customers", async ({ page }) => {
    await safeGoto(page, "/dashboard/customers");
    await expect(page.locator("h1")).toContainText(/pelanggan/i);
    await snap(page, shotPath(VP, 19, "dashboard-customers"));
  });

  test("20 — Loyalty", async ({ page }) => {
    await safeGoto(page, "/dashboard/loyalty");
    await expect(page.locator("h1")).toContainText(/loyalty|poin/i);
    await snap(page, shotPath(VP, 20, "dashboard-loyalty"));
  });

  test("21 — Outlets", async ({ page }) => {
    await safeGoto(page, "/dashboard/outlets");
    await snap(page, shotPath(VP, 21, "dashboard-outlets"));
  });

  test("22 — Staff", async ({ page }) => {
    await safeGoto(page, "/dashboard/staff");
    await snap(page, shotPath(VP, 22, "dashboard-staff"));
  });

  test("23 — Billing", async ({ page }) => {
    await safeGoto(page, "/dashboard/billing");
    await expect(page.locator("h1")).toContainText(/paket/i);
    await snap(page, shotPath(VP, 23, "dashboard-billing"));
  });

  test("24 — Settings", async ({ page }) => {
    await safeGoto(page, "/dashboard/settings");
    await snap(page, shotPath(VP, 24, "dashboard-settings"));
  });

  test("25 — POS", async ({ page }) => {
    await safeGoto(page, "/dashboard/pos");
    await expect(page.locator("h1")).toContainText(/pos/i);
    await snap(page, shotPath(VP, 25, "dashboard-pos"), { fullPage: false });
  });

  test("26 — Theme Builder", async ({ page }) => {
    await safeGoto(page, "/dashboard/theme");
    await expect(page.locator("h1")).toContainText(/theme builder/i);
    // Wait for live preview SVG / first card to be visible
    await page.locator(".card").first().waitFor({ state: "visible" });
    await snap(page, shotPath(VP, 26, "dashboard-theme-builder"));
  });

  test("27 — Custom Domain", async ({ page }) => {
    await safeGoto(page, "/dashboard/domain");
    await expect(page.locator("h1")).toContainText(/domain/i);
    await snap(page, shotPath(VP, 27, "dashboard-custom-domain"));
  });

  test("28 — Template Builder", async ({ page }) => {
    await safeGoto(page, "/dashboard/template");
    await expect(page.locator("h1")).toContainText(/storefront|template/i);
    await page.locator(".card").first().waitFor({ state: "visible" });
    await snap(page, shotPath(VP, 28, "dashboard-template-builder"));
  });

  test("29 — Notifications", async ({ page }) => {
    await safeGoto(page, "/dashboard/notifications");
    await expect(page.locator("h1")).toContainText(/laporan harian|notifikasi/i);
    await page.locator(".card").first().waitFor({ state: "visible" });
    await snap(page, shotPath(VP, 29, "dashboard-notifications"));
  });

  test("30 — Platform Admin", async ({ page }) => {
    await safeGoto(page, "/admin");
    await expect(page.locator("h1")).toContainText(/tenant|platform|kelola/i);
    await page.locator("table").first().waitFor({ state: "visible" });
    await snap(page, shotPath(VP, 30, "platform-admin"));
  });

  test("31 — Sidebar collapsed (icon rail)", async ({ page }) => {
    // Pre-set the collapsed preference before the app loads.
    await page.addInitScript(() => {
      try { localStorage.setItem("ums-sidebar", "collapsed"); } catch {}
    });
    await safeGoto(page, "/dashboard");
    await expect(page.locator("h1")).toContainText(/halo|selamat/i);
    await snap(page, shotPath(VP, 31, "dashboard-sidebar-collapsed"));
  });
});
