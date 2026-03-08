"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

export interface ScrollAnimationConfig {
    /** Vertical offset to animate from (px). Default: 30 */
    y?: number;
    /** Starting opacity. Default: 0 */
    opacity?: number;
    /** Animation duration in seconds. Default: 0.5 */
    duration?: number;
    /** Stagger delay between children in seconds. Default: 0.1 */
    stagger?: number;
    /** ScrollTrigger start position. Default: 'top 85%' */
    start?: string;
    /** CSS selector for children to animate. Default: ':scope > *' (direct children) */
    childSelector?: string;
    /** Easing function. Default: 'power2.out' */
    ease?: string;
}

/**
 * Reusable hook that applies a GSAP ScrollTrigger fade-in + slide-up
 * animation to the direct children of a container element.
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
        opacity = 0,
        duration = 0.5,
        stagger = 0.1,
        start = "top 85%",
        childSelector = ":scope > *",
        ease = "power2.out",
    } = config;

    const containerRef = useRef<T>(null);

    useGSAP(
        () => {
            const container = containerRef.current;
            if (!container) return;

            const children = container.querySelectorAll(childSelector);
            if (children.length === 0) return;

            gsap.fromTo(
                children,
                { y, opacity },
                {
                    y: 0,
                    opacity: 1,
                    duration,
                    stagger,
                    ease,
                    scrollTrigger: {
                        trigger: container,
                        start,
                        once: true,
                    },
                }
            );
        },
        { scope: containerRef, dependencies: [] }
    );

    return containerRef;
}
