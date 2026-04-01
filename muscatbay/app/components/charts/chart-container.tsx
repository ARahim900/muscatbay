"use client";

import { ReactNode, useRef, useEffect } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
    children: ReactNode;
    height?: string | number;
    className?: string;
    minHeight?: number;
}

/**
 * A wrapper component that ensures ResponsiveContainer gets proper dimensions
 * using debounce and explicit min-height styling.
 * Includes a subtle CSS scroll-triggered fade-in animation.
 */
export function ChartContainer({
    children,
    height = "100%",
    className = "",
    minHeight = 200,
}: ChartContainerProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

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

                    observer.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -15% 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`w-full ${className}`}
            style={{
                height,
                minHeight,
                position: 'relative',
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
                debounce={100}
            >
                {children}
            </ResponsiveContainer>
        </div>
    );
}
