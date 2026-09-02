"use client";

/**
 * Hierarchy stat card — the KPI tile the Water daily report established, now
 * shared so STP and Electricity present their headline figures identically.
 *
 * The card reads top-down: a 3px accent rail naming the domain, an uppercase
 * label, the figure in tabular numerals, and a tinted icon chip on the right.
 * It is deliberately quieter than the `StatsGrid` tile it replaces on those two
 * routes — no trend arrow, no status word, no data-quality chip — because the
 * modules that use it carry that detail in the inspection ticker and the
 * process-health table directly beneath, where it has room to be explained.
 * Use `StatsGrid` where the trend and status ARE the message.
 *
 * `HierarchyStatGrid` accepts the same `StatItem[]` that `StatsGrid` does, so a
 * route swaps one component for the other without reshaping its data.
 */

import type { LucideIcon } from "lucide-react";

import type { StatItem, StatVariant } from "@/components/shared/stats-grid";
import { cn } from "@/lib/utils";

/** Accent rail colour per variant, resolved from the app's own tokens. */
const VARIANT_ACCENT: Record<StatVariant, string> = {
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    success: "var(--status-normal)",
    warning: "var(--status-warning)",
    danger: "var(--status-danger)",
    info: "var(--status-info)",
    water: "var(--module-water)",
    default: "var(--muted-foreground)",
};

export function HierarchyStatCard({
    label,
    value,
    unit,
    icon: Icon,
    color,
    valueColor,
    accessibleValue,
    subtitle,
}: {
    label: string;
    value: string;
    unit?: string;
    icon: LucideIcon;
    /** Accent rail + icon-chip hue. Any CSS colour; pass a token, not a hex. */
    color: string;
    valueColor?: string;
    /** Full, unabridged figure for assistive tech when `value` is abbreviated. */
    accessibleValue?: string;
    subtitle?: string;
}) {
    return (
        <div className="group/stat relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card-standard transition-[box-shadow,transform] duration-200 ease-out hover:shadow-md motion-safe:hover:-translate-y-0.5 sm:p-5">
            <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                        {label}
                    </p>
                    <h3
                        className="text-lg font-semibold tracking-tight tabular-nums text-foreground sm:text-xl md:text-2xl"
                        style={valueColor ? { color: valueColor } : undefined}
                    >
                        {/* When `value` is abbreviated (47.2k), the unabridged
                            figure is announced instead of the shorthand. */}
                        {accessibleValue && accessibleValue !== value ? (
                            <>
                                <span aria-hidden="true">{value}</span>
                                <span className="sr-only">{accessibleValue}</span>
                            </>
                        ) : (
                            value
                        )}
                        {unit && (
                            <span className="ml-1 text-xs font-medium text-muted-foreground sm:text-sm">
                                {unit}
                            </span>
                        )}
                    </h3>
                    {subtitle && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div
                    className="flex-shrink-0 rounded-lg p-2 transition-transform duration-200 ease-out motion-safe:group-hover/stat:-rotate-3 motion-safe:group-hover/stat:scale-110 sm:p-3"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

/**
 * Drop-in replacement for `StatsGrid` on routes that want the Water tile.
 *
 * The column counts mirror StatsGrid's so swapping one for the other does not
 * reflow the page: two columns on a phone, widening to the stat count.
 */
export function HierarchyStatGrid({
    stats,
    className,
}: {
    stats: StatItem[];
    className?: string;
}) {
    const count = stats.length;
    const cols =
        count === 3 ? "grid-cols-2 sm:grid-cols-3" :
        count <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" :
        count === 5 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" :
        count === 6 ? "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6" :
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

    return (
        <div className={cn("grid gap-3.5", cols, className)}>
            {stats.map((stat) => (
                <HierarchyStatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    unit={stat.unit}
                    icon={stat.icon}
                    color={stat.color ?? VARIANT_ACCENT[stat.variant ?? "default"]}
                    accessibleValue={stat.accessibleValue}
                    subtitle={stat.subtitle}
                />
            ))}
        </div>
    );
}
