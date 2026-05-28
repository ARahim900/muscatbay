"use client";

// ─── Loading skeleton for the electricity page — extracted verbatim from
//     app/electricity/page.tsx. Pure relocation; no behavior changes.

import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";

export function ElectricityLoadingSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-8 w-36 rounded-full" />
            </div>
            {/* Tabs skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-36 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            {/* Date filter skeleton */}
            <div className="p-6 rounded-xl border border-border/60 bg-white dark:bg-muted/50">
                <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            {/* Stats skeleton */}
            <StatsGridSkeleton />
            {/* Charts skeleton */}
            <div className="grid gap-6 lg:grid-cols-5">
                <ChartSkeleton height="h-[350px] lg:col-span-3" />
                <ChartSkeleton height="h-[350px] lg:col-span-2" />
            </div>
        </div>
    );
}
