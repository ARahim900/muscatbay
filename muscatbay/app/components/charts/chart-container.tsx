"use client";

import { ReactNode, useRef } from "react";
import { ResponsiveContainer } from "recharts";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ChartContainerProps {
    children: ReactNode;
    height?: string | number;
    className?: string;
    minHeight?: number;
}

/**
 * A wrapper component that ensures ResponsiveContainer gets proper dimensions
 * using debounce and explicit min-height styling.
 * Includes a subtle GSAP scroll-triggered fade-in animation.
 */
export function ChartContainer({
    children,
    height = "100%",
    className = "",
    minHeight = 200,
}: ChartContainerProps) {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const el = ref.current;
            if (!el) return;

            gsap.from(el, {
                y: 30,
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    once: true,
                },
            });
        },
        { scope: ref, dependencies: [] }
    );

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
