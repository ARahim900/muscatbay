"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives the `mb-ticker-*` strips so the loop is seamless at every width.
 *
 * The CSS alone could not do this. The track holds identical copies of the
 * stat run and animates `translateX(0 → -50%)`, i.e. it shifts by exactly half
 * the track. For the viewport `V` to stay covered at the worst moment of the
 * cycle, that half must be at least `V` wide — otherwise the content slides
 * away and leaves a blank gap before snapping back, which reads as a jammed
 * ticker rather than a moving one.
 *
 * The first fix (2026-07-26) satisfied that constraint by holding the strip
 * STATIC whenever one run was narrower than the viewport. Correct, but the
 * owner's verdict (2026-07-29) was that a news band should always be moving —
 * a still ticker reads as broken. So the constraint is now satisfied the way
 * a real news channel does it: the run is REPEATED until one half of the
 * track is at least viewport-wide (`repeat = ceil(V / W)` copies per half),
 * and the strip always scrolls.
 *
 * Both need a measurement the CSS cannot take, which is why this hook exists:
 *
 * 1. **Repeat enough to be seamless.** `repeat` is how many copies of the run
 *    each half of the track needs. The component renders `2 × repeat` runs.
 * 2. **Constant speed, not constant duration.** One cycle travels half the
 *    track (`repeat × W` px), so duration derives from that distance — every
 *    strip moves at the same readable pace regardless of content length.
 *
 * Reduced motion is handled in CSS (`prefers-reduced-motion`): the animation
 * is disabled, every `aria-hidden` copy is hidden (so repetition never shows
 * duplicated stats), and the single remaining run becomes swipeable.
 */

/** Pixels per second. Slow enough to read a value in passing, quick enough to
 *  feel live. Lowered from 40 on the owner's request (2026-07-29). */
const TICKER_SPEED_PX_PER_SEC = 26;

/** Below this the measurement is not trustworthy yet (fonts still loading, hidden container). */
const MIN_MEASURABLE_PX = 8;

/** Hard cap so a pathological measurement (e.g. a 1px run) cannot explode the DOM. */
const MAX_REPEAT = 12;

export interface TickerLoop {
    /** Attach to the `.mb-ticker-viewport` element. */
    viewportRef: (node: HTMLElement | null) => void;
    /** Attach to the FIRST `.mb-ticker-copy` run only — the one that gets measured. */
    runRef: (node: HTMLElement | null) => void;
    /** Copies of the run per half-track. Render `2 × repeat` runs in total. */
    repeat: number;
    /** Spread onto the `.mb-ticker-track` element. */
    trackProps: { "data-static"?: "true"; style?: React.CSSProperties };
}

export function useTickerLoop(): TickerLoop {
    const viewport = useRef<HTMLElement | null>(null);
    const run = useRef<HTMLElement | null>(null);
    const [repeat, setRepeat] = useState(1);
    const [duration, setDuration] = useState<number | null>(null);

    const measure = useCallback(() => {
        const v = viewport.current;
        const r = run.current;
        if (!v || !r) return;

        const viewportWidth = v.clientWidth;
        const runWidth = r.scrollWidth;
        // Unmeasurable (hidden container, fonts not in yet) — keep the current
        // state (initially static) rather than animate blindly into a gap; the
        // observers below re-measure once there is real geometry.
        if (runWidth < MIN_MEASURABLE_PX || viewportWidth < MIN_MEASURABLE_PX) return;

        // Seamlessness condition: repeat × runWidth ≥ viewportWidth.
        const needed = Math.min(MAX_REPEAT, Math.max(1, Math.ceil(viewportWidth / runWidth)));
        setRepeat(needed);
        // One cycle travels half the track — `needed` copies of the run.
        setDuration((needed * runWidth) / TICKER_SPEED_PX_PER_SEC);
    }, []);

    // Re-measure on resize, on font load, and whenever the strip's own content
    // reflows — the stats change as data refreshes, which changes the width.
    useEffect(() => {
        measure();
        if (typeof ResizeObserver === "undefined") return;

        const ro = new ResizeObserver(measure);
        if (viewport.current) ro.observe(viewport.current);
        if (run.current) ro.observe(run.current);

        // Web fonts land after first paint and change text width materially.
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        fonts?.ready?.then(measure).catch(() => {});

        return () => ro.disconnect();
    }, [measure]);

    const viewportRef = useCallback((node: HTMLElement | null) => {
        viewport.current = node;
        measure();
    }, [measure]);

    const runRef = useCallback((node: HTMLElement | null) => {
        run.current = node;
        measure();
    }, [measure]);

    return {
        viewportRef,
        runRef,
        repeat,
        trackProps: duration !== null
            ? { style: { ["--mb-ticker-duration"]: `${duration.toFixed(2)}s` } as React.CSSProperties }
            // Only while unmeasured: no animation, duplicates hidden — never a
            // half-measured strip sliding into a blank gap.
            : { "data-static": "true" },
    };
}
