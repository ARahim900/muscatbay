
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
    return (
        <div className={cn(
            "grid gap-6 w-full",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            className
        )}>
            {stats.map((stat, index) => {
                const variant = stat.variant || "primary";
                const iconColor = variantIconColors[variant];

                return (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all duration-200"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wide">
                                    {stat.label}
                                </p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                                <stat.icon
                                    size={22}
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
                            <p className="text-xs text-slate-400 mt-3">{stat.subtitle}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
