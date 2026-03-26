const CACHE_NAME = "muscatbay-v3";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
];

// ─── Install ────────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch (caching strategy) ───────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Network-first for navigation, cache-first for static assets
      if (event.request.mode === "navigate") {
        return fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached || caches.match("/"));
      }

      // Network-first for _next/ assets (hashed chunks change per build)
      if (event.request.url.includes("/_next/")) {
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response("", { status: 503 }));
      }

      // Cache-first for other static assets
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful responses for same-origin
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ─── Push Notifications ─────────────────────────────────────────────────────────
// Handles push events from the server (future: web-push integration).
// Currently used for showNotification() calls from the main thread via
// ServiceWorkerRegistration.showNotification(), which works on both
// desktop and mobile (including iOS 16.4+ PWA).

self.addEventListener("push", (event) => {
  // Default notification if push payload is missing
  let title = "Muscat Bay Alert";
  let options = {
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "muscatbay-push",
    data: { url: "/" },
  };

  // Try to parse push data if available
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
      // If JSON parsing fails, use the text directly
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click ─────────────────────────────────────────────────────────
// When the user clicks a browser notification, focus the app or open it.

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    // Check if the app is already open in a tab
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already an open tab, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab/window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Notification Close ─────────────────────────────────────────────────────────
// Optional: track when notifications are dismissed (useful for analytics later)

self.addEventListener("notificationclose", () => {
  // No-op — placeholder for future analytics
});
