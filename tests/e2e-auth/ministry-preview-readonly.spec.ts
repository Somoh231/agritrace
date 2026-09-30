/**
 * Read-only Ministry preview (M3): a ministry_officer profile with
 * preview_read_only = true can view the walkthrough and change nothing.
 * Stub Supabase only — no real project, accounts or data.
 *
 * Server side: every mutating method on every API route (enumerated from
 * src/app/api, so a new route is covered automatically) and on page routes
 * returns 403 for the preview account, while the same role without the flag
 * is not stopped by the read-only gate. Database side is proven separately by
 * `npm run test:db:preview` (RLS).
 */
import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { PREVIEW_READ_ONLY_LABEL, READ_ONLY_ALLOWED_WRITE_PATHS } from "@/lib/auth/preview-read-only";
import { PREVIEW_DATA_LABEL } from "@/lib/utils/pilot-config";

import { cookieHeader, sessionCookie } from "./support/session";

const MUTATING = ["POST", "PUT", "PATCH", "DELETE"] as const;

/** Every src/app/api route file with a mutating handler, as [urlPath, methods]. */
function mutatingApiRoutes(): [string, string[]][] {
  const root = path.join(process.cwd(), "src/app/api");
  const out: [string, string[]][] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "route.ts") {
        const src = fs.readFileSync(p, "utf8");
        const methods = MUTATING.filter((m) => new RegExp(`export (async function|const) ${m}\\b`).test(src));
        if (methods.length) {
          const url = "/api/" + path.relative(root, path.dirname(p)).split(path.sep).map((s) => s.replace(/^\[.*\]$/, "smp-test")).join("/");
          out.push([url, methods]);
        }
      }
    }
  };
  walk(root);
  return out;
}

const WALKTHROUGH = [
  { step: "Command Center", path: "/command-center" },
  { step: "Farmer Registry", path: "/farmers" },
  { step: "GIS", path: "/map" },
  { step: "Verification", path: "/verification-queue" },
  { step: "Warehouse", path: "/logistics" },
  { step: "Inventory / traceability", path: "/inventory" },
  { step: "Transfers", path: "/transfers" },
  { step: "Reporting", path: "/reporting/workspace" },
  { step: "Reports", path: "/reports" },
] as const;

/** Visible, enabled controls whose label offers a change. */
const MUTATION_LABEL = /^(approve|reject|return|archive|register|create|record|capture|corrections|request|log|new|add|edit|delete|dispatch|mark received|escalate|assign|submit|save|import|upload)\b/i;

async function signIn(page: Page, baseURL: string) {
  const c = sessionCookie("u-preview");
  await page.context().addCookies([{ name: c.name, value: c.value, url: baseURL }]);
}

async function expectReadOnlyChrome(page: Page, where: string) {
  await expect(page.locator("[data-readonly-indicator]").first(), where).toContainText(PREVIEW_READ_ONLY_LABEL);
  await expect(page.locator("[data-preview-label]").first(), where).toContainText(PREVIEW_DATA_LABEL);
  await expect(page.locator('a[href^="/admin"]'), where).toHaveCount(0);
  await expect(page.locator("[data-pwa-diagnostics]"), where).toHaveCount(0);
  await expect(page.locator('img[src*="moa"], img[alt*="Ministry of Agriculture"], img[alt*="seal" i]'), where).toHaveCount(0);

  const offered = await page.locator("main button:visible, main a:visible").evaluateAll((els) =>
    els
      .filter((el) => !(el as HTMLButtonElement).disabled && el.getAttribute("aria-disabled") !== "true" && !el.closest("th, [role=columnheader]"))
      .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
  expect(offered.filter((t) => MUTATION_LABEL.test(t)), `${where}: mutation controls`).toEqual([]);

  const text = await page.locator("body").innerText();
  expect(text, where).not.toMatch(/nationwide|all 15 counties|national coverage|Ministry of Agriculture · Liberia|Verified by national data bureau|System live/i);
  expect(text, where).not.toMatch(/\b20\d\d-[AB]\b/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${where}: horizontal overflow`).toBeLessThanOrEqual(1);
}

test.describe("preview account: server refuses every mutation", () => {
  const routes = mutatingApiRoutes();

  test("the enumerated API surface is non-trivial", () => {
    expect(routes.length).toBeGreaterThanOrEqual(10);
  });

  for (const [url, methods] of routes) {
    for (const method of methods) {
      const allowed = method === "POST" && READ_ONLY_ALLOWED_WRITE_PATHS.includes(url);
      test(`${method} ${url} → ${allowed ? "allowed (export/telemetry)" : "403"}`, async ({ request }) => {
        const res = await request.fetch(url, {
          method,
          maxRedirects: 0,
          headers: { ...cookieHeader("u-preview"), "content-type": "application/json" },
          data: { id: "smp-test", status: "approved", role: "super_admin", preview_read_only: false },
        });
        if (allowed) {
          expect(res.status()).not.toBe(403);
        } else {
          expect(res.status()).toBe(403);
          expect(await res.text()).toMatch(/read-only/);
        }
      });
    }
  }

  test("page routes refuse non-GET methods (no server-action or form writes)", async ({ request }) => {
    for (const { path: p } of WALKTHROUGH) {
      for (const method of MUTATING) {
        const res = await request.fetch(p, { method, maxRedirects: 0, headers: cookieHeader("u-preview"), data: "" });
        expect(res.status(), `${method} ${p}`).toBe(403);
      }
    }
  });

  test("the read-only gate is specific to the flag: the same role without it is not refused as read-only", async ({ request }) => {
    const res = await request.post("/api/ops/workflows/verification", {
      maxRedirects: 0,
      headers: { ...cookieHeader("u-ministry"), "content-type": "application/json" },
      data: {},
    });
    expect(await res.text()).not.toMatch(/preview account is read-only/);
  });

  test("the admin console stays closed to the preview account", async ({ request }) => {
    for (const p of ["/admin", "/admin/users", "/cocoa/pilot-readiness"]) {
      expect((await request.get(p, { maxRedirects: 0, headers: cookieHeader("u-preview") })).status(), p).toBe(307);
    }
    for (const api of ["/api/admin/users", "/api/admin/settings"]) {
      expect((await request.get(api, { maxRedirects: 0, headers: cookieHeader("u-preview") })).status(), api).toBe(403);
    }
  });
});

test.describe("preview account: walkthrough", () => {
  test("every walkthrough route is read-only, labelled, clean and accessible", async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`${page.url()} :: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`));
    await signIn(page, baseURL!);

    for (const { step, path: p } of WALKTHROUGH) {
      await page.goto(p, { waitUntil: "load" });
      await page.waitForTimeout(600);
      expect.soft(new URL(page.url()).pathname, `${step} opened`).toBe(p);
      await expectReadOnlyChrome(page, step);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const severe = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect.soft(
        severe.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.target.join(" ")} :: ${(n.any[0]?.message ?? "").slice(0, 140)}`)),
        `${step}: axe`,
      ).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test("walkthrough holds at 1440, 1024 and 390 wide: labels visible, no horizontal overflow", async ({ page, baseURL }) => {
    await signIn(page, baseURL!);
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const { step, path: p } of WALKTHROUGH) {
        await page.goto(p, { waitUntil: "load" });
        await page.waitForTimeout(300);
        const where = `${step} @${width}`;
        await expect.soft(page.locator("[data-readonly-indicator]").first(), where).toBeVisible();
        await expect.soft(page.locator("[data-preview-label]").first(), where).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect.soft(overflow, `${where}: horizontal overflow`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("beyond the walkthrough: every other reachable workspace is read-only too", async ({ page, baseURL }) => {
    await signIn(page, baseURL!);
    const extra = [
      "/app", "/executive-briefing", "/national-operations", "/national-heat-map", "/gis-intelligence", "/geo-registry",
      "/registration-approvals", "/field", "/field-agents", "/compliance", "/donor-dashboard", "/county-operations",
      "/county-dashboard", "/district-dashboard", "/workspace/ministry", "/workspace/cac", "/workspace/dao", "/workspace/clan", "/activity", "/alerts", "/search",
      "/cooperatives", "/farm-profiles", "/food-security", "/audit-tools",
    ];
    for (const p of extra) {
      await page.goto(p, { waitUntil: "load" });
      await page.waitForTimeout(300);
      const where = `${p} → ${new URL(page.url()).pathname}`;
      await expect.soft(page.locator("[data-readonly-indicator]").first(), where).toBeVisible();
      const offered = await page.locator("main button:visible, main a:visible").evaluateAll((els) =>
        els
          .filter((el) => !(el as HTMLButtonElement).disabled && el.getAttribute("aria-disabled") !== "true" && !el.closest("th, [role=columnheader]"))
          .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
          .filter(Boolean),
      );
      expect.soft(offered.filter((t) => MUTATION_LABEL.test(t)), `${where}: mutation controls`).toEqual([]);
    }
  });

  test("farmer detail opens read-only from the registry", async ({ page, baseURL }) => {
    await signIn(page, baseURL!);
    await page.goto("/farmers", { waitUntil: "load" });
    await expect(page.getByText("Sample farmer 01").first()).toBeVisible();
    await page.getByRole("button", { name: /^View/ }).first().click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    const actions = await drawer.locator("button:visible").evaluateAll((els) => els.map((el) => (el.textContent ?? "").trim()).filter(Boolean));
    expect(actions.filter((t) => MUTATION_LABEL.test(t))).toEqual([]);
    expect(await drawer.innerText()).not.toMatch(/\+231 ?[1-9]/);
  });

  test("LOGIN → command center → … → LOGOUT with the preview account", async ({ page }) => {
    await page.goto("/login", { waitUntil: "load" });
    await page.getByLabel(/email/i).fill("u-preview@example.test");
    await page.getByLabel(/password/i).fill("stub-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/command-center", { timeout: 20_000 });
    await expectReadOnlyChrome(page, "after login");

    for (const { path: p } of WALKTHROUGH.slice(1)) {
      await page.goto(p, { waitUntil: "load" });
      await expect(page.locator("[data-readonly-indicator]").first(), p).toBeVisible();
    }

    await page.locator("header button[aria-expanded]").last().click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login**", { timeout: 20_000 });
  });
});
