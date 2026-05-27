/**
 * Playwright global setup.
 *
 * Runs once before the test suite:
 *   1. Resets the test SQLite DB (fresh deterministic state).
 *   2. Generates the Prisma client (idempotent).
 *   3. Applies all migrations.
 *   4. Seeds rich demo data via `prisma/seed-full.ts`.
 *   5. Captures an authenticated `storageState.json` for the OWNER user
 *      so dashboard tests don't have to re-login each time.
 *
 * Designed to be safe to re-run; failures bubble up so CI surfaces them.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { request, chromium, type FullConfig } from "@playwright/test";

const root = path.resolve(__dirname, "..", "..");
const testDb = path.join(root, "test.db");
const storagePath = path.join(__dirname, ".auth", "owner.json");

function run(cmd: string, env: Record<string, string> = {}) {
  console.log(`→ ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env } as NodeJS.ProcessEnv,
  });
}

async function loginAndSaveSession(baseURL: string) {
  // Drive the real NextAuth credentials flow with a headless browser, then
  // export `storageState` so dashboard tests can skip the login screen.
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "owner@demo.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  mkdirSync(path.dirname(storagePath), { recursive: true });
  await ctx.storageState({ path: storagePath });
  await browser.close();
  // Sanity: storage state must contain a NextAuth session cookie.
  const raw = readFileSync(storagePath, "utf8");
  if (!/next-auth\.session-token|authjs\.session-token/.test(raw)) {
    throw new Error("Failed to capture NextAuth session cookie. Login flow broken?");
  }
}

async function waitForServer(baseURL: string, timeoutMs = 60_000) {
  const ctx = await request.newContext({ baseURL });
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await ctx.get("/api/health");
      if (res.ok()) {
        await ctx.dispose();
        return;
      }
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  await ctx.dispose();
  throw new Error(`Server at ${baseURL} did not become healthy within ${timeoutMs}ms`);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3100";

  // ---- 1. Reset test database ---------------------------------------------
  if (existsSync(testDb)) {
    rmSync(testDb);
    console.log("✓ Removed previous test.db");
  }

  // ---- 2/3. Prisma generate + migrate -------------------------------------
  const prismaEnv: Record<string, string> = { DATABASE_URL: "file:./test.db" };
  try {
    run("npx prisma generate", prismaEnv);
  } catch {
    // generate is also run via postinstall — non-fatal here.
  }
  run("npx prisma migrate deploy", prismaEnv);

  // ---- 4. Seed --------------------------------------------------------------
  run("npx tsx prisma/seed-full.ts", prismaEnv);

  // ---- 5. Wait for server, then capture auth state ------------------------
  console.log(`Waiting for ${baseURL}/api/health...`);
  await waitForServer(baseURL);

  console.log("Capturing OWNER storage state...");
  await loginAndSaveSession(baseURL);

  // Manifest written for downstream tools.
  writeFileSync(
    path.join(__dirname, ".auth", "manifest.json"),
    JSON.stringify({ baseURL, user: "owner@demo.com", capturedAt: new Date().toISOString() }, null, 2),
  );
  console.log("✓ Global setup complete.");
}
