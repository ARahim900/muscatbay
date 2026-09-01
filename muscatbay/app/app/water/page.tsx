"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { BarChart3, CalendarDays, DatabaseZap, RefreshCw, AlertTriangle, Satellite } from "lucide-react";

// Water data
import type { WaterMeter } from "@/lib/water-data";

// Supabase — the result-returning fetch, so a failure is reported rather than
// silently swallowed (it also hands back the negative-reading register).
import { fetchWaterMeters, type NegativeReading, type DerivedMonth } from "@/functions/api/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

// Shared layout / shell
import { PageHeader } from "@/components/shared/page-header";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";

// All three dashboard views are loaded on demand (Supabase-wired).
//
// Every one of them carries Recharts (or, for Satellite, maplibre), and none
// can render before the water fetch resolves — the page shows the skeleton
// below until then. Loading them lazily lets those chunks download alongside
// the data instead of sitting in the route's first-load JS, and each fallback
// is sized to the real view so hydration doesn't shift the page.
import { getPageCache, setPageCache } from "@/lib/page-cache";
import dynamic from "next/dynamic";
const WaterMonthlyDashboard = dynamic(
    () => import("@/components/water/monthly/water-monthly-dashboard").then((m) => ({ default: m.WaterMonthlyDashboard })),
    {
        loading: () => (
            <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading monthly water analysis">
                {/* section tabs · period filter card · KPI row · first panel */}
                <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
                <Skeleton className="h-[124px] w-full rounded-[10.5px]" />
                <StatsGridSkeleton count={6} />
                <ChartSkeleton height="h-[400px]" />
            </div>
        ),
        ssr: false,
    },
);
const DailyWaterReport = dynamic(
    () => import("@/components/water/daily-water-report").then((m) => ({ default: m.DailyWaterReport })),
    { loading: () => <Skeleton className="h-96 w-full rounded-xl" />, ssr: false },
);
// Satellite View hosts a maplibre engine — browser-only by nature.
const SatelliteView = dynamic(
    () => import("@/components/water/satellite/satellite-view").then((m) => ({ default: m.SatelliteView })),
    { loading: () => <Skeleton className="h-[75vh] w-full rounded-xl" />, ssr: false },
);

type DashboardView = "monthly" | "daily" | "satellite";

// Base tables behind the monthly dashboard — module-level so the array
// reference stays stable across renders (the realtime hook re-subscribes
// when the reference changes).
const WATER_REALTIME_TABLES = ["water_meters", "water_monthly_consumption", "water_daily_consumption"];
const MONTH_NUMBER: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// Session cache — revisiting /water renders the last data instantly and
// refreshes silently in the background instead of re-showing the skeleton.
const WATER_CACHE_KEY = "water:page";
interface WaterPageCache {
    meters: WaterMeter[];
    lastUpdated: Date;
    /** Months whose figures are month-to-date daily sums (may be absent in old caches). */
    derivedMonths?: DerivedMonth[];
}

/**
 * Honest failure state.
 *
 * This page used to fall back to `MOCK_WATER_METERS` whenever the fetch failed
 * or returned nothing, and render it as an ordinary dashboard — a manager could
 * read fabricated supply/loss figures with no indication they weren't real.
 * Nothing is ever substituted for live data now: we say what went wrong and
 * offer a retry.
 */
function WaterErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-[10.5px] border border-mb-danger bg-mb-danger-light px-4 py-14 text-center"
        >
            <AlertTriangle className="h-9 w-9 text-mb-danger-text" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Water data could not be loaded</h2>
            <p className="max-w-md text-sm text-mb-danger-text">{message}</p>
            <p className="max-w-md text-xs text-muted-foreground">
                No figures are shown for this period — nothing is estimated or substituted. Retry once the
                connection is restored.
            </p>
            <Button onClick={onRetry} variant="outline" className="mt-1 gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
            </Button>
        </div>
    );
}

/** Benign "connected, but there is nothing to show yet" state. */
function WaterEmptyState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[10.5px] border border-border bg-card px-4 py-14 text-center">
            <DatabaseZap className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">No water meters found</h2>
            <p className="max-w-md text-sm text-muted-foreground">
                The database is reachable but returned no meters. Once meters and monthly readings are
                loaded they will appear here.
            </p>
            <Button onClick={onRetry} variant="outline" className="mt-1 gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Check again
            </Button>
        </div>
    );
}

export default function WaterPage() {
    const [dashboardView, setDashboardView] = useState<DashboardView>("monthly");

    // Supabase data state — seeded from the session cache when available
    const [cached] = useState(() => getPageCache<WaterPageCache>(WATER_CACHE_KEY));
    const [waterMeters, setWaterMeters] = useState<WaterMeter[]>(cached?.meters ?? []);
    const [isLoading, setIsLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);
    const [negatives, setNegatives] = useState<NegativeReading[]>([]);
    const [derivedMonths, setDerivedMonths] = useState<DerivedMonth[]>(cached?.derivedMonths ?? []);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);

    // Stable fetch function — used both on mount and by the real-time handler
    const fetchWaterData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        const result = await fetchWaterMeters();
        if (silent && result.error) {
            // A background refresh failed: keep showing the data already on
            // screen (it is real, just not fresh) rather than blanking the page.
            return;
        }
        setError(result.error);
        setNegatives(result.negatives);
        if (!result.error) {
            setWaterMeters(result.meters);
            setDerivedMonths(result.derivedMonths);
            const now = new Date();
            setLastUpdated(now);
            if (result.meters.length > 0) {
                setPageCache<WaterPageCache>(WATER_CACHE_KEY, {
                    meters: result.meters,
                    lastUpdated: now,
                    derivedMonths: result.derivedMonths,
                });
            }
        }
        if (!silent) setIsLoading(false);
    }, []);

    const retry = useCallback(() => {
        fetchWaterData(false);
    }, [fetchWaterData]);

    // ── Supabase real-time subscription for the water tables ───────────────
    // Subscribe to the base tables the app reads ("Water System" is a view —
    // views never emit postgres_changes events), so new monthly readings
    // appear without a manual refresh.
    const { isLive } = useSupabaseRealtime({
        table: WATER_REALTIME_TABLES,
        channelName: "water-system-rt",
        onChanged: () => fetchWaterData(true),
        enabled: !error && waterMeters.length > 0,
    });

    // Fetch on mount + restore the saved view. When the session cache seeded
    // the state, fetch silently — the page is already rendering last data and
    // this call only freshens it in place (stale-while-revalidate).
    // Mount-only: `fetchWaterData` is a stable useCallback and `cached` is read
    // once from the session cache, so re-running this would only refetch.
    useEffect(() => {
        fetchWaterData(Boolean(cached));
        const savedPrefs = loadFilterPreferences<{ dashboardView?: DashboardView }>("water");
        // localStorage is client-only, so restoring the saved view must happen after
        // hydration; a lazy useState initialiser would render a different value on the
        // server than on the client.
        if (savedPrefs?.dashboardView) setDashboardView(savedPrefs.dashboardView);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; deps are stable by construction
    }, []);

    // Persist the selected view
    useEffect(() => {
        saveFilterPreferences("water", { dashboardView });
    }, [dashboardView]);

    const latestDataDate = useMemo(() => {
        let latest: Date | null = null;
        for (const meter of waterMeters) {
            for (const [period, value] of Object.entries(meter.consumption)) {
                if (typeof value !== "number") continue;
                const match = /^([A-Z][a-z]{2})-(\d{2})$/.exec(period);
                if (!match || MONTH_NUMBER[match[1]] === undefined) continue;
                const date = new Date(2000 + Number(match[2]), MONTH_NUMBER[match[1]] + 1, 0);
                if (!latest || date > latest) latest = date;
            }
        }
        return latest;
    }, [waterMeters]);

    if (isLoading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200" role="status" aria-busy="true" aria-label="Loading water system data">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <PageHeader
                        title="Water System Analysis"
                        description="Comprehensive water consumption and loss analysis across the network"
                    />
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

    const hasData = waterMeters.length > 0;
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Water System Analysis"
                    description="Comprehensive water consumption and loss analysis across the network"
                />
                <PageStatusBar
                    isConnected={!error && hasData}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    latestDataDate={latestDataDate}
                    staleAfterDays={45}
                    loading={isLoading}
                    error={error}
                    disconnectedLabel="No live data"
                >
                    {negatives.length > 0 && (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-mb-warning-light px-2.5 py-1 text-[11px] font-semibold text-mb-warning-text"
                            title={negatives
                                .slice(0, 10)
                                .map((r) => `${r.label} (${r.account}) ${r.month}: ${r.value} m³`)
                                .join("\n")}
                        >
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {negatives.length} negative reading{negatives.length === 1 ? "" : "s"}
                        </span>
                    )}
                </PageStatusBar>
            </div>

            {error && <WaterErrorState message={error} onRetry={retry} />}
            {!error && !hasData && <WaterEmptyState onRetry={retry} />}

            {!error && hasData && (
                <>
                    {/* View switching tabs — solid-pill (primary) style, matching the section tabs */}
                    <TabNavigation
                        activeTab={dashboardView}
                        onTabChange={(key) => setDashboardView(key as DashboardView)}
                        tabs={[
                            { key: "monthly", label: "Monthly", icon: BarChart3 },
                            { key: "daily", label: "Daily", icon: CalendarDays },
                            { key: "satellite", label: "Satellite View", icon: Satellite },
                        ]}
                    />

                    {/* Monthly Dashboard View — boundary-wrapped so a render fault
                        in the (large) monthly dashboard degrades to a section
                        panel instead of blanking the whole route into
                        app/error.tsx. The Daily view's sections carry their own
                        boundaries internally. */}
                    {dashboardView === "monthly" && (
                        <div id="panel-monthly" role="tabpanel" aria-labelledby="tab-monthly" tabIndex={0} className="motion-safe:animate-in motion-safe:fade-in duration-200">
                            <SectionBoundary title="Monthly water analysis">
                                <WaterMonthlyDashboard waterMeters={waterMeters} derivedMonths={derivedMonths} />
                            </SectionBoundary>
                        </div>
                    )}

                    {/* Daily Dashboard View */}
                    {dashboardView === "daily" && (
                        <div id="panel-daily" role="tabpanel" aria-labelledby="tab-daily" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                            <SectionBoundary title="Daily water report">
                                <DailyWaterReport />
                            </SectionBoundary>
                        </div>
                    )}

                    {/* Satellite View — as-built network map fed from the same fetch as Monthly */}
                    {dashboardView === "satellite" && (
                        <div id="panel-satellite" role="tabpanel" aria-labelledby="tab-satellite" tabIndex={0} className="motion-safe:animate-in motion-safe:fade-in duration-200">
                            <SectionBoundary title="Satellite network view">
                                <SatelliteView waterMeters={waterMeters} derivedMonths={derivedMonths} />
                            </SectionBoundary>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
