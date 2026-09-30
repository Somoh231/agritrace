/**
 * Ministry preview readiness (M2): admin boundary, farmer-data scope, CLAN
 * containment, product identity, preview-data labelling and debug UI.
 * Stub Supabase only — no real project, accounts or data.
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { PREVIEW_DATA_LABEL } from "@/lib/utils/pilot-config";

import { cookieHeader, sessionCookie, type StubUser } from "./support/session";

async function get(request: APIRequestContext, path: string, user: StubUser) {
  return request.get(path, { maxRedirects: 0, headers: cookieHeader(user) });
}
function locationPath(res: { headers(): Record<string, string> }, base: string) {
  const loc = res.headers()["location"];
  return loc ? new URL(loc, base).pathname : null;
}
async function signIn(page: Page, baseURL: string, user: StubUser) {
  const c = sessionCookie(user);
  await page.context().addCookies([{ name: c.name, value: c.value, url: baseURL }]);
}

test.describe("admin console is super_admin only", () => {
  for (const [user, role] of [
    ["u-ministry", "ministry_officer"],
    ["u-ministry-admin", "ministry_admin"],
    ["u-admin", "admin"],
  ] as const) {
    for (const path of ["/admin", "/admin/users", "/admin/system", "/admin/launch-readiness"]) {
      test(`${role} cannot open ${path}`, async ({ request, baseURL }) => {
        const res = await get(request, path, user);
        expect(res.status()).toBe(307);
        expect(locationPath(res, baseURL!)).toBe(postLoginHomeForRole(role));
      });
    }
    test(`${role}: every admin API refuses reads and writes`, async ({ request }) => {
      for (const api of ["/api/admin/users", "/api/admin/settings", "/api/admin/content", "/api/admin/organizations"]) {
        expect((await get(request, api, user)).status(), api).toBe(403);
      }
      const patch = await request.patch("/api/admin/users", {
        headers: { ...cookieHeader(user), "content-type": "application/json" },
        data: { userId: "u-ministry", role: "super_admin" },
      });
      expect(patch.status()).toBe(403);
    });
  }

  test("super_admin still reaches the admin console", async ({ request, baseURL }) => {
    const res = await get(request, "/admin/users", "u-super");
    expect(res.status()).toBe(200);
    expect(locationPath(res, baseURL!)).toBeNull();
  });
});

test.describe("farmer data is limited to roles that need it", () => {
  for (const [user, role] of [
    ["u-exporter", "exporter"],
    ["u-warehouse", "warehouse_manager"],
    ["u-auditor", "auditor"],
  ] as const) {
    test(`${role}: registry pages and farmer APIs are refused`, async ({ request, baseURL }) => {
      for (const path of ["/farmers", "/cooperatives", "/farm-profiles"]) {
        const res = await get(request, path, user);
        expect(res.status(), path).toBe(307);
        expect(locationPath(res, baseURL!), path).not.toBe(path);
      }
      expect((await get(request, "/api/farmers", user)).status()).toBe(403);
      expect((await get(request, "/api/registrations", user)).status()).toBe(403);
    });
  }

  test("ministry_officer and call-centre agents keep registry access", async ({ request }) => {
    for (const user of ["u-ministry", "u-callcenter"] as const) {
      expect((await get(request, "/farmers", user)).status(), user).toBe(200);
      expect((await get(request, "/api/farmers", user)).status(), user).toBe(200);
    }
  });

  test("exporter lands on its own export surface", async ({ request, baseURL }) => {
    const res = await get(request, "/app", "u-exporter");
    expect(locationPath(res, baseURL!)).toBe("/cocoa/lots");
    expect((await get(request, "/cocoa/lots", "u-exporter")).status()).toBe(200);
  });
});

test.describe("CLAN and field roles stay in their desk", () => {
  for (const user of ["u-clan", "u-field"] as const) {
    test(`${user}: CLAN desk opens; district and national workspaces do not`, async ({ request, baseURL }) => {
      expect(locationPath(await get(request, "/app", user), baseURL!)).toBe("/workspace/clan");
      expect((await get(request, "/workspace/clan", user)).status()).toBe(200);
      for (const path of ["/workspace/dao", "/district-dashboard", "/verification-queue", "/reports"]) {
        expect((await get(request, path, user)).status(), path).toBe(307);
      }
    });
  }
});

test.describe("Ministry preview shell", () => {
  test("ministry_officer: AgriVault identity, persistent preview label, no admin or debug UI", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, "u-ministry");
    for (const path of ["/command-center", "/farmers", "/map", "/verification-queue", "/logistics", "/reporting/workspace"]) {
      await page.goto(path, { waitUntil: "load" });
      await expect(page.locator("[data-preview-label]").first(), path).toContainText(PREVIEW_DATA_LABEL);
      await expect(page.locator('img[src*="moa"], img[alt*="Ministry of Agriculture"]'), path).toHaveCount(0);
      await expect(page.locator("[data-pwa-diagnostics]"), path).toHaveCount(0);
      await expect(page.locator('a[href^="/admin"]'), path).toHaveCount(0);
      const text = await page.locator("body").innerText();
      expect(text, path).not.toMatch(/Verified by national data bureau|System live|Syncing · live|expandable nationally|Ministry of Agriculture · Liberia/);
    }
  });

  test("command center shows no national totals or nationwide coverage", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, "u-ministry");
    await page.goto("/command-center", { waitUntil: "load" });
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/48,620|298,400|\$3\.84M|31,890|15\/15|90 districts|Montserrado|Margibi|Grand Bassa|Sinoe/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pilot overview");
  });
});
