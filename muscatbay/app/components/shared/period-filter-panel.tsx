"use client";

import { CalendarRange, ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

interface PeriodFilterPanelProps {
    periodLabel: string;
    metaLabel?: string;
    children: React.ReactNode;
}

/**
 * Keeps the selected period visible while collapsing detailed filter controls
 * on phones. Desktop users see the controls immediately.
 */
export function PeriodFilterPanel({ periodLabel, metaLabel, children }: PeriodFilterPanelProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 768px)");
        const syncDesktopState = () => {
            if (detailsRef.current) detailsRef.current.open = desktop.matches;
        };
        syncDesktopState();
        desktop.addEventListener("change", syncDesktopState);
        return () => desktop.removeEventListener("change", syncDesktopState);
    }, []);

    return (
        <details ref={detailsRef} className="group rounded-xl border border-border/70 bg-card shadow-sm">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3 py-2.5 marker:content-none md:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--chart-bg-purple)] text-primary">
                    <CalendarRange className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Selected period</span>
                    <span className="block truncate text-sm font-semibold text-foreground">{periodLabel}</span>
                </span>
                {metaLabel && <span className="text-xs text-muted-foreground">{metaLabel}</span>}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Change
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </span>
            </summary>
            <div className="hidden border-t border-border/70 p-4 group-open:block sm:p-5 md:block md:border-t-0 md:p-6">
                {children}
            </div>
        </details>
    );
}
