/* Agrivault operational offline service worker (minimal, deterministic).
 * Scope: same-origin only. Falls back to /offline for navigations when disconnected.
 */

const CACHE = "agrivault-offline-v2";
const CORE = ["/", "/offline", "/favicon.ico", "/og.svg", "/icons/pwa-192.png", "/icons/pwa-512.png", "/icons/pwa-512-maskable.png"];

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
      self.clients.claim();
    })(),
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (!isSameOrigin(req.url)) return;

  const isNav = req.mode === "navigate" || (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

  if (isNav) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone()).catch(() => {});
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(req)) || (await cache.match("/offline"));
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

