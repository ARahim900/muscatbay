"use client";

/**
 * Reports the URL's search params to a page on mount AND whenever they change
 * while the page stays mounted.
 *
 * Why this exists: App Router keeps a page mounted when only its query string
 * changes (router cache key without search params), so a page that read
 * `window.location.search` once on mount ignored every later `?view=` / `?tab=`
 * link — tapping an alert while already on that page did nothing. Navigation
 * through <Link> or router.push fires no `popstate`, so listening for that was
 * not enough either; `useSearchParams` covers links, back/forward and native
 * history calls alike.
 *
 * It is a render-nothing child in its own Suspense boundary on purpose: during
 * static prerendering `useSearchParams` bails out to the nearest boundary, and
 * keeping that boundary around an empty node means the page itself still
 * prerenders in full.
 */

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SearchParamsListenerProps {
    /**
     * Receives a fresh copy of the params. Keep it stable (useCallback) — it is
     * an effect dependency, and it re-fires only when the query string changes.
     */
    onChange: (params: URLSearchParams) => void;
}

function Listener({ onChange }: SearchParamsListenerProps) {
    const searchParams = useSearchParams();
    const query = searchParams?.toString() ?? "";

    useEffect(() => {
        onChange(new URLSearchParams(query));
    }, [query, onChange]);

    return null;
}

export function SearchParamsListener(props: SearchParamsListenerProps) {
    return (
        <Suspense fallback={null}>
            <Listener {...props} />
        </Suspense>
    );
}
