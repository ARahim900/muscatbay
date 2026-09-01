"use client";

// ─── Loading skeleton for the electricity page — extracted verbatim from
//     app/electricity/page.tsx. Pure relocation; no behavior changes.

import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";

export function ElectricityLoadingSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Electricity Monitoring"
                    description="Track power consumption and costs across all meters"
                />
                <Skeleton className="h-8 w-36 rounded-full" />
            </div>
            {/* Tabs skeleton — exactly two pills, matching the page's two tabs
                ("Load Watch" + "Meters & Data"). A third pill here caused a
                visible layout shift the moment the real tabs rendered. */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
            {/* Date filter skeleton */}
            <div className="p-6 rounded-xl border border-border/60 bg-card/50">
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
