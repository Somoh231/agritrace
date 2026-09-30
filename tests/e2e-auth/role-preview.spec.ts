/**
 * Role-preview cookie: presentation only. A forged `ais_workspace_demo_role`
 * cookie must not open another role's workspace, grant admin, change API access
 * or alter what the dashboard shell renders for a single-role user.
 * Same harness as route-protection.spec.ts (stub Supabase, production build).
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import { assertPilotRouteAccess } from "@/lib/auth/workspace-access";
import { WORKSPACE_DEMO_ROLE_COOKIE } from "@/lib/auth/workspace-demo-role";

import { cookieHeader, type StubUser } from "./support/session";

const forged = (role: string) => ({ [WORKSPACE_DEMO_ROLE_COOKIE]: role });

async function get(request: APIRequestContext, path: string, user: StubUser, extra: Record<string, string> = {}) {
  return request.get(path, { maxRedirects: 0, headers: cookieHeader(user, extra) });
}

test.describe("forged preview cookie cannot widen access", () => {
  for (const [user, role, cookieRole, path] of [
    ["u-field", "field_agent", "admin", "/admin/users"],
    ["u-clan", "clan_technician", "ministry_admin", "/command-center"],
    ["u-clan", "clan_technician", "county_agriculture_coordinator", "/county-dashboard"],
    ["u-clan", "clan_technician", "ministry_admin", "/workspace/ministry"],
  ] as const) {
    test(`${role} with a forged ${cookieRole} cookie is still refused ${path}`, async ({ request, baseURL }) => {
      const res = await get(request, path, user, forged(cookieRole));
      const gate = assertPilotRouteAccess(role, path);
      expect(gate.ok).toBe(false);
      expect(res.status()).toBe(307);
      expect(new URL(res.headers()["location"]!, baseURL).pathname).toBe(gate.ok ? path : gate.redirectTo);
    });
  }

  test("forged admin preview does not grant the admin API", async ({ request }) => {
    const res = await get(request, "/api/admin/users", "u-field", forged("admin"));
    expect(res.status()).toBe(403);
  });

  test("forged preview does not change what the shell renders for a single-role user", async ({ request }) => {
    const plain = await (await get(request, "/farmers", "u-clan")).text();
    const withCookie = await (await get(request, "/farmers", "u-clan", forged("admin"))).text();
    const adminLinks = (html: string) => (html.match(/href="\/admin/g) ?? []).length;
    expect(adminLinks(withCookie)).toBe(adminLinks(plain));
    expect(withCookie.includes("Workspace preview")).toBe(false);
  });
});

test.describe("preview API only selects roles the user holds", () => {
  test("a field agent cannot set an admin preview", async ({ request }) => {
    const res = await request.post("/api/workspace-demo-role", {
      headers: { ...cookieHeader("u-field"), "content-type": "application/json" },
      data: { role: "admin" },
    });
    expect(res.status()).toBe(403);
    expect(res.headers()["set-cookie"] ?? "").not.toContain(WORKSPACE_DEMO_ROLE_COOKIE + "=admin");
  });

  test("the roles offered are exactly the user's own", async ({ request }) => {
    const res = await request.get("/api/workspace-demo-role", { headers: cookieHeader("u-clan") });
    expect(res.status()).toBe(200);
    expect((await res.json()).allowed).toEqual(["clan_technician"]);
  });

  test("selecting your own role and clearing the preview still work", async ({ request }) => {
    const own = await request.post("/api/workspace-demo-role", {
      headers: { ...cookieHeader("u-admin"), "content-type": "application/json" },
      data: { role: "admin" },
    });
    expect(own.status()).toBe(200);
    const clear = await request.delete("/api/workspace-demo-role", { headers: cookieHeader("u-admin") });
    expect(clear.status()).toBe(200);
  });

  test("a user without a profile gets no roles to preview", async ({ request }) => {
    const res = await request.post("/api/workspace-demo-role", {
      headers: { ...cookieHeader("u-missing"), "content-type": "application/json" },
      data: { role: "admin" },
    });
    expect(res.status()).toBe(403);
  });
});
