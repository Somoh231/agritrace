/* Agrivault operational offline service worker (minimal, deterministic).
 *
 * Caching policy — data must never be served stale from this worker:
 *   - Hashed build assets and icons: cache-first (immutable).
 *   - /api/* and React Server Component payloads: network only, never cached.
 *   - Navigations: network-first. Only the field-capture shells below are kept
 *     for offline use; every other page falls back to /offline when disconnected.
 *   - Sign-out posts CLEAR_PRIVATE_CACHE so cached shells never outlive a session.
 * Bumping CACHE purges every earlier cache on activation (v2 cached API
 * responses and RSC payloads cache-first, which served stale queues).
 */

const CACHE = "agrivault-offline-v3";
const CORE = ["/offline", "/favicon.ico", "/og.svg", "/icons/pwa-192.png", "/icons/pwa-512.png", "/icons/pwa-512-maskable.png"];
const OFFLINE_SHELLS = ["/field", "/field/mobile", "/field/boundary-capture", "/field/sync-queue", "/workspace/clan"];

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

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_PRIVATE_CACHE") return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const req of await cache.keys()) {
        const path = new URL(req.url).pathname;
        if (!CORE.includes(path) && !isStaticAsset(path)) await cache.delete(req);
      }
    })(),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    /\.(?:png|svg|ico|webp|avif|woff2?)$/.test(pathname)
  );
}

function isOfflineShell(pathname) {
  return OFFLINE_SHELLS.includes(pathname.replace(/\/$/, "") || "/");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Live data: never cached, never answered from cache.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/monitoring") ||
    url.searchParams.has("_rsc") ||
    req.headers.get("RSC") === "1" ||
    req.headers.has("Next-Router-State-Tree")
  ) {
    return;
  }

  const isNav = req.mode === "navigate";
  if (isNav) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && !res.redirected && isOfflineShell(url.pathname)) {
            const cache = await caches.open(CACHE);
            cache.put(url.pathname, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (isOfflineShell(url.pathname) ? await cache.match(url.pathname) : undefined) ||
            (await cache.match("/offline")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  if (!isStaticAsset(url.pathname)) return;

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
        return Response.error();
      }
    })(),
  );
});
