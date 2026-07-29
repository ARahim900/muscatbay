"use client";

/**
 * Route-level error boundary. In the App Router this wraps the page segment
 * (the root layout — sidebar, topbar, providers — stays mounted OUTSIDE it), so
 * when a page throws during render or in an effect the operator sees a calm,
 * recoverable panel in the content area instead of a white screen that forces a
 * full reload. `reset()` re-renders just this segment; navigating away via the
 * still-present sidebar also recovers.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * A failed lazy-chunk load is not a bug in the page — it is the deploy race:
 * a session opened before a deploy still references old content-hashed chunk
 * URLs, and the first navigation to a not-yet-visited route 404s on them.
 * Observed live on 2026-07-29: an iPad PWA open across the 01:46 UTC deploy
 * hit this exact boundary when the operator tapped Water at 01:52.
 *
 * The fix for that case is always the same — reload, which fetches the new
 * shell and the new chunk hashes. Detect it and reload automatically (once),
 * so the operator never sees an error panel for a condition that self-heals.
 */
function isStaleChunkError(error: Error): boolean {
    const text = `${error.name} ${error.message}`;
    return (
        error.name === "ChunkLoadError" ||
        /Loading chunk [^ ]+ failed/i.test(text) ||
        /Failed to fetch dynamically imported module/i.test(text) ||
        /Importing a module script failed/i.test(text) ||
        /error loading dynamically imported module/i.test(text)
    );
}

/** One reload per session — a genuine outage must not become a reload loop. */
const RELOAD_GUARD_KEY = "mb-chunk-reload";

export default function RouteError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Keep a console breadcrumb; wire to telemetry here if/when it's added.
        console.error("Route error boundary caught:", error);

        if (isStaleChunkError(error)) {
            let alreadyTried = false;
            try {
                alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY) === "1";
                if (!alreadyTried) sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
            } catch {
                // Storage unavailable (private mode) — reload once anyway; the
                // guard only exists to stop loops, and without storage a loop
                // would need the server to keep serving a broken build.
            }
            if (!alreadyTried) window.location.reload();
        }
    }, [error]);

    return (
        <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mb-danger-light">
                <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
            </div>
            <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">This section hit an unexpected error</h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    The rest of the app is still running. Try again to reload just this section — you won&apos;t lose your place. If it keeps happening, use Reload page.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Try again
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                >
                    Reload page
                </button>
            </div>
            {error?.digest && <p className="text-[11px] text-muted-foreground/70">Ref: {error.digest}</p>}
        </div>
    );
}
