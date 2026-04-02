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
}

interface StatsGridProps {
    stats: StatItem[];
    className?: string;
}

// Map variants to icon colors
const variantIconColors: Record<StatVariant, string> = {
    primary: "#4E4456",      // Brand Primary
    secondary: "#F59E0B",    // Yellow/Amber
    success: "#10B981",      // Green
    warning: "#F59E0B",      // Yellow
    danger: "#EF4444",       // Red
    info: "#3B82F6",         // Blue
    water: "#3B82F6",        // Blue
    default: "#64748b",
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
                const iconColor = variantIconColors[variant];

                const isNegativeTrend = stat.trend === 'down';

                const cardContent = (
                    <>
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 uppercase tracking-wide truncate">
                                    {stat.label}
                                </p>
                                <h3 className={cn(
                                    "text-base sm:text-lg md:text-xl font-bold tabular-nums tracking-tight truncate",
                                    isNegativeTrend ? "text-red-500" : "text-slate-800 dark:text-slate-100"
                                )}>
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/80 flex-shrink-0">
                                <stat.icon
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    style={{ color: stat.color || iconColor }}
                                />
                            </div>
                        </div>
                        {/* Trend indicator */}
                        {stat.trend && stat.trendValue && (
                            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm">
                                <span className={cn(
                                    "flex items-center font-medium",
                                    stat.trend === 'up' ? "text-emerald-600" :
                                        stat.trend === 'down' ? "text-rose-600" :
                                            "text-slate-500"
                                )}>
                                    {stat.trend === 'up' && <TrendingUp size={14} className="me-1" />}
                                    {stat.trend === 'down' && <TrendingDown size={14} className="me-1" />}
                                    {stat.trend === 'neutral' && <Minus size={14} className="me-1" />}
                                    {stat.trendValue}
                                </span>
                                <span className="text-slate-400 ms-1.5 text-xs">vs last month</span>
                            </div>
                        )}
                        {stat.subtitle && !stat.trendValue && (
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 truncate">{stat.subtitle}</p>
                        )}
                    </>
                );

                const baseCardClassName = "bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group/stat overflow-hidden";

                return stat.href ? (
                    <Link
                        key={index}
                        href={stat.href}
                        className={cn(baseCardClassName, "block cursor-pointer hover:shadow-md transition-shadow duration-200")}
                    >
                        {cardContent}
                    </Link>
                ) : (
                    <div key={index} className={baseCardClassName}>
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}
