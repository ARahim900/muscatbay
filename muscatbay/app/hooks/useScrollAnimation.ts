"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

export interface ScrollAnimationConfig {
    /** Vertical offset to animate from (px). Default: 30 */
    y?: number;
    /** Animation duration in seconds. Default: 0.6 */
    duration?: number;
    /** Stagger delay between children in seconds. Default: 0.07 */
    stagger?: number;
    /** IntersectionObserver rootMargin. Default: '0px 0px -15% 0px' */
    rootMargin?: string;
    /** CSS selector for children to animate. Default: ':scope > *' (direct children) */
    childSelector?: string;
}

/**
 * GSAP-powered scroll reveal: fades + lifts the children of a container the
 * first time it enters the viewport, with a calm exponential settle.
 *
 * IntersectionObserver does the (cheap) triggering; GSAP does the (precise)
 * choreography. Inline transforms are cleared after the timeline completes so
 * hover lifts and sticky positioning inside revealed cards keep working.
 *
 * Usage:
 *   const containerRef = useScrollAnimation<HTMLDivElement>();
 *   return <div ref={containerRef}>...children...</div>
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
    config: ScrollAnimationConfig = {}
) {
    const {
        y = 30,
        duration = MOTION.dur.md,
        stagger = MOTION.stagger.base,
        rootMargin = "0px 0px -15% 0px",
        childSelector = ":scope > *",
    } = config;

    const containerRef = useRef<T>(null);

    useIsomorphicLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const targets = Array.from(container.querySelectorAll<HTMLElement>(childSelector));
        if (targets.length === 0) return;

        if (prefersReducedMotion()) {
            gsap.set(targets, { clearProps: "opacity,visibility,transform" });
            return;
        }

        // autoAlpha (opacity + visibility) keeps hidden children out of the
        // accessibility tree / tab order until they reveal.
        gsap.set(targets, { autoAlpha: 0, y });

        let timeline: gsap.core.Timeline | null = null;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                observer.disconnect();

                timeline = gsap.timeline().to(targets, {
                    autoAlpha: 1,
                    y: 0,
                    duration,
                    ease: MOTION.ease.out,
                    stagger,
                    clearProps: "opacity,visibility,transform",
                });
            },
            { rootMargin }
        );
        observer.observe(container);

        return () => {
            observer.disconnect();
            timeline?.kill();
            gsap.set(targets, { clearProps: "opacity,visibility,transform" });
        };
    }, [y, duration, stagger, rootMargin, childSelector]);

    return containerRef;
}
