"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * Motion design tokens — the single choreography language for GSAP work.
 * Durations are seconds (GSAP convention). Keep every animated surface on
 * these values so water, electricity, STP, etc. move as one system.
 */
export const MOTION = {
    dur: {
        /** Micro feedback: presses, toggles */
        xs: 0.18,
        /** Small reveals: chips, badges */
        sm: 0.35,
        /** Standard entrance: cards, rows */
        md: 0.6,
        /** Orchestrated entrances: headers, hero */
        lg: 0.85,
        /** Numeric roll-ups */
        count: 1.1,
    },
    ease: {
        /** Default decelerate — calm, professional settle */
        out: "power3.out",
        /** Stronger decelerate for hero/headline moments */
        outExpo: "expo.out",
        /** Symmetric moves (indicator slides) */
        inOut: "power2.inOut",
    },
    stagger: {
        tight: 0.05,
        base: 0.07,
        relaxed: 0.1,
    },
} as const;

/** Live check — call at animation time, not module scope, so OS-level changes apply. */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * useLayoutEffect on the client (so initial GSAP states apply before paint —
 * no flash of unstyled motion), useEffect during SSR to silence the React warning.
 */
export const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;
