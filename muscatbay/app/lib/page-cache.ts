/**
 * Session-scoped, in-memory page-data cache (stale-while-revalidate).
 *
 * Why: every module page fetches its data client-side on mount. Without a
 * cache, each sidebar navigation — including returning to a module visited
 * seconds earlier — replaced the whole page with a skeleton until the fetch
 * resolved, making client-side transitions feel like full reloads.
 *
 * Pattern per page/hook:
 *   1. Seed initial state from `getPageCache(KEY)`; when a hit exists, start
 *      with `loading = false` so the page renders instantly with last data.
 *   2. Still fetch on mount (silently) and update state + cache in place.
 *   3. Write to `setPageCache(KEY, …)` after every successful live fetch.
 *
 * Scope: a module-level Map. It survives client-side route changes (the JS
 * module instance persists) and resets on a full document load, so hydration
 * always sees an empty cache — SSR/CSR markup can never diverge. Only cache
 * live (Supabase) results: failed/mock loads should retry on the next visit.
 */

const cache = new Map<string, unknown>();

/** Read a cached value. Returns undefined on miss (or on the server). */
export function getPageCache<T>(key: string): T | undefined {
    return cache.get(key) as T | undefined;
}

/** Store a value for the rest of the browsing session. */
export function setPageCache<T>(key: string, value: T): void {
    cache.set(key, value);
}

/** Drop one key, or the whole cache when no key is given (used in tests). */
export function clearPageCache(key?: string): void {
    if (key === undefined) cache.clear();
    else cache.delete(key);
}
