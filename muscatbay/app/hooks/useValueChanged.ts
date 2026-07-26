"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * True for a short window after `value` changes — used to briefly mark a figure
 * that has just moved.
 *
 * The dashboard refreshes from Supabase realtime while an operator is looking at
 * it, and until now a number could change under them with nothing to say it had.
 * On a wall-mounted or glanced-at screen that is the difference between noticing
 * a reading and missing it.
 *
 * Never fires on first render: `previous` is seeded with the initial value, so a
 * figure appearing for the first time has not "changed". Flashing every tile on
 * load would train people to ignore the signal, which is the opposite of the
 * point.
 *
 * Stays `false` throughout under `prefers-reduced-motion`. The highlight is a
 * reinforcement, never the only carrier of the information — the figure itself
 * updates either way.
 */
export function useValueChanged(value: string | number | null | undefined, holdMs = 1400): boolean {
    // Comparing against state rather than a ref, so the comparison happens
    // during render. This is React's documented "adjust state when a prop
    // changes" pattern — it avoids setting state synchronously inside an
    // effect, which triggers a second render pass for every update.
    const [previous, setPrevious] = useState(value);
    const [changed, setChanged] = useState(false);
    const reduced = useReducedMotion();

    if (previous !== value) {
        setPrevious(value);
        if (!reduced) setChanged(true);
    }

    // Clearing is genuinely time-based, so it belongs in an effect — and the
    // setState runs in the timer callback, not in the effect body.
    useEffect(() => {
        if (!changed) return;
        const timer = window.setTimeout(() => setChanged(false), holdMs);
        return () => window.clearTimeout(timer);
    }, [changed, holdMs]);

    return changed;
}
