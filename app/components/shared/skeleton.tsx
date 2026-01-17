import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

// Base skeleton component with pulse animation
export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/50",
                className
            )}
            style={style}
        />
    );
}

// Skeleton for individual stat cards
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800/50", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
        </div>
    );
}

// Skeleton for StatsGrid (4 cards in a row)
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// Skeleton for data tables
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-lg border border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/50">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-3 flex gap-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={colIndex}
                                className={cn(
                                    "h-4 flex-1",
                                    colIndex === 0 && "max-w-[200px]"
                                )}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Skeleton for charts
export function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
    return (
        <div className={cn("rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6", height)}>
            <div className="flex flex-col h-full">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-3 w-32 mb-6" />
                <div className="flex-1 flex items-end gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1"
                            style={{ height: `${30 + Math.random() * 60}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Full page loading skeleton
export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-8 w-32 rounded-full" />
            </div>

            {/* Tab navigation skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-lg" />
                ))}
            </div>

            {/* Stats grid skeleton */}
            <StatsGridSkeleton />

            {/* Chart skeleton */}
            <ChartSkeleton />
        </div>
    );
}
