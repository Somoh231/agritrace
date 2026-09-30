/* AgriVault platform service worker.
 *
 * Only the authenticated platform uses this worker: it is registered from the
 * platform shell, never from the public website, login or invitation pages.
 * Its scope has to be "/" because platform routes live at the root, so the
 * fetch handler is an explicit allowlist:
 *
 *   - Navigations to PLATFORM_ROOTS: network first; offline falls back to the
 *     last good copy, then /offline. Only 200 responses that end on a platform
 *     route are stored (never a redirect to /login).
 *   - Immutable static assets (/_next/static, /icons, /data): cache first.
 *   - Everything else is not intercepted and goes to the network as if no
 *     worker existed: the public website, /login, /auth/* (invitation,
 *     recovery, callback), /account-unavailable, /api/*, React Server
 *     Component payloads and any URL carrying auth tokens.
 *
 * Bumping CACHE deletes every older cache on activation (v3 held the public
 * homepage as an app shell).
 */

const CACHE = "agrivault-platform-v4";
const CORE = ["/offline", "/icons/pwa-192.png", "/icons/pwa-512.png", "/icons/pwa-512-maskable.png"];

// Keep in sync with the protected roots in src/middleware.ts (enforced by
// src/lib/pwa/__tests__/service-worker.spec.ts).
const PLATFORM_ROOTS = [
  "/command-center",
  "/county-dashboard",
  "/district-dashboard",
  "/executive-briefing",
  "/alerts",
  "/national-operations",
  "/farmers",
  "/cooperatives",
  "/geo-registry",
  "/verification-queue",
  "/transfers",
  "/registration-approvals",
  "/field-agents",
  "/field",
  "/inventory",
  "/operations",
  "/subsidies",
  "/production",
  "/compliance",
  "/reports",
  "/reporting",
  "/logistics",
  "/food-security",
  "/county-operations",
  "/rice",
  "/cocoa",
  "/map",
  "/national-heat-map",
  "/gis-intelligence",
  "/donor-dashboard",
  "/audit-tools",
  "/farm-profiles",
  "/inventory/equipment",
  "/inventory/warehouse",
  "/production/market-prices",
  "/search",
  "/activity",
  "/workspace",
  "/admin",
  "/dashboard",
  "/app",
];

const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/data/"];

// Query parameters that carry credentials or one-time tokens.
const SENSITIVE_PARAMS = ["code", "token", "token_hash", "access_token", "refresh_token", "type", "error_code"];

function isPlatformPath(pathname) {
  return PLATFORM_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

function carriesAuthToken(url) {
  return SENSITIVE_PARAMS.some((p) => url.searchParams.has(p));
}

/** What the worker does with a request: "platform-nav", "static" or "bypass". */
function routeFor(req) {
  if (req.method !== "GET") return "bypass";
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return "bypass";
  }
  if (url.origin !== self.location.origin) return "bypass";
  if (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc") || req.headers.get("RSC") === "1") return "bypass";
  if (carriesAuthToken(url)) return "bypass";

  const isNav = req.mode === "navigate" || (req.destination === "" && (req.headers.get("accept") || "").includes("text/html"));
  if (isNav) return isPlatformPath(url.pathname) ? "platform-nav" : "bypass";
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return "static";
  return "bypass";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const path of CORE) {
        try {
          await cache.add(path);
        } catch (err) {
          console.warn("[sw] precache failed", path, err);
        }
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const route = routeFor(req);
  if (route === "bypass") return; // not intercepted: the browser's normal network behaviour

  if (route === "platform-nav") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const finalPath = new URL(res.url || req.url).pathname;
          if (res.status === 200 && isPlatformPath(finalPath)) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(req)) || (await cache.match("/offline")) || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});

// Exposed for the unit tests that load this file in a sandbox.
self.__agrivaultSw = { routeFor, isPlatformPath, PLATFORM_ROOTS, CACHE };
