/**
 * Playwright global setup.
 *
 * Runs once before the test suite:
 *   1. (optional) Resets the test SQLite DB if PLAYWRIGHT_RESET_DB=1.
 *   2. Generates the Prisma client (idempotent).
 *   3. Applies migrations + seeds rich demo data (only on reset).
 *   4. Captures an authenticated `storageState.json` for the OWNER user
 *      so dashboard tests don't have to re-login each time.
 *
 * The default is to reuse the existing dev.db so locally Playwright can
 * just run against `npm run dev` without a 60-second build cycle.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { request, chromium, type FullConfig } from "@playwright/test";

const root = path.resolve(__dirname, "..", "..");
const RESET_DB = process.env.PLAYWRIGHT_RESET_DB === "1";
const DB_FILE = RESET_DB ? "test.db" : "dev.db";
const dbPath = path.join(root, DB_FILE);
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
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "owner@demo.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  mkdirSync(path.dirname(storagePath), { recursive: true });
  await ctx.storageState({ path: storagePath });
  await browser.close();

  const raw = readFileSync(storagePath, "utf8");
  if (!/next-auth\.session-token|authjs\.session-token/.test(raw)) {
    throw new Error("Failed to capture NextAuth session cookie. Login flow broken?");
  }
}

async function waitForServer(baseURL: string, timeoutMs = 90_000) {
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
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  if (RESET_DB) {
    if (existsSync(dbPath)) {
      rmSync(dbPath);
      console.log(`✓ Removed previous ${DB_FILE}`);
    }
    const prismaEnv: Record<string, string> = { DATABASE_URL: `file:./${DB_FILE}` };
    try {
      run("npx prisma generate", prismaEnv);
    } catch {
      // generate also runs via postinstall
    }
    run("npx prisma migrate deploy", prismaEnv);
    run("npx tsx prisma/seed-full.ts", prismaEnv);
  } else {
    console.log(`✓ Using existing ${DB_FILE} (set PLAYWRIGHT_RESET_DB=1 to reset)`);
  }

  console.log(`Waiting for ${baseURL}/api/health...`);
  await waitForServer(baseURL);

  console.log("Capturing OWNER storage state...");
  await loginAndSaveSession(baseURL);

  writeFileSync(
    path.join(__dirname, ".auth", "manifest.json"),
    JSON.stringify({ baseURL, user: "owner@demo.com", capturedAt: new Date().toISOString() }, null, 2),
  );
  console.log("✓ Global setup complete.");
}
