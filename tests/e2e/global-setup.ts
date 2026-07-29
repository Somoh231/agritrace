import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs/promises";

import {
  ROLE_ENV,
  authDir,
  authStatePath,
  credentialsFor,
  isVercelAuthPage,
  type QaRole,
} from "./rc1-test-support";

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use.baseURL ?? "");
  const extraHTTPHeaders = config.projects[0]?.use.extraHTTPHeaders;
  await fs.mkdir(authDir(), { recursive: true, mode: 0o700 });

  const configuredRoles = (Object.keys(ROLE_ENV) as QaRole[]).filter((role) =>
    credentialsFor(role),
  );
  if (configuredRoles.length === 0) return;

  const browser = await chromium.launch();
  try {
    for (const role of configuredRoles) {
      const credentials = credentialsFor(role);
      if (!credentials) continue;

      const context = await browser.newContext({
        extraHTTPHeaders,
      });
      const page = await context.newPage();
      await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });

      if (isVercelAuthPage(page.url())) {
        throw new Error(
          "Vercel Deployment Protection blocked browser QA. Supply VERCEL_AUTOMATION_BYPASS_SECRET without disabling protection.",
        );
      }

      await page.getByLabel("Email", { exact: true }).fill(credentials.email);
      await page
        .getByLabel("Password", { exact: true })
        .fill(credentials.password);
      await page.getByRole("button", {
        name: "Sign in to command center",
      }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 20_000,
      });
      await context.storageState({ path: authStatePath(role) });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
