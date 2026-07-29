"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives the `mb-ticker-*` strips so the loop is seamless at every width.
 *
 * The CSS alone could not do this. The track holds two identical copies and
 * animates `translateX(0 → -50%)`, i.e. it shifts by exactly one copy's width
 * `W`. For the viewport `V` to stay covered at the worst moment of the cycle
 * you need `W >= V` — otherwise the content slides away and leaves a blank gap
 * before snapping back, which reads as a jammed ticker rather than a moving one.
 *
 * That is fine on a phone, where a handful of stats easily exceed a 182px
 * viewport, and broken on a desktop, where the same stats occupy ~440px inside
 * a ~1230px strip. The bug therefore only showed on wide screens.
 *
 * Two things follow, and both need a measurement the CSS cannot take:
 *
 * 1. **Only scroll when scrolling achieves something.** If `W < V` every stat
 *    is already on screen, so there is nothing to reveal — the strip is held
 *    static instead of sliding into an empty gap.
 * 2. **Constant speed, not constant duration.** A fixed 36s meant a short run
 *    crawled at ~12px/s while a long one raced. Duration is derived from width
 *    so the strip always travels at the same readable pace.
 */

/** Pixels per second. Slow enough to read a value in passing, quick enough to
 *  feel live. Lowered from 40 on the owner's request (2026-07-29) — at 40 the
 *  strip was readable but felt rushed on a control-room screen. */
const TICKER_SPEED_PX_PER_SEC = 26;

/** Below this the measurement is not trustworthy yet (fonts still loading, hidden container). */
const MIN_MEASURABLE_PX = 8;

export interface TickerLoop {
    /** Attach to the `.mb-ticker-viewport` element. */
    viewportRef: (node: HTMLElement | null) => void;
    /** Attach to the first `.mb-ticker-copy` run — the one that gets measured. */
    runRef: (node: HTMLElement | null) => void;
    /** False when everything already fits, so the strip should hold still. */
    isScrolling: boolean;
    /** Spread onto the `.mb-ticker-track` element. */
    trackProps: { "data-static"?: "true"; style?: React.CSSProperties };
}

export function useTickerLoop(): TickerLoop {
    const viewport = useRef<HTMLElement | null>(null);
    const run = useRef<HTMLElement | null>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);

    const measure = useCallback(() => {
        const v = viewport.current;
        const r = run.current;
        if (!v || !r) return;

        const viewportWidth = v.clientWidth;
        const runWidth = r.scrollWidth;
        if (runWidth < MIN_MEASURABLE_PX || viewportWidth < MIN_MEASURABLE_PX) return;

        // `>=` is the seamlessness condition derived above, not a heuristic.
        const shouldScroll = runWidth >= viewportWidth;
        setIsScrolling(shouldScroll);
        setDuration(shouldScroll ? runWidth / TICKER_SPEED_PX_PER_SEC : null);
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
        isScrolling,
        trackProps: isScrolling
            ? { style: duration ? ({ ["--mb-ticker-duration"]: `${duration.toFixed(2)}s` } as React.CSSProperties) : undefined }
            : { "data-static": "true" },
    };
}
