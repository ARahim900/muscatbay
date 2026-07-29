"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development the service worker is pure downside: the rebuild-heavy
    // dev loop regenerates hashed `_next/` chunks constantly, and a cached app
    // shell that still references now-deleted chunks makes those chunk requests
    // 404 — the bundle never loads, React never hydrates, and the app hangs on
    // the splash screen forever (the auto-reload rescue below can't fire because
    // it needs hydration to run). Never register the SW in dev, and proactively
    // tear down any SW + caches a previous run (or a visited preview/prod build)
    // left behind on this origin, so a stranded developer self-heals on reload.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        })
        .catch(() => {
          /* silent */
        });
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {
            /* silent */
          });
      }
      return;
    }

    // Only auto-reload when a PREVIOUS controller is being replaced by a
    // new SW. On a brand-new visit there is no controller yet, so skip the
    // reload — otherwise every first-time visitor would flash a reload.
    const hadPreviousController = !!navigator.serviceWorker.controller;
    let reloaded = false;

    const onControllerChange = () => {
      if (!hadPreviousController || reloaded) return;
      reloaded = true;
      // Reload picks up the fresh HTML + Next.js chunks from network,
      // unsticking users whose cache contained pre-bump chunk hashes.
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // The app booted cleanly — re-arm the route error boundary's one-shot
    // stale-chunk reload (app/error.tsx) so the NEXT deploy race can also
    // self-heal in this tab.
    try {
      sessionStorage.removeItem("mb-chunk-reload");
    } catch {
      /* storage unavailable — the guard simply stays conservative */
    }

    // Register with `updateViaCache: "none"` so the browser re-fetches
    // sw.js on every navigation rather than serving it from HTTP cache;
    // combined with the explicit `registration.update()` call below this
    // guarantees users always see the latest SW version on their next
    // visit after a deploy.
    let updateTimer: ReturnType<typeof setInterval> | null = null;
    let onVisible: (() => void) | null = null;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        const checkForUpdate = () => {
          registration.update().catch(() => {
            /* silent — offline etc. */
          });
        };
        checkForUpdate();

        // A control-room tablet keeps one session open for days, so a single
        // mount-time check leaves it referencing pre-deploy chunk hashes until
        // something 404s (observed 2026-07-29: an open iPad hit the route
        // error boundary on its first navigation after a deploy). Re-check on
        // a slow interval and whenever the app returns to the foreground, so
        // the controllerchange reload above adopts the new build before the
        // operator trips over it.
        updateTimer = setInterval(checkForUpdate, 30 * 60 * 1000);
        onVisible = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch(() => {
        // Service worker registration failed — silent fallback
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (updateTimer !== null) clearInterval(updateTimer);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
