"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive "phone-width viewport" binding for render paths that cannot be
 * solved with a Tailwind breakpoint class — e.g. Recharts props such as a
 * donut's slice `label`, which are JavaScript, not CSS.
 *
 * Mirrors Tailwind's `sm` breakpoint (640px): `true` below it. Built on
 * `useSyncExternalStore` like `useReducedMotion`, so the first client render
 * already has the right value and rotating the phone re-renders immediately.
 */

const QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void): () => void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
    }
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(QUERY).matches;
}

/** Server markup cannot know the width; render the desktop layout and let the client correct it. */
function getServerSnapshot(): boolean {
    return false;
}

/** `true` when the viewport is narrower than Tailwind's `sm` breakpoint (640px). */
export function useIsPhone(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
