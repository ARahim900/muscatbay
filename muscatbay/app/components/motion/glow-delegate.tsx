"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * One delegated pointer listener that drives the `.mb-glow` cursor-tracked
 * sheen on every `[data-glow]` surface in the app (KPI tiles, interactive
 * cards). Mounted once in the layout — zero per-card listeners, rAF-throttled,
 * skipped entirely for touch devices and reduced-motion users.
 */
export function GlowDelegate() {
    useEffect(() => {
        if (prefersReducedMotion()) return;
        if (!window.matchMedia("(hover: hover)").matches) return;

        let raf = 0;
        let lastEvent: PointerEvent | null = null;

        const apply = () => {
            raf = 0;
            const e = lastEvent;
            if (!e) return;
            const target = e.target instanceof Element ? e.target : null;
            const el = target?.closest<HTMLElement>("[data-glow]");
            if (!el) return;
            const rect = el.getBoundingClientRect();
            el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
            el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
        };

        const onMove = (e: PointerEvent) => {
            lastEvent = e;
            if (!raf) raf = requestAnimationFrame(apply);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return null;
}
