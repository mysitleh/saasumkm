import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Playwright configuration — robust screenshot + e2e workflow.
 *
 * Design goals:
 *   - Deterministic: dedicated test DB + fresh seed via global-setup.
 *   - Fast: single `npm run dev`-equivalent server, reused across projects.
 *   - Reusable: pre-authenticated `storageState` shared by dashboard tests.
 *   - Multi-viewport: desktop (1440), mobile (390), cinematic-wide (1600).
 *   - Cross-browser: Chromium for screenshots; Firefox/WebKit smoke optional via PW_ALL_BROWSERS=1.
 *   - CI-friendly: html report, retries, traces+video on first retry, JSON output.
 */

const PORT = process.env.PLAYWRIGHT_PORT ? Number(process.env.PLAYWRIGHT_PORT) : 3100;
const baseURL = `http://localhost:${PORT}`;
const STORAGE_STATE = path.join(__dirname, "tests", "e2e", ".auth", "owner.json");
const SHOTS_DIR = "tests/screenshots";
const ALL_BROWSERS = !!process.env.PW_ALL_BROWSERS;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/.playwright/output",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,        // screenshots are DB-side-effect-sensitive; serialize for stable visuals
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                  // serial execution → consistent ordering of screenshot indices
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "tests/.playwright/report", open: "never" }], ["json", { outputFile: "tests/.playwright/results.json" }]]
    : [["list"], ["html", { outputFolder: "tests/.playwright/report", open: "never" }]],
  globalSetup: require.resolve("./tests/e2e/global-setup.ts"),

  use: {
    baseURL,
    headless: true,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Block 3rd-party network noise (unsplash etc.) for stable visuals.
    // We allow them but record offline-mode in the spec layer per-test if needed.
  },

  projects: [
    // ---- Authenticated desktop screenshots (primary) ----
    {
      name: "desktop-auth",
      testMatch: /screenshots\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: STORAGE_STATE,
      },
    },

    // ---- Public (unauthenticated) screenshots ----
    {
      name: "desktop-public",
      testMatch: /public-pages\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: { cookies: [], origins: [] },
      },
    },

    // ---- Mobile (390x844) ----
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["iPhone 14 Pro"],
        storageState: STORAGE_STATE,
      },
    },

    // ---- Wide cinematic (for design.md hero captures) ----
    {
      name: "cinematic-wide",
      testMatch: /cinematic\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 1000 },
        storageState: { cookies: [], origins: [] },
      },
    },

    // ---- Optional cross-browser smoke ----
    ...(ALL_BROWSERS
      ? [
          { name: "firefox", testMatch: /smoke\.spec\.ts/, use: { ...devices["Desktop Firefox"], storageState: STORAGE_STATE } },
          { name: "webkit", testMatch: /smoke\.spec\.ts/, use: { ...devices["Desktop Safari"], storageState: STORAGE_STATE } },
        ]
      : []),
  ],

  webServer: {
    command: `cmd /c "set NODE_ENV=production&& set DATABASE_URL=file:./test.db&& set NEXTAUTH_SECRET=test-secret-key-please-change-32chars-minimum&& set NEXTAUTH_URL=${baseURL}&& set PAYMENT_PROVIDER=mock&& npm run build && npx next start -p ${PORT}"`,
    url: `${baseURL}/api/health`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },

  // helper exports
  metadata: {
    screenshotsDir: SHOTS_DIR,
    storageState: STORAGE_STATE,
  },
});
