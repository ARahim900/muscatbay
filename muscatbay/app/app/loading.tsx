/**
 * Route-segment loading UI. The App Router streams this in while a segment's
 * server work resolves, so navigation paints the page's *shape* immediately
 * instead of leaving the operator on the previous screen with no feedback.
 *
 * It lives at the root so every segment that does not ship its own
 * `loading.tsx` inherits it — one consistent skeleton for the whole app.
 */

import { PageSkeleton } from "@/components/shared/skeleton";

export default function Loading() {
    return (
        <div role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading page…</span>
            <PageSkeleton />
        </div>
    );
}
