"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
    });

    return (
        <div ref={gridRef} className={cn(
            "grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full",
            "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            className
        )}>
            {stats.map((stat, index) => {
                const variant = stat.variant || "primary";
                const iconColor = variantIconColors[variant];

                return (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out group/stat overflow-hidden relative"
                    >
                        {/* Animated top border line */}
                        <div
                            className="absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"
                            style={{ backgroundColor: stat.color || iconColor }}
                        />
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 uppercase tracking-wide truncate">
                                    {stat.label}
                                </p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight truncate">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-slate-800/80 group-hover/stat:scale-110 group-hover/stat:-rotate-3 group-hover/stat:shadow-sm transition-all duration-300 ease-out flex-shrink-0">
                                <stat.icon
                                    className="w-4 h-4 sm:w-5 sm:h-5 group-hover/stat:animate-pulse-glow"
                                    style={{ color: stat.color || iconColor }}
                                />
                            </div>
                        </div>
                        {/* Trend indicator */}
                        {stat.trend && stat.trendValue && (
                            <div className="mt-4 flex items-center text-sm">
                                <span className={cn(
                                    "flex items-center font-medium",
                                    stat.trend === 'up' ? "text-emerald-600" :
                                        stat.trend === 'down' ? "text-rose-600" :
                                            "text-slate-500"
                                )}>
                                    {stat.trend === 'up' && <TrendingUp size={16} className="mr-1" />}
                                    {stat.trend === 'down' && <TrendingDown size={16} className="mr-1" />}
                                    {stat.trend === 'neutral' && <Minus size={16} className="mr-1" />}
                                    {stat.trendValue}
                                </span>
                                <span className="text-slate-400 ml-2">vs last month</span>
                            </div>
                        )}
                        {stat.subtitle && !stat.trendValue && (
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 md:mt-3 truncate">{stat.subtitle}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
