// Minimal service worker for Tybelos (manual PWA).
// Strategy:
// - Navigations: network-first, fallback to cache, then /offline.
// - Static assets: cache-first.

const CACHE_NAME = "tybelos-cache-v1";

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/decisioni/nuova",
  "/log",
  "/vincoli",
  "/escalation",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
  "/icons/apple-touch-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve(false);
        })
      );
      await self.clients.claim();
    })()
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".jpeg") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (isStaticAsset(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      })()
    );
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const fresh = await fetch(request);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return cache.match("/offline");
        }
      })()
    );
  }
});

