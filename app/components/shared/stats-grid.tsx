
import { Card, CardContent } from "@/components/ui/card";
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
    primary: "text-[#3B82F6]",      // Blue
    secondary: "text-[#F59E0B]",    // Yellow/Amber
    success: "text-[#10B981]",      // Green
    warning: "text-[#F59E0B]",      // Yellow
    danger: "text-[#EF4444]",       // Red
    info: "text-[#3B82F6]",         // Blue
    water: "text-[#3B82F6]",        // Blue
    default: "text-slate-500",
};

export function StatsGrid({ stats, className }: StatsGridProps) {
    return (
        <div className={cn(
            "grid gap-4 sm:gap-5 w-full",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            className
        )}>
            {stats.map((stat, index) => {
                const variant = stat.variant || "primary";
                const iconColor = variantIconColors[variant];

                return (
                    <Card key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 h-full transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-5 flex items-start justify-between gap-3">
                            {/* Left side - Text content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    {stat.label}
                                </p>
                                <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                                    {stat.value}
                                </h3>
                                {/* Trend indicator */}
                                {stat.trend && stat.trendValue && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className={cn(
                                            "inline-flex items-center gap-0.5 text-xs font-medium",
                                            stat.trend === 'up' ? "text-emerald-600" :
                                                stat.trend === 'down' ? "text-red-500" :
                                                    "text-gray-500"
                                        )}>
                                            {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                                            {stat.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                                            {stat.trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
                                            {stat.trendValue}
                                        </span>
                                        <span className="text-[11px] text-gray-400">vs last month</span>
                                    </div>
                                )}
                                {stat.subtitle && !stat.trendValue && (
                                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                                )}
                            </div>

                            {/* Right side - Icon in circle outline */}
                            <div className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                <stat.icon className={cn(
                                    "w-5 h-5",
                                    stat.color || iconColor
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
