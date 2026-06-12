"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { parseMetricValue, formatMetricValue } from "@/lib/count-format";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

interface CountUpProps {
    /** Pre-formatted display value, e.g. "92,051.5 OMR" — rendered verbatim at rest */
    value: string;
    className?: string;
    /** Start delay in seconds (sync with surrounding stagger) */
    delay?: number;
    /** Override roll-up duration in seconds */
    duration?: number;
}

/**
 * Rolls a KPI number up to its value the first time it scrolls into view.
 * SSR markup, reduced-motion, and non-numeric values ("N/A") all render the
 * final string directly, so the animated and static paths are pixel-identical.
 */
export function CountUp({ value, className, delay = 0, duration = MOTION.dur.count }: CountUpProps) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const parsed = useMemo(() => parseMetricValue(value), [value]);

    useIsomorphicLayoutEffect(() => {
        const el = spanRef.current;
        if (!el || !parsed || prefersReducedMotion()) return;

        let tween: gsap.core.Tween | null = null;
        const counter = { n: 0 };

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                observer.disconnect();

                el.textContent = formatMetricValue(parsed, 0);
                tween = gsap.to(counter, {
                    n: parsed.value,
                    duration,
                    delay,
                    ease: MOTION.ease.outExpo,
                    onUpdate: () => {
                        el.textContent = formatMetricValue(parsed, counter.n);
                    },
                    // Land on the exact source string — no rounding drift
                    onComplete: () => {
                        el.textContent = value;
                    },
                });
            },
            { rootMargin: "0px 0px -10% 0px" }
        );
        observer.observe(el);

        return () => {
            observer.disconnect();
            tween?.kill();
            el.textContent = value;
        };
    }, [value, parsed, delay, duration]);

    if (!parsed) {
        return <span className={className}>{value}</span>;
    }

    return (
        <span className={className}>
            <span ref={spanRef} aria-hidden="true">
                {value}
            </span>
            <span className="visually-hidden">{value}</span>
        </span>
    );
}
