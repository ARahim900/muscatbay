"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import Link from "next/link";

export type StatVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "water" | "default";

interface StatItem {
    label: string;
    value: string;
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

const variantIconClass: Record<StatVariant, string> = {
    primary: "text-primary",
    secondary: "text-amber-500",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-destructive",
    info: "text-blue-500",
    water: "text-blue-500",
    default: "text-muted-foreground",
};

export function StatsGrid({ stats, className }: StatsGridProps) {
    const gridRef = useScrollAnimation<HTMLDivElement>({
        y: 30,
        duration: 0.5,
        stagger: 0.1,
    });

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
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-300 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 uppercase tracking-wide truncate">
                                    {stat.label}
                                </p>
                                {/* Big value: always neutral — never colored red/green */}
                                <h3 className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight truncate text-slate-800 dark:text-slate-100 leading-none">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/80 flex-shrink-0">
                                <stat.icon
                                    className={cn("w-4 h-4 sm:w-5 sm:h-5", !stat.color && iconClass)}
                                    style={stat.color ? { color: stat.color } : undefined}
                                />
                            </div>
                        </div>

                        {/* Trend indicator — small text below, colored green/red */}
                        {stat.trend && stat.trendValue && (
                            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm">
                                <span className={cn(
                                    "flex items-center font-medium",
                                    isGoodTrend  ? "text-[var(--status-normal)]" :
                                    isBadTrend   ? "text-[var(--status-danger)]" :
                                                   "text-slate-500 dark:text-slate-400"
                                )}>
                                    {stat.trend === 'up'      && <TrendingUp  size={14} className="me-1" />}
                                    {stat.trend === 'down'    && <TrendingDown size={14} className="me-1" />}
                                    {stat.trend === 'neutral' && <Minus        size={14} className="me-1" />}
                                    {stat.trendValue}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 ms-1.5 text-xs">vs last month</span>
                            </div>
                        )}

                        {stat.subtitle && !stat.trendValue && (
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 truncate">{stat.subtitle}</p>
                        )}

                        {stat.status && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                                <span
                                    aria-hidden="true"
                                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stat.status === 'normal' ? 'var(--status-normal)' : stat.status === 'warning' ? 'var(--status-warning)' : stat.status === 'danger' ? 'var(--status-danger)' : stat.status === 'stale' ? 'var(--status-stale)' : 'var(--status-missing)' }}
                                />
                                <span className="text-slate-500 dark:text-slate-400 capitalize font-medium">{stat.status}</span>
                            </div>
                        )}
                        {stat.lastUpdated && (
                            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">Updated {stat.lastUpdated}</p>
                        )}
                    </>
                );

                const baseCardClassName = "bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group/stat overflow-hidden hover:shadow-md transition-[box-shadow] duration-200";

                return stat.href ? (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        aria-label={`${stat.label}: ${stat.value}. ${stat.trend === 'up' ? 'Up' : stat.trend === 'down' ? 'Down' : 'No change'} ${stat.trendValue || ''} compared to last period. Click to view details.`}
                        className={cn(baseCardClassName, "block cursor-pointer")}
                    >
                        {cardContent}
                    </Link>
                ) : (
                    <div key={stat.label} className={baseCardClassName}>
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}
