import type { Page, Request } from "@playwright/test";
import os from "node:os";
import path from "node:path";

export const ROLE_ENV = {
  clan: ["QA_CLAN_EMAIL", "QA_CLAN_PASSWORD"],
  dao: ["QA_DAO_EMAIL", "QA_DAO_PASSWORD"],
  cac: ["QA_CAC_EMAIL", "QA_CAC_PASSWORD"],
  ministry: ["QA_MINISTRY_EMAIL", "QA_MINISTRY_PASSWORD"],
  admin: ["QA_ADMIN_EMAIL", "QA_ADMIN_PASSWORD"],
  auditor: ["QA_AUDITOR_EMAIL", "QA_AUDITOR_PASSWORD"],
  donor: ["QA_DONOR_EMAIL", "QA_DONOR_PASSWORD"],
  exporter: ["QA_EXPORTER_EMAIL", "QA_EXPORTER_PASSWORD"],
} as const;

export type QaRole = keyof typeof ROLE_ENV;

export function authDir() {
  return (
    process.env.PLAYWRIGHT_AUTH_DIR ??
    path.join(os.tmpdir(), "agritrace-rc1-auth")
  );
}

export function authStatePath(role: QaRole) {
  return path.join(authDir(), `${role}.json`);
}

export function credentialsFor(role: QaRole) {
  const [emailKey, passwordKey] = ROLE_ENV[role];
  const email = process.env[emailKey];
  const password = process.env[passwordKey];
  return email && password ? { email, password } : null;
}

export function isProductionUrl(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "agrivaultdata.com" || hostname === "www.agrivaultdata.com";
}

export function requireSafeSyntheticTarget(baseURL: string) {
  if (isProductionUrl(baseURL)) {
    throw new Error("Synthetic mutation tests are prohibited against production.");
  }
  if (process.env.QA_ALLOW_SYNTHETIC_MUTATIONS !== "true") {
    throw new Error(
      "Synthetic mutation tests require QA_ALLOW_SYNTHETIC_MUTATIONS=true.",
    );
  }
}

export function watchBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text().slice(0, 500));
    }
  });
  page.on("requestfailed", (request: Request) => {
    const parsed = new URL(request.url());
    failedRequests.push(
      `${request.method()} ${parsed.origin}${parsed.pathname}: ${
        request.failure()?.errorText ?? "unknown"
      }`,
    );
  });

  return { consoleErrors, failedRequests };
}

export function isVercelAuthPage(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "vercel.com" || hostname === "github.com";
}
