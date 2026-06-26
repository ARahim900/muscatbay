"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, CalendarDays } from "lucide-react";

// Water data
import { WATER_METERS as MOCK_WATER_METERS, type WaterMeter } from "@/lib/water-data";

// Supabase
import { getWaterMetersFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

// Shared layout / shell
import { PageHeader } from "@/components/shared/page-header";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";

// Monthly dashboard (Supabase-wired) + Daily report (lazy)
import { WaterMonthlyDashboard } from "@/components/water/monthly/water-monthly-dashboard";
import dynamic from "next/dynamic";
const DailyWaterReport = dynamic(
    () => import("@/components/water/DailyWaterReport").then((m) => ({ default: m.DailyWaterReport })),
    { loading: () => <Skeleton className="h-96 w-full rounded-xl" />, ssr: false },
);

type DashboardView = "monthly" | "daily";

export default function WaterPage() {
    const [dashboardView, setDashboardView] = useState<DashboardView>("monthly");

    // Supabase data state
    const [waterMeters, setWaterMeters] = useState<WaterMeter[]>(MOCK_WATER_METERS);
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<"supabase" | "mock">("mock");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Stable fetch function — used both on mount and by the real-time handler
    const fetchWaterData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            if (isSupabaseConfigured()) {
                const supabaseData = await getWaterMetersFromSupabase();
                if (supabaseData.length > 0) {
                    setWaterMeters(supabaseData);
                    setDataSource("supabase");
                    setLastUpdated(new Date());
                } else if (!silent) {
                    setWaterMeters(MOCK_WATER_METERS);
                    setDataSource("mock");
                }
            } else if (!silent) {
                setWaterMeters(MOCK_WATER_METERS);
                setDataSource("mock");
            }
        } catch (error) {
            if (!silent) {
                console.error("Error fetching water data:", error);
                setWaterMeters(MOCK_WATER_METERS);
                setDataSource("mock");
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // ── Supabase real-time subscription for the Water System table ─────────
    const { isLive } = useSupabaseRealtime({
        table: "Water System",
        channelName: "water-system-rt",
        onChanged: () => fetchWaterData(true),
        enabled: dataSource === "supabase",
    });

    // Fetch on mount + restore the saved view
    useEffect(() => {
        fetchWaterData();
        const savedPrefs = loadFilterPreferences<{ dashboardView?: DashboardView }>("water");
        if (savedPrefs?.dashboardView) setDashboardView(savedPrefs.dashboardView);
    }, [fetchWaterData]);

    // Persist the selected view
    useEffect(() => {
        saveFilterPreferences("water", { dashboardView });
    }, [dashboardView]);

    if (isLoading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200" role="status" aria-busy="true" aria-label="Loading water system data">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-8 w-32 rounded-full" />
                </div>
                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
                {/* Stats + chart skeleton */}
                <StatsGridSkeleton />
                <StatsGridSkeleton />
                <ChartSkeleton height="h-[350px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Water System Analysis"
                    description="Comprehensive water consumption and loss analysis across the network"
                />
                <PageStatusBar
                    isConnected={dataSource === "supabase"}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                />
            </div>

            {/* View switching tabs */}
            <TabNavigation
                activeTab={dashboardView}
                onTabChange={(key) => setDashboardView(key as DashboardView)}
                variant="secondary"
                tabs={[
                    { key: "monthly", label: "Monthly", icon: BarChart3 },
                    { key: "daily", label: "Daily", icon: CalendarDays },
                ]}
            />

            {/* Monthly Dashboard View */}
            {dashboardView === "monthly" && (
                <div id="panel-monthly" role="tabpanel" aria-labelledby="tab-monthly" tabIndex={0} className="motion-safe:animate-in motion-safe:fade-in duration-200">
                    <WaterMonthlyDashboard waterMeters={waterMeters} />
                </div>
            )}

            {/* Daily Dashboard View */}
            {dashboardView === "daily" && (
                <div id="panel-daily" role="tabpanel" aria-labelledby="tab-daily" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    <DailyWaterReport />
                </div>
            )}
        </div>
    );
}
