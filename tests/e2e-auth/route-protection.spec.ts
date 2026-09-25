/**
 * Route protection and missing-profile regression tests.
 *
 * Runs the real middleware, layouts and API guards of a production build that
 * points at the local stub (support/stub-supabase.mjs). See
 * playwright.auth.config.ts for how to build and run.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import { assertPilotRouteAccess } from "@/lib/auth/workspace-access";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { PUBLIC_SITE_ROUTES } from "@/lib/site/routes";

import { cookieHeader, sessionCookie, type StubUser } from "./support/session";

const DENIED = "/account-unavailable";

/** Operational routes across the protected roots (dashboard, workspaces, admin, field). */
const OPERATIONAL = [
  "/command-center",
  "/admin",
  "/admin/users",
  "/field",
  "/farmers",
  "/cocoa",
  "/rice",
  "/reports",
  "/workspace/clan",
  "/workspace/ministry",
  "/county-dashboard",
  "/district-dashboard",
  "/gis-intelligence",
  "/verification-queue",
];

async function get(request: APIRequestContext, path: string, user?: StubUser) {
  return request.get(path, { maxRedirects: 0, headers: user ? cookieHeader(user) : {} });
}

function locationPath(res: { headers(): Record<string, string> }, base: string) {
  const loc = res.headers()["location"];
  if (!loc) return null;
  const u = new URL(loc, base);
  return u.pathname + u.search;
}

test.describe("unauthenticated visitors", () => {
  for (const path of ["/app", ...OPERATIONAL]) {
    test(`${path} redirects to sign-in`, async ({ request, baseURL }) => {
      const res = await get(request, path);
      expect(res.status()).toBe(307);
      expect(locationPath(res, baseURL!)).toBe(`/login?redirectTo=${encodeURIComponent(path)}`);
    });
  }

  test("admin API returns 401", async ({ request }) => {
    const res = await get(request, "/api/admin/users");
    expect(res.status()).toBe(401);
  });
});

test.describe("public website stays public", () => {
  for (const user of [undefined, "u-missing"] as const) {
    const who = user ? "signed-in user without a profile" : "anonymous visitor";
    for (const path of [...PUBLIC_SITE_ROUTES, "/login"]) {
      test(`${path} is 200 for ${who}`, async ({ request }) => {
        const res = await get(request, path, user);
        expect(res.status()).toBe(200);
      });
    }
  }

  test("/setup is 404", async ({ request }) => {
    const res = await get(request, "/setup");
    expect(res.status()).toBe(404);
  });
});

for (const user of ["u-missing", "u-inactive"] as const) {
  const who = user === "u-missing" ? "no profile row" : "a deactivated admin profile";

  test.describe(`signed-in user with ${who}`, () => {
    for (const path of ["/app", ...OPERATIONAL]) {
      test(`${path} is denied`, async ({ request, baseURL }) => {
        const res = await get(request, path, user);
        expect(res.status()).toBe(307);
        expect(locationPath(res, baseURL!)).toBe(DENIED);
      });
    }

    test("admin API returns 403", async ({ request }) => {
      const res = await get(request, "/api/admin/users", user);
      expect(res.status()).toBe(403);
    });

    test("AI assistant API returns 403", async ({ request }) => {
      const res = await request.post("/api/ai/chat", {
        maxRedirects: 0,
        headers: { ...cookieHeader(user), "content-type": "application/json" },
        data: { messages: [{ role: "user", content: "status" }] },
      });
      expect(res.status()).toBe(403);
    });
  });
}

test.describe("signed-in user without a profile, in the browser", () => {
  test("opening /app lands on the account-unavailable page with sign-out only", async ({ page, context, baseURL }) => {
    const c = sessionCookie("u-missing");
    await context.addCookies([{ name: c.name, value: c.value, url: baseURL! }]);
    await page.goto("/app");
    await expect(page).toHaveURL(new RegExp(`${DENIED}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Account unavailable" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    // Nothing from the operational shell renders.
    await expect(page.getByText(/command center/i)).toHaveCount(0);
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  });
});

test.describe("valid profiles behave as before", () => {
  for (const [user, role] of [
    ["u-admin", "admin"],
    ["u-field", "field_agent"],
  ] as const) {
    test(`${role}: /app sends to the role's home`, async ({ request, baseURL }) => {
      const res = await get(request, "/app", user);
      expect(res.status()).toBe(307);
      expect(locationPath(res, baseURL!)).toBe(postLoginHomeForRole(role));
    });
  }

  test("admin: admin console is reachable", async ({ request, baseURL }) => {
    const res = await get(request, "/admin/users", "u-admin");
    expect(res.status()).toBe(200);
    expect(locationPath(res, baseURL!)).toBeNull();
  });

  test("admin: admin API passes the role check", async ({ request }) => {
    const res = await get(request, "/api/admin/users", "u-admin");
    expect([401, 403]).not.toContain(res.status());
  });

  test("field_agent: admin console redirects exactly as the pilot gate says", async ({ request, baseURL }) => {
    const gate = assertPilotRouteAccess("field_agent", "/admin/users");
    expect(gate.ok).toBe(false);
    const res = await get(request, "/admin/users", "u-field");
    expect(res.status()).toBe(307);
    expect(locationPath(res, baseURL!)).toBe(gate.ok ? null : gate.redirectTo);
  });

  test("field_agent: admin API returns 403", async ({ request }) => {
    const res = await get(request, "/api/admin/users", "u-field");
    expect(res.status()).toBe(403);
  });
});
