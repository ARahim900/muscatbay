"use client";

import { AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { ReactElement, ReactNode, useRef, useEffect, useState } from "react";
import { ResponsiveContainer as RechartsResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
    children: ReactElement;
    height?: string | number;
    className?: string;
    minHeight?: number;
    ariaLabel?: string;
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
    ariaLabel,
}: ChartContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const measure = () => {
            const rect = element.getBoundingClientRect();
            setDimensions((current) => {
                const width = Math.round(rect.width);
                const nextHeight = Math.round(rect.height);
                return current.width === width && current.height === nextHeight
                    ? current
                    : { width, height: nextHeight };
            });
        };

        measure();
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure);
            return () => window.removeEventListener("resize", measure);
        }
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const prefersReducedMotion = typeof window.matchMedia === "function"
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
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
            className={cn("w-full", className)}
            style={inlineStyle}
            role={ariaLabel ? "img" : undefined}
            aria-label={ariaLabel}
        >
            {dimensions.width > 0 && dimensions.height > 0 && (
                <RechartsResponsiveContainer
                    width="100%"
                    height="100%"
                    debounce={50}
                >
                    {children}
                </RechartsResponsiveContainer>
            )}
        </div>
    );
}

interface SafeResponsiveContainerProps {
    children: ReactElement;
    height?: string | number;
    minHeight?: number;
    width?: string | number;
    minWidth?: number;
    debounce?: number;
    initialDimension?: { width: number; height: number };
}

/**
 * Recharts-compatible adapter for existing plots. It intentionally ignores
 * fake initial dimensions and mounts only after the real box is measurable.
 */
export function SafeResponsiveContainer({
    children,
    height = "100%",
    minHeight,
}: SafeResponsiveContainerProps) {
    const resolvedMinHeight = minHeight && minHeight > 0
        ? minHeight
        : typeof height === "number" ? height : 200;
    return (
        <ChartContainer height={height} minHeight={resolvedMinHeight}>
            {children}
        </ChartContainer>
    );
}

export type ChartState = "ready" | "loading" | "empty" | "error";

interface ChartShellProps {
    title: string;
    description?: string;
    controls?: ReactNode;
    state?: ChartState;
    errorMessage?: string;
    emptyMessage?: string;
    interpretation?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Shared chart framing and fallback language for every operational module.
 * The plot itself stays with the feature, while title, controls and management
 * interpretation remain consistent.
 */
export function ChartShell({
    title,
    description,
    controls,
    state = "ready",
    errorMessage = "The chart could not be loaded.",
    emptyMessage = "No data is available for this period.",
    interpretation,
    children,
    className,
}: ChartShellProps) {
    return (
        <section className={cn("overflow-hidden rounded-[10.5px] border border-border bg-card shadow-card-standard", className)} aria-labelledby={`chart-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}>
            <header className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div className="min-w-0">
                    <h3 id={`chart-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
                    {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>}
                </div>
                {controls && <div className="shrink-0">{controls}</div>}
            </header>
            <div className="p-4 sm:p-5">
                {state === "loading" && (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                        <Loader2 className="h-6 w-6 text-primary motion-safe:animate-spin" aria-hidden="true" />
                        <p className="text-sm font-medium text-muted-foreground">Loading chart…</p>
                    </div>
                )}
                {state === "empty" && (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center" role="status">
                        <BarChart3 className="h-7 w-7 text-muted-foreground/70" aria-hidden="true" />
                        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                    </div>
                )}
                {state === "error" && (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center" role="alert">
                        <AlertTriangle className="h-7 w-7 text-[var(--mb-danger-text)]" aria-hidden="true" />
                        <p className="text-sm font-medium text-[var(--mb-danger-text)]">{errorMessage}</p>
                    </div>
                )}
                {state === "ready" && children}
                {interpretation && state === "ready" && (
                    <p className="mt-3 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Management note:</span> {interpretation}
                    </p>
                )}
            </div>
        </section>
    );
}
