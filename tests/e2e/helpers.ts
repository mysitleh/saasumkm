/**
 * Shared helpers for the screenshot / e2e suite.
 */
import { type Page, expect } from "@playwright/test";
import path from "node:path";

const SHOTS_ROOT = path.join("tests", "screenshots");

/** Stable filename: `<index>-<viewport>-<slug>.png` for easy diffing. */
export function shotPath(viewport: string, index: number, slug: string): string {
  const idx = String(index).padStart(2, "0");
  return path.join(SHOTS_ROOT, viewport, `${idx}-${slug}.png`);
}

/**
 * Wait until the page is fully painted and quiet:
 *   - `domcontentloaded` already happened on goto
 *   - networkidle for ~500ms
 *   - all webfonts loaded (so display-xxl thin weight is rendered)
 *   - one extra animation frame so transitions settle
 */
export async function settled(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    if (typeof (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready !== "undefined") {
      await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
    }
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  });
}

/** Robust snapshot: waits for h1/main, font-ready, returns a fullPage PNG. */
export async function snap(page: Page, file: string, opts: { fullPage?: boolean } = {}) {
  const fullPage = opts.fullPage ?? true;
  // Wait for the main heading or main element to be present.
  await Promise.race([
    page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => null),
    page.locator("main").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => null),
  ]);
  await settled(page);
  await page.screenshot({ path: file, fullPage, animations: "disabled", scale: "device" });
}

/** Programmatic login that mirrors the credentials provider, used by mobile spec. */
export async function loginViaUI(page: Page, email = "owner@demo.com", password = "password123") {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await settled(page);
}

/**
 * Visit a route, retrying once if the dev server returned a transient 500
 * (helps when the JIT compilation is still warming up).
 */
export async function safeGoto(page: Page, url: string) {
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded" });
    if (res && res.status() >= 500) throw new Error(`HTTP ${res.status()} at ${url}`);
  } catch {
    await page.waitForTimeout(800);
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }
  await settled(page);
}

export async function expectTitle(page: Page, regex: RegExp) {
  await expect(page.locator("h1").first()).toContainText(regex);
}
