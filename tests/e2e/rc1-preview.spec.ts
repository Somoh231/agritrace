import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fs from "node:fs";

import {
  ROLE_ENV,
  authStatePath,
  credentialsFor,
  isVercelAuthPage,
  watchBrowserFailures,
  type QaRole,
} from "./rc1-test-support";

const roleRoutes: Record<QaRole, string[]> = {
  clan: [
    "/workspace/clan",
    "/farmers",
    "/farm-profiles",
    "/field/inspections",
    "/field/boundary-capture",
    "/field/sync-queue",
  ],
  dao: [
    "/district-dashboard",
    "/workspace/dao",
    "/verification-queue",
    "/registration-approvals",
  ],
  cac: ["/county-dashboard", "/workspace/cac", "/verification-queue"],
  ministry: [
    "/command-center",
    "/workspace/ministry",
    "/national-operations",
    "/reporting/workspace",
    "/executive-briefing",
  ],
  admin: [
    "/admin/users",
    "/admin/organizations",
    "/admin/integrations",
    "/admin/import",
    "/admin/settings",
  ],
  auditor: ["/activity", "/compliance/audit-log", "/reports"],
  donor: ["/donor-dashboard", "/reports/donor"],
  exporter: ["/cocoa/lots", "/cocoa/movements", "/cocoa/eudr"],
};

const exportRoutes = [
  "/api/reports/executive-briefing",
  "/api/reports/compliance-oversight",
  "/api/reports/donor-programme",
  "/api/reports/rice",
  "/api/reports/dds",
  "/api/reports",
];

test.describe("protected preview core", () => {
  test("/setup is an application 404", async ({ page }) => {
    const response = await page.goto("/setup", { waitUntil: "domcontentloaded" });
    expect(isVercelAuthPage(page.url())).toBe(false);
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByText("Initialize Agrivault")).toHaveCount(0);
  });

  test("/api/health is sanitized JSON", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(JSON.stringify(body)).not.toMatch(
      /password|service.role|stack|postgresql:|supabase_service_role/i,
    );
  });

  test("login semantics and keyboard submit", async ({ page }) => {
    const failures = watchBrowserFailures(page);
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(isVercelAuthPage(page.url())).toBe(false);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill("invalid@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("invalid");
    await page.getByLabel("Password", { exact: true }).press("Enter");
    await expect(page.getByRole("alert")).toBeVisible();
    expect(failures.consoleErrors).toEqual([]);
  });

  test("login exposes no shared role credentials or demo sign-in controls", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Accounts are issued by invitation from an authorised AgriVault administrator")).toBeVisible();
    await expect(page.getByText("Demo access profiles")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("DemoPass");
    await expect(page.locator("body")).not.toContainText("@agritrace.demo");
  });

  test("expired or invalid password-setup link fails clearly", async ({ page }) => {
    await page.goto("/auth/complete?mode=invite", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("This setup link is invalid or expired.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Set password and continue" })).toHaveCount(0);
  });

  test("protected route redirects before rendering data", async ({ page }) => {
    const response = await page.goto("/command-center", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    expect(new URL(page.url()).pathname).toBe("/login");
    expect(new URL(page.url()).searchParams.get("redirectTo")).toBe(
      "/command-center",
    );
    // Only the sign-in heading renders; nothing from the protected page does.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(["Sign in"]);
  });

  test("public critical routes have no serious axe findings", async ({ page }) => {
    for (const route of ["/", "/login"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(serious, `${route}: ${serious.map((v) => v.id).join(", ")}`).toEqual(
        [],
      );
    }
  });

  for (const route of exportRoutes) {
    test(`unauthenticated export is protected: ${route}`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect([307, 401]).toContain(response.status());
    });
  }
});

for (const role of Object.keys(ROLE_ENV) as QaRole[]) {
  const configured = Boolean(credentialsFor(role));
  test.describe(`${role} authenticated routes`, () => {
    test.skip(!configured, `Set ${ROLE_ENV[role].join(" and ")} to run.`);
    test.use({ storageState: authStatePath(role) });

    for (const route of roleRoutes[role]) {
      test(`${role} can inspect ${route}`, async ({ page }) => {
        test.skip(!fs.existsSync(authStatePath(role)), "Auth state unavailable.");
        const failures = watchBrowserFailures(page);
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status()).toBeLessThan(400);
        expect(new URL(page.url()).pathname).not.toBe("/login");
        await expect(page.locator("main")).toHaveCount(1);
        expect(failures.consoleErrors).toEqual([]);
      });
    }
  });
}
