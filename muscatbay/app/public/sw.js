/* Muscat Bay Operations — service worker
 *
 * The app is READ-ONLY: it renders live plant data and never writes from the
 * client. There is therefore deliberately NO background-sync / offline write
 * queue here — an operator must never believe a change was saved offline.
 *
 * Strategy
 * ────────
 *   navigations       network-first → cached page → /offline.html
 *   /_next/static/*    cache-first (immutable, content-hashed URLs)
 *   other same-origin  stale-while-revalidate (icons, images, manifest)
 *   /api/*, /auth/*    network-only, never cached (auth + live data)
 *   cross-origin       passthrough (Supabase, fonts — never cached here)
 *
 * Versioning
 * ──────────
 * Bump CACHE_VERSION to invalidate every cache; `activate` deletes any cache
 * whose name is not in the current set, then claims open clients (register-sw
 * reloads them on controllerchange), so stale sessions self-heal on next visit.
 *
 * History:
 *   v14 (2026-09-16) routes both MapLibre and compatibility satellite imagery
 *                    through the same-origin tile proxy and refreshes iOS PWAs.
 *   v13 (2026-09-16) cache-busts the Satellite iframe and compatibility
 *                    scripts so existing iOS PWA sessions cannot reuse v11.
 *   v12 (2026-09-16) replaces the iOS compatibility map's single ArcGIS
 *                    export image with same-origin satellite tiles.
 *   v11 (2026-09-15) ships the non-WebGL Satellite compatibility map to iOS
 *                    clients that cannot create a MapLibre graphics context.
 *   v10 (2026-09-15) refreshes iOS clients after the Satellite view added
 *                    compatibility guards for reduced browser API support.
 *   v9 (2026-09-08) flushes clients holding the pre-Hand-Readings bundle. The
 *                   hand-readings tables were renamed `reading` → `consumption`
 *                   in the same deploy; an open tab kept its cached
 *                   `_next/static` chunks (this file was unchanged, so no new
 *                   SW installed and no controllerchange reload fired) and
 *                   asked PostgREST for a column that no longer exists —
 *                   "column irrigation_daily_readings.reading does not exist".
 *                   A SHIPPED SCHEMA CHANGE THEREFORE NEEDS A VERSION BUMP
 *                   HERE: content-hashed chunks are only picked up once a new
 *                   SW claims the client.
 *   v8 (2026-08-30) re-precaches the brand mark. /logo.png was missing from the
 *                   build for a period; `install` runs once per SW version and
 *                   tolerates a per-asset failure, so every client that
 *                   installed v7 in that window holds a shell cache with no
 *                   mark and would never retry. Restoring the file alone does
 *                   not repair them — only a version bump re-runs `install`.
 *   v7 (2026-07-25) split shell/static/pages caches, added the offline shell,
 *                   stale-while-revalidate, and an explicit no-cache list for
 *                   authenticated endpoints.
 *   v6 flushed clients showing pre-auto-sync water data.
 *   v5 unstuck clients stranded on an app shell referencing deleted chunks.
 */

const CACHE_VERSION = "v14";
const SHELL_CACHE = `muscatbay-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `muscatbay-static-${CACHE_VERSION}`;
const PAGES_CACHE = `muscatbay-pages-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, PAGES_CACHE];

const OFFLINE_URL = "/offline.html";

/** Precached offline shell — must stay small and must always resolve. */
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

/** Never cached: authenticated or inherently live endpoints. */
const NO_STORE_PREFIXES = ["/api/", "/auth/"];

/** Cap the page cache so a long session can't grow it without bound. */
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch((err) => {
            console.warn("[sw] could not precache", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isNoStore(url) {
  return NO_STORE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  const response = await network;
  if (response) return response;
  throw new Error("offline and not cached");
}

async function handleNavigation(event) {
  const { request } = event;
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const response = preload || (await fetch(request));
    if (response && response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
      void trimCache(PAGES_CACHE, MAX_PAGES);
    }
    return response;
  } catch {
    const cachedPage = await caches.match(request, { ignoreSearch: true });
    if (cachedPage) return cachedPage;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (!isSameOrigin(url)) return;
  if (isNoStore(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).catch(
        () => new Response("", { status: 503, statusText: "Offline" })
      )
    );
    return;
  }

  event.respondWith(
    staleWhileRevalidate(event, STATIC_CACHE).catch(
      () => new Response("", { status: 503, statusText: "Offline" })
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let title = "Muscat Bay Alert";
  let options = {
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "muscatbay-push",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options = {
        body: payload.message || payload.body || options.body,
        icon: payload.icon || options.icon,
        badge: options.badge,
        tag: payload.tag || options.tag,
        data: { url: payload.url || "/" },
      };
    } catch {
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("notificationclose", () => {});
