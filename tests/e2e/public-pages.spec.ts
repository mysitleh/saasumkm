/**
 * Public (unauthenticated) screenshots — landing, login, register, storefront.
 * Captured on the desktop-public project (1440×900, no session).
 */
import { test } from "@playwright/test";
import { snap, safeGoto, shotPath } from "./helpers";

const VP = "desktop-public";

test.describe("public", () => {
  test("01 — Landing", async ({ page }) => {
    await safeGoto(page, "/");
    await snap(page, shotPath(VP, 1, "landing"));
  });

  test("02 — Login", async ({ page }) => {
    await safeGoto(page, "/login");
    await snap(page, shotPath(VP, 2, "login"), { fullPage: false });
  });

  test("03 — Register", async ({ page }) => {
    await safeGoto(page, "/register");
    await snap(page, shotPath(VP, 3, "register"));
  });

  test("04 — Storefront / demo", async ({ page }) => {
    await safeGoto(page, "/store/demo");
    await snap(page, shotPath(VP, 4, "storefront"));
  });

  test("05 — Storefront cart sheet", async ({ page }) => {
    await safeGoto(page, "/store/demo");
    // Add 2 items
    const addBtns = page.getByRole("button", { name: /^Tambah$/ });
    await addBtns.first().click();
    await addBtns.nth(1).click();
    // Open cart via bottom FAB
    await page.getByRole("button", { name: /item/i }).click();
    await page.getByRole("heading", { name: /keranjang/i }).waitFor();
    await snap(page, shotPath(VP, 5, "storefront-cart"), { fullPage: false });
  });

  test("06 — Order tracking", async ({ page }) => {
    await safeGoto(page, "/store/demo/track");
    await snap(page, shotPath(VP, 6, "track"), { fullPage: false });
  });
});
