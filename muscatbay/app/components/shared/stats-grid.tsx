"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { CountUp } from "@/components/motion/count-up";
import Link from "next/link";

export type StatVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "water" | "default";

export interface StatItem {
    label: string;
    value: string;
    /** Optional unit rendered small + static after the value (e.g. "m³", "OMR",
     *  "MWh") — matches the monthly Kpi tiles and keeps long numbers from
     *  truncating. Prefer this over baking the unit into `value`. */
    unit?: string;
    subtitle?: string;
    icon: LucideIcon;
    variant?: StatVariant;
    color?: string;
    bgColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    href?: string;
    /**
     * Invert the good/bad meaning of the trend direction.
     * Use true for savings metrics (electricity, water) where DOWN = good (green).
     * Default false = standard logic where UP = good (green), DOWN = bad (red).
     */
    invertTrend?: boolean;
    status?: 'normal' | 'warning' | 'danger' | 'stale' | 'missing';
    lastUpdated?: string;
    dataQuality?: 'incomplete' | 'stale' | 'estimated' | 'under-review' | 'anomaly';
}

interface StatsGridProps {
    stats: StatItem[];
    className?: string;
}

const SCROLL_ANIMATION_CONFIG = { y: 30, duration: 0.5, stagger: 0.1 } as const;

const variantIconClass: Record<StatVariant, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-[var(--status-normal)]",
    warning: "text-[var(--status-warning)]",
    danger: "text-[var(--status-danger)]",
    info: "text-[var(--status-info)]",
    water: "text-[var(--module-water)]",
    default: "text-muted-foreground",
};

// Soft tile background behind the icon, per variant — mirrors the water/monthly
// section's Kpi tiles (a chart-bg tint behind a colored icon). The standard
// reference for KPI cards across the app. Overridden by an explicit stat.bgColor.
const variantTileBg: Record<StatVariant, string> = {
    primary: "var(--chart-bg-purple)",
    secondary: "var(--chart-bg-cyan)",
    success: "var(--chart-bg-green)",
    warning: "var(--chart-bg-orange)",
    danger: "var(--chart-bg-red)",
    info: "var(--chart-bg-blue)",
    water: "var(--chart-bg-blue)",
    default: "var(--muted)",
};

export function StatsGrid({ stats, className }: StatsGridProps) {
    const gridRef = useScrollAnimation<HTMLDivElement>(SCROLL_ANIMATION_CONFIG);

    const count = stats.length;
    const gridCols =
        count === 3 ? "grid-cols-2 sm:grid-cols-3" :
        count <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" :
        count <= 6 ? "grid-cols-2 sm:grid-cols-3" :
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

    return (
        <div ref={gridRef} className={cn(
            "grid gap-3 sm:gap-4 w-full",
            gridCols,
            className
        )}>
            {stats.map((stat, index) => {
                const variant = stat.variant || "primary";
                const iconClass = variantIconClass[variant];
                const tileBg = stat.bgColor ?? variantTileBg[variant];

                // Resolve whether the current trend direction is "good" or "bad".
                // invertTrend=true  → down is good (savings: energy, water, cost)
                // invertTrend=false → up is good  (output: STP treated water, income)
                const isGoodTrend = stat.trend === 'neutral' ? false :
                    stat.invertTrend
                        ? stat.trend === 'down'
                        : stat.trend === 'up';

                const isBadTrend = stat.trend === 'neutral' ? false :
                    stat.invertTrend
                        ? stat.trend === 'up'
                        : stat.trend === 'down';

                const cardContent = (
                    <>
                        {/* Icon tile on the left + label/value to its right — mirrors the
                            water/monthly Kpi tiles (the app-wide reference). */}
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px] transition-transform duration-300 ease-(--ease-out-quint) motion-safe:group-hover/stat:scale-110"
                                style={{ background: tileBg }}
                            >
                                <stat.icon
                                    className={cn("w-5 h-5", !stat.color && iconClass)}
                                    style={stat.color ? { color: stat.color } : undefined}
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[11px] font-semibold mb-0.5 uppercase tracking-[0.06em] leading-tight truncate">
                                    {stat.label}
                                </p>
                                <h3 className="text-xl font-semibold tabular-nums truncate text-foreground leading-tight tracking-tight">
                                    <CountUp value={stat.value} delay={index * 0.06} />
                                    {stat.unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{stat.unit}</span>}
                                </h3>
                            </div>
                        </div>

                        {/* Trend indicator — small text below, colored green/red */}
                        {stat.trend && stat.trendValue && (
                            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm">
                                <span className={cn(
                                    "flex items-center font-medium",
                                    isGoodTrend  ? "text-[var(--status-normal)]" :
                                    isBadTrend   ? "text-[var(--status-danger)]" :
                                                   "text-muted-foreground"
                                )}>
                                    {stat.trend === 'up'      && <TrendingUp  size={14} className="me-1" />}
                                    {stat.trend === 'down'    && <TrendingDown size={14} className="me-1" />}
                                    {stat.trend === 'neutral' && <Minus        size={14} className="me-1" />}
                                    {stat.trendValue}
                                </span>
                                <span className="text-muted-foreground ms-1.5 text-xs">vs last month</span>
                            </div>
                        )}

                        {stat.subtitle && !stat.trendValue && (
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 truncate">{stat.subtitle}</p>
                        )}

                        {stat.status && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                                <span
                                    aria-hidden="true"
                                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stat.status === 'normal' ? 'var(--status-normal)' : stat.status === 'warning' ? 'var(--status-warning)' : stat.status === 'danger' ? 'var(--status-danger)' : stat.status === 'stale' ? 'var(--status-stale)' : 'var(--status-missing)' }}
                                />
                                <span className="text-muted-foreground capitalize font-medium">{stat.status}</span>
                            </div>
                        )}
                        {stat.lastUpdated && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70 tabular-nums">Updated {stat.lastUpdated}</p>
                        )}
                    </>
                );

                const baseCardClassName = "mb-glow bg-card p-4 rounded-lg border border-border shadow-[0_1px_2px_rgb(15_23_42_/_0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] group/stat overflow-hidden hover:shadow-[0_6px_18px_-10px_rgb(15_23_42_/_0.35)] hover:border-secondary/40 transition-[box-shadow,border-color,transform] duration-200 ease-(--ease-out-quint) motion-safe:active:scale-[0.99]";

                return stat.href ? (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        data-glow
                        aria-label={`${stat.label}: ${stat.value}. ${stat.trend === 'up' ? 'Up' : stat.trend === 'down' ? 'Down' : 'No change'} ${stat.trendValue || ''} compared to last period. Click to view details.`}
                        className={cn(baseCardClassName, "block cursor-pointer")}
                    >
                        {cardContent}
                    </Link>
                ) : (
                    <div key={stat.label} data-glow className={baseCardClassName}>
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}
