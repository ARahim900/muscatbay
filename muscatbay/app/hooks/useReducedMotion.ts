"use client";

import { useSyncExternalStore } from "react";
import { MOTION } from "@/lib/motion";

/**
 * Reactive `prefers-reduced-motion` binding for React render paths.
 *
 * `lib/motion.ts` already exports `prefersReducedMotion()`, but that is a
 * one-shot read meant to be called *at animation time* inside a GSAP effect.
 * It cannot drive a render: a component that calls it during render never
 * re-renders when the OS setting changes, and it has no SSR story.
 *
 * This hook subscribes to the media query, so a user toggling "Reduce motion"
 * mid-session sees charts settle immediately rather than on next navigation.
 *
 * `useSyncExternalStore` is the right primitive here — it gives a synchronous
 * first-render value on the client (no post-mount flash of motion) and a
 * separate server snapshot, which `useState` + `useEffect` cannot do.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
    }
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
    return window.matchMedia(QUERY).matches;
}

/**
 * Server snapshot errs toward *reduced*. Markup rendered on the server cannot
 * know the visitor's setting, and the accessible failure is a still chart, not
 * a moving one that a motion-sensitive user never asked for.
 */
function getServerSnapshot(): boolean {
    return true;
}

/** `true` when the user has asked the OS to reduce motion. */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Recharts animation props, spread onto a series element:
 *
 *     const chartMotion = useChartMotion();
 *     <Bar dataKey="total" {...chartMotion} />
 *
 * Recharts defaults `isAnimationActive` to `true` and exposes no global switch,
 * so every series has to opt in individually — which is exactly why 50 of them
 * were animating regardless of the user's setting before this existed.
 *
 * The duration also unifies the pace. Recharts' stock 1500ms is slower than
 * anything else in the app; `MOTION.dur.count` (1.1s) is what the KPI roll-ups
 * already use, so a chart and the number above it now settle together.
 */
export interface ChartMotionProps {
    isAnimationActive: boolean;
    animationDuration: number;
    animationBegin: number;
}

export function useChartMotion(index = 0): ChartMotionProps {
    const reduced = useReducedMotion();
    return {
        isAnimationActive: !reduced,
        animationDuration: MOTION.dur.count * 1000,
        // Series in the same chart cascade rather than all firing at once.
        // Capped so a busy chart (water monthly runs 18 series) still finishes
        // promptly instead of trickling in for several seconds.
        animationBegin: reduced ? 0 : Math.min(index, 6) * (MOTION.stagger.tight * 1000),
    };
}
