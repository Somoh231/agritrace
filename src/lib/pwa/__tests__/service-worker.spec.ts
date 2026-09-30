/**
 * Service-worker boundary and invite-redirect checks. Loads the real
 * public/sw.js in a sandbox and asserts its routing decisions.
 * Run with: npm run test:pwa
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { AUTH_REDIRECT_SCRIPT } from "@/lib/auth/auth-redirect-script";
import { PUBLIC_SITE_ROUTES } from "@/lib/site/routes";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ORIGIN = "https://agrivaultdata.com";
const swSource = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");
const listeners: Record<string, (e: unknown) => void> = {};
const sandbox: Record<string, unknown> = {
  URL,
  console,
  self: { location: new URL(ORIGIN), addEventListener: (t: string, fn: (e: unknown) => void) => (listeners[t] = fn) },
};
vm.runInNewContext(swSource, sandbox);
type Req = { url: string; method?: string; mode?: string; destination?: string; headers?: Record<string, string> };
const sw = (sandbox.self as { __agrivaultSw: { routeFor: (r: unknown) => string; PLATFORM_ROOTS: string[]; CACHE: string } }).__agrivaultSw;
const req = (r: Req) => ({
  method: r.method ?? "GET",
  url: r.url.startsWith("http") ? r.url : ORIGIN + r.url,
  mode: r.mode ?? "navigate",
  destination: r.destination ?? "document",
  headers: { get: (k: string) => (r.headers ?? {})[k] ?? (k === "accept" ? "text/html" : null) },
});
const nav = (u: string) => sw.routeFor(req({ url: u }));
const asset = (u: string) => sw.routeFor(req({ url: u, mode: "no-cors", destination: "script", headers: { accept: "*/*" } }));

console.log("service worker — public website and auth entry are never intercepted");
check("every public website route bypasses the worker", () => {
  for (const r of PUBLIC_SITE_ROUTES) assert.equal(nav(r), "bypass", r);
});
check("login, invitation, callback, password and account pages bypass the worker", () => {
  for (const u of ["/login", "/login?redirectTo=%2Fapp", "/auth/callback", "/auth/set-password?flow=invite", "/account-unavailable"]) {
    assert.equal(nav(u), "bypass", u);
  }
});
check("any URL carrying an auth token bypasses the worker, even on a platform route", () => {
  for (const u of ["/?code=abc", "/auth/callback?token_hash=x&type=invite", "/app?code=abc", "/command-center?access_token=x", "/farmers?type=recovery"]) {
    assert.equal(nav(u), "bypass", u);
  }
});
check("APIs, RSC payloads, non-GET and cross-origin requests bypass the worker", () => {
  assert.equal(nav("/api/health"), "bypass");
  assert.equal(nav("/farmers?_rsc=1"), "bypass");
  assert.equal(sw.routeFor(req({ url: "/farmers", headers: { RSC: "1", accept: "text/x-component" } })), "bypass");
  assert.equal(sw.routeFor(req({ url: "/farmers", method: "POST" })), "bypass");
  assert.equal(nav("https://example.com/farmers"), "bypass");
});
check("public images and other public files bypass the worker", () => {
  assert.equal(asset("/opengraph-image"), "bypass");
  assert.equal(asset("/photography/field.jpg"), "bypass");
  assert.equal(asset("/manifest.webmanifest"), "bypass");
});
check("the homepage is not precached as an app shell", () => {
  const core = /const CORE = \[([^\]]*)\]/.exec(swSource)?.[1] ?? "";
  assert.equal(/"\/"(,|\s|$)/.test(core), false);
  assert.match(sw.CACHE, /v4$/);
});

console.log("service worker — the platform keeps its offline behaviour");
check("platform navigations are handled (network first, offline fallback)", () => {
  for (const u of ["/app", "/command-center", "/workspace/clan", "/inventory/transfers", "/gis-intelligence", "/admin/users", "/field/mobile", "/farmers"]) {
    assert.equal(nav(u), "platform-nav", u);
  }
});
check("immutable static assets and map data are cached", () => {
  assert.equal(asset("/_next/static/chunks/main-abc.js"), "static");
  assert.equal(asset("/icons/pwa-192.png"), "static");
  assert.equal(asset("/data/liberia-counties.geojson"), "static");
});
check("platform routes in the worker equal the middleware's protected roots", () => {
  const mw = fs.readFileSync(path.join(process.cwd(), "src", "middleware.ts"), "utf8");
  const block = mw.slice(mw.indexOf("const roots = ["), mw.indexOf("];", mw.indexOf("const roots = [")));
  const roots = [...block.matchAll(/"(\/[a-z0-9/-]+)"/g)].map((m) => m[1]);
  assert.ok(roots.length > 20);
  assert.deepEqual([...sw.PLATFORM_ROOTS].sort(), [...roots].sort());
});
check("bypassed requests are left alone: respondWith is never called", () => {
  let responded = 0;
  const event = (u: string) => ({ request: req({ url: u }), respondWith: () => responded++ });
  for (const u of ["/", "/about", "/login", "/auth/callback", "/?code=x"]) listeners.fetch(event(u));
  assert.equal(responded, 0);
});

console.log("invitation links");
const runRedirect = (href: string) => {
  const u = new URL(href);
  let replaced: string | null = null;
  vm.runInNewContext(AUTH_REDIRECT_SCRIPT, {
    URLSearchParams,
    window: { location: { pathname: u.pathname, search: u.search, hash: u.hash, replace: (to: string) => (replaced = to) } },
  });
  return replaced;
};
check("an invite landing on the site root goes to the callback with the fragment intact", () => {
  assert.equal(runRedirect(`${ORIGIN}/#access_token=a.b.c&refresh_token=r&type=invite`), "/auth/callback#access_token=a.b.c&refresh_token=r&type=invite");
});
check("an invite landing on /login or /app is also handed to the callback", () => {
  assert.equal(runRedirect(`${ORIGIN}/login#access_token=a.b.c&type=invite`), "/auth/callback#access_token=a.b.c&type=invite");
  assert.equal(runRedirect(`${ORIGIN}/app#error=access_denied&error_code=otp_expired`), "/auth/callback#error=access_denied&error_code=otp_expired");
});
check("OTP and PKCE query links are handed to the callback", () => {
  assert.equal(runRedirect(`${ORIGIN}/?token_hash=h&type=invite`), "/auth/callback?token_hash=h&type=invite");
  assert.equal(runRedirect(`${ORIGIN}/?code=c`), "/auth/callback?code=c");
});
check("ordinary pages, anchors and the callback itself are left alone", () => {
  for (const u of [`${ORIGIN}/`, `${ORIGIN}/what-we-do#systems`, `${ORIGIN}/contact?topic=programme`, `${ORIGIN}/about?code=x`, `${ORIGIN}/auth/callback#access_token=a&type=invite`]) {
    assert.equal(runRedirect(u), null, u);
  }
});

console.log(`\n${passed} checks passed`);
