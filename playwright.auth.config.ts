import fs from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * Route-protection tests (tests/e2e-auth) against a local production build wired
 * to a stub Supabase. No real project, credentials or data are used.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key npm run build
 *   npm run test:e2e:auth
 *
 * The run refuses to start unless the build is wired to the stub, so the test
 * session tokens are never sent to a real Supabase project.
 */
const STUB_URL = "http://127.0.0.1:54399";
const PORT = Number(process.env.AUTH_TEST_PORT ?? 3100);

const middlewareBundle = path.join(process.cwd(), ".next", "server", "middleware.js");
if (!fs.existsSync(middlewareBundle) || !fs.readFileSync(middlewareBundle, "utf8").includes(STUB_URL)) {
  throw new Error(`The build in .next is not wired to the stub Supabase (${STUB_URL}). Rebuild as described in playwright.auth.config.ts.`);
}

export default defineConfig({
  testDir: "./tests/e2e-auth",
  outputDir: "test-results/e2e-auth",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: [
    {
      command: "node tests/e2e-auth/support/stub-supabase.mjs",
      url: `${STUB_URL}/__stub/hits`,
      reuseExistingServer: false,
    },
    {
      command: `npx next start -p ${PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
});
