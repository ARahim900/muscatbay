"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

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

    // Register with `updateViaCache: "none"` so the browser re-fetches
    // sw.js on every navigation rather than serving it from HTTP cache;
    // combined with the explicit `registration.update()` call below this
    // guarantees users always see the latest SW version on their next
    // visit after a deploy.
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => {
          /* silent — offline etc. */
        });
      })
      .catch(() => {
        // Service worker registration failed — silent fallback
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
