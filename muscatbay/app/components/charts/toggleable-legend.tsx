"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";

/**
 * Tracks which series of a chart are currently hidden by the user.
 * Caps hidden count at total - 1 so at least one series always renders
 * (avoids an empty chart frame).
 */
export function useChartLegendToggle() {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);

    const toggle = useCallback((key: string, totalSeries: number) => {
        setHidden(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else if (next.size < totalSeries - 1) {
                next.add(key);
            }
            return next;
        });
    }, []);

    return { isHidden, toggle };
}

interface ToggleableLegendContentProps {
    payload?: ReadonlyArray<LegendPayload>;
    isHidden: (key: string) => boolean;
    onToggle: (key: string, totalSeries: number) => void;
}

/**
 * Drop-in renderer for Recharts' `<Legend content={...} />` slot.
 * Each legend item becomes a real button — keyboard-accessible, with
 * aria-pressed reflecting visibility.
 */
export function ToggleableLegendContent({
    payload = [],
    isHidden,
    onToggle,
}: ToggleableLegendContentProps) {
    return (
        <ul className="flex flex-wrap items-center justify-center gap-2 pt-2 px-2 m-0 list-none">
            {payload.map(({ value, color, dataKey }) => {
                const key = String(dataKey ?? value ?? "");
                if (!key) return null;
                const dimmed = isHidden(key);
                const label = value ?? key;
                return (
                    <li key={key}>
                        <button
                            type="button"
                            onClick={(e) => {
                                // Some charts are wrapped in <Link> for whole-card navigation;
                                // stop propagation so legend clicks don't trigger the parent.
                                e.preventDefault();
                                e.stopPropagation();
                                onToggle(key, payload.length);
                            }}
                            aria-pressed={!dimmed}
                            aria-label={`${dimmed ? "Show" : "Hide"} ${label}`}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                                "text-foreground/80 hover:bg-muted",
                                "transition-colors duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50",
                                dimmed && "opacity-40"
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeof color === "string" ? color : undefined }}
                            />
                            <span>{label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
