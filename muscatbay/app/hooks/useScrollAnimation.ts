"use client";

import { useRef, useEffect } from "react";

export interface ScrollAnimationConfig {
    /** Vertical offset to animate from (px). Default: 30 */
    y?: number;
    /** Animation duration in seconds. Default: 0.5 */
    duration?: number;
    /** Stagger delay between children in seconds. Default: 0.1 */
    stagger?: number;
    /** IntersectionObserver rootMargin. Default: '0px 0px -15% 0px' */
    rootMargin?: string;
    /** CSS selector for children to animate. Default: ':scope > *' (direct children) */
    childSelector?: string;
}

/**
 * Reusable hook that applies a CSS fade-in + slide-up animation to
 * the direct children of a container element when they enter the viewport.
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
        duration = 0.5,
        stagger = 0.1,
        rootMargin = "0px 0px -15% 0px",
        childSelector = ":scope > *",
    } = config;

    const containerRef = useRef<T>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const children = container.querySelectorAll(childSelector);
        if (children.length === 0) return;

        if (prefersReducedMotion) {
            children.forEach((child) => {
                const el = child as HTMLElement;
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            });
            return;
        }

        children.forEach((child) => {
            const el = child as HTMLElement;
            el.style.willChange = "opacity, transform";
            el.style.opacity = "0";
            el.style.transform = `translateY(${y}px)`;
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    children.forEach((child, i) => {
                        const el = child as HTMLElement;
                        el.style.transition = `opacity ${duration}s ease-out ${i * stagger}s, transform ${duration}s ease-out ${i * stagger}s`;
                        el.style.opacity = "1";
                        el.style.transform = "translateY(0)";
                        setTimeout(() => { el.style.willChange = 'auto'; }, (duration + i * stagger) * 1000);
                    });

                    observer.unobserve(entry.target);
                });
            },
            { rootMargin }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [y, duration, stagger, rootMargin, childSelector]);

    return containerRef;
}
