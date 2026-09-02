"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
    children: ReactNode;
    height?: string | number;
    className?: string;
    minHeight?: number;
}

/**
 * A wrapper component that ensures ResponsiveContainer gets proper dimensions.
 * Defers chart mount by one frame so CSS layout is applied before Recharts
 * measures the container — prevents the "width(-1) height(-1)" warning.
 * Includes a subtle CSS scroll-triggered fade-in animation.
 */
export function ChartContainer({
    children,
    height = "100%",
    className = "",
    minHeight = 200,
}: ChartContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [layoutReady, setLayoutReady] = useState(false);

    useEffect(() => {
        // Defer ResponsiveContainer render until CSS layout is applied
        const id = requestAnimationFrame(() => setLayoutReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            el.style.opacity = "1";
            el.style.transform = "none";
            return;
        }

        el.style.willChange = 'opacity, transform';
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const htmlEl = entry.target as HTMLElement;
                    htmlEl.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
                    htmlEl.style.opacity = "1";
                    htmlEl.style.transform = "translateY(0)";
                    setTimeout(() => { htmlEl.style.willChange = 'auto'; }, 500);

                    observer.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -15% 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // When a className provides height (e.g. h-[200px]), avoid setting
    // height in inline style — the inline value wins over the class and
    // "100%" of a parent without explicit height resolves to 0.
    const hasClassHeight = /\bh-\[/.test(className);
    const inlineStyle: React.CSSProperties = {
        minHeight,
        position: 'relative',
    };
    if (!hasClassHeight) {
        inlineStyle.height = height;
    }

    return (
        <div
            ref={ref}
            className={`w-full ${className}`}
            style={inlineStyle}
        >
            {layoutReady && (
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    debounce={50}
                >
                    {children}
                </ResponsiveContainer>
            )}
        </div>
    );
}
