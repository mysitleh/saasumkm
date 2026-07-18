/// <reference lib="webworker" />

const CACHE_NAME = "umkmstore-v2";
const STATIC_ASSETS = ["/", "/register", "/manifest.webmanifest"];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Private/dynamic pages are always network-only to prevent cross-account stale data.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/order")
  ) return;

  // Next.js internals: network first
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Pages: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const cacheControl = response.headers.get("cache-control") || "";
        if (response.ok && !/private|no-store/i.test(cacheControl)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || new Response("Offline", { status: 503 })))
  );
});
