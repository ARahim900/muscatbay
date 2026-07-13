import { useCallback, useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import type { STPOperation, MeterReading } from "@/lib/mock-data";
import { getWaterSystemData, getElectricityMeters, getSTPOperations, getContractors } from "@/lib/mock-data";
import {
    getSTPOperationsFromSupabase,
    getElectricityMetersFromSupabase,
    getWaterMetersFromSupabase,
    isSupabaseConfigured
} from "@/lib/supabase";
import { getContractorCounts } from "@/functions";
import { ELECTRICITY_RATES } from "@/lib/config";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { calcTrend, describeTrend } from "@/lib/trends";
import type { WaterMeter } from "@/lib/water-data";

export interface DashboardStats {
    label: string;
    value: string;
    subtitle: string;
    icon: LucideIcon | null;
    variant: "water" | "warning" | "success" | "primary";
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    /** true = down is good (savings: water, electricity). false/omit = up is good (STP output, income). */
    invertTrend?: boolean;
}

export interface ChartData {
    month: string;
    /** null = month inside the shared window with no reading (renders as a gap). */
    water?: number | null;
    efficiency?: number;
    inlet?: number | null;
    tse?: number | null;
}

export interface RecentActivityItem {
    title: string;
    description: string;
    type: 'critical' | 'warning' | 'info';
    /** Explicit route override (falls back to keyword matching on the title). */
    href?: string;
}

// Tables the dashboard reacts to in realtime — all share ONE Supabase channel.
// Module-level constant keeps the array reference stable across renders.
const DASHBOARD_REALTIME_TABLES = [
    'stp_operations',
    // Base tables behind the water KPIs — "Water System" is a view and views
    // never emit postgres_changes events.
    'water_meters',
    'water_monthly_consumption',
    'electricity_readings',
    'Contractor_Tracker',
];

// Sort month keys like 'Jan-25', 'Feb-26' chronologically
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A calendar month needs at least this many daily records before the KPI deck
// treats it as the "latest complete month" — a partial current month would
// otherwise report misleadingly low inlet / TSE / economic totals. The STP chart
// deliberately does NOT apply this: it mirrors the main STP Plant page and plots
// every month as-is (including the in-progress one), so the dashboard reflects
// the same reality as the module page.
const MIN_DAYS_FOR_COMPLETE_MONTH = 25;

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit)
const DASHBOARD_CACHE_KEY = "dashboard:data";
interface DashboardCache {
    stats: DashboardStats[];
    chartData: ChartData[];
    stpChartData: ChartData[];
    recentActivity: RecentActivityItem[];
    isLiveData: boolean;
}

function sortMonthKeys(keys: string[]): string[] {
    return [...keys].sort((a, b) => {
        const [mA, yA] = a.split('-');
        const [mB, yB] = b.split('-');
        const yearDiff = parseInt('20' + yA) - parseInt('20' + yB);
        if (yearDiff !== 0) return yearDiff;
        return MONTH_NAMES.indexOf(mA) - MONTH_NAMES.indexOf(mB);
    });
}

/** Convert an STP `yyyy-MM` bucket key to the app-standard `Mon-YY` label. */
function ymToMonthKey(ym: string): string {
    const [year, month] = ym.split('-');
    return `${MONTH_NAMES[parseInt(month, 10) - 1]}-${year.slice(2)}`;
}

/**
 * Shared month window for the dashboard's side-by-side charts.
 *
 * Both charts previously sliced the last 8 months of THEIR OWN series, so
 * their time axes could cover different windows (and the water chart silently
 * dropped months with no reading instead of showing a gap). This builds ONE
 * calendar-contiguous window ending at the newest month across BOTH series;
 * a month a series has no data for renders as a gap, not a hidden column.
 */
function sharedMonthWindow(waterKeys: string[], stpKeys: string[], size = 8): string[] {
    const union = sortMonthKeys([...new Set([...waterKeys, ...stpKeys])]);
    if (union.length === 0) return [];
    const [lastMon, lastYY] = union[union.length - 1].split('-');
    let monthIdx = MONTH_NAMES.indexOf(lastMon);
    let year = parseInt('20' + lastYY, 10);
    const window: string[] = [];
    for (let i = 0; i < size; i++) {
        window.unshift(`${MONTH_NAMES[monthIdx]}-${String(year).slice(2)}`);
        monthIdx--;
        if (monthIdx < 0) { monthIdx = 11; year--; }
    }
    return window;
}

/**
 * Build monthly water production totals from L1 meters in Supabase
 */
function buildWaterMonthlyFromSupabase(waterMeters: WaterMeter[]): { month: string; value: number }[] {
    const l1Meters = waterMeters.filter(m => m.level === 'L1');
    if (l1Meters.length === 0) return [];

    const monthTotals: Record<string, number> = {};
    for (const meter of l1Meters) {
        for (const [monthKey, val] of Object.entries(meter.consumption)) {
            if (val !== null && val !== undefined && val > 0) {
                monthTotals[monthKey] = (monthTotals[monthKey] || 0) + val;
            }
        }
    }

    const sortedKeys = sortMonthKeys(Object.keys(monthTotals));
    return sortedKeys.map(month => ({ month, value: monthTotals[month] }));
}

export function useDashboardData() {
    // Seed from the session cache so returning to the dashboard renders the
    // command deck instantly; the mount fetch below refreshes it in place.
    const [cached] = useState(() => getPageCache<DashboardCache>(DASHBOARD_CACHE_KEY));
    const [stats, setStats] = useState<DashboardStats[]>(cached?.stats ?? []);
    const [chartData, setChartData] = useState<ChartData[]>(cached?.chartData ?? []);
    const [stpChartData, setStpChartData] = useState<ChartData[]>(cached?.stpChartData ?? []);
    const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(cached?.recentActivity ?? []);
    const [loading, setLoading] = useState(!cached);
    const [isLiveData, setIsLiveData] = useState(cached?.isLiveData ?? false);
    const [error, setError] = useState<string | null>(null);
    const [refreshCount, setRefreshCount] = useState(0);

    const loadDashboardData = useCallback(async () => {

        try {
            setError(null);
            let liveDataFetched = false;

            // Fetch water mock data as fallback
            const waterMock = await getWaterSystemData();

            let stpData: STPOperation[] = [];
            let elecData: MeterReading[] = [];
            let contractorsCount = 0;
            let waterMeters: WaterMeter[] = [];

            if (isSupabaseConfigured()) {
                const [stpResult, elecResult, contractorsResult, waterResult] = await Promise.allSettled([
                    getSTPOperationsFromSupabase(),
                    getElectricityMetersFromSupabase(),
                    getContractorCounts(),
                    getWaterMetersFromSupabase()
                ]);

                if (stpResult.status === 'fulfilled' && stpResult.value.length > 0) {
                    stpData = stpResult.value;
                    liveDataFetched = true;
                } else if (stpResult.status === 'rejected') {
                    console.warn("STP fetch from Supabase failed, using mock");
                }

                if (elecResult.status === 'fulfilled' && elecResult.value.length > 0) {
                    elecData = elecResult.value;
                    liveDataFetched = true;
                } else if (elecResult.status === 'rejected') {
                    console.warn("Electricity fetch from Supabase failed, using mock");
                }

                // Count-only queries (head: true) — no rows are transferred
                if (contractorsResult.status === 'fulfilled' && contractorsResult.value.total > 0) {
                    contractorsCount = contractorsResult.value.active;
                    liveDataFetched = true;
                } else if (contractorsResult.status === 'rejected') {
                    console.warn("Contractors fetch from Supabase failed, using mock");
                }

                if (waterResult.status === 'fulfilled' && waterResult.value.length > 0) {
                    waterMeters = waterResult.value;
                    liveDataFetched = true;
                } else if (waterResult.status === 'rejected') {
                    console.warn("Water fetch from Supabase failed, using mock");
                }
            }

            // Fallback to mock data
            if (stpData.length === 0) stpData = await getSTPOperations();
            if (elecData.length === 0) elecData = await getElectricityMeters();
            if (contractorsCount === 0) {
                const contractorsMock = await getContractors();
                contractorsCount = contractorsMock.filter(c => c.status === "Active").length;
            }

            setIsLiveData(liveDataFetched);

            // === WATER PRODUCTION (Supabase L1 meters → fallback to mock) ===
            const waterMonthly = buildWaterMonthlyFromSupabase(waterMeters);
            const useSupabaseWater = waterMonthly.length > 0;

            let waterValue: number;
            let waterMonth: string;
            let waterPrevValue: number;

            if (useSupabaseWater) {
                const latest = waterMonthly[waterMonthly.length - 1];
                const prev = waterMonthly.length >= 2 ? waterMonthly[waterMonthly.length - 2] : null;
                waterValue = latest.value;
                waterMonth = latest.month;
                waterPrevValue = prev?.value || 0;
            } else {
                const latestWater = waterMock.monthlyTrends[waterMock.monthlyTrends.length - 1];
                const prevWater = waterMock.monthlyTrends.length >= 2 ? waterMock.monthlyTrends[waterMock.monthlyTrends.length - 2] : null;
                waterValue = latestWater.A1;
                waterMonth = latestWater.month;
                waterPrevValue = prevWater?.A1 || 0;
            }

            // === STP CALCULATIONS ===
            const TANKER_FEE = 4.50;
            const TSE_SAVING_RATE = 1.32;

            const stpMonthlyCalc: Record<string, { inlet: number; tse: number; days: number }> = {};
            stpData.forEach(op => {
                if (op.date) {
                    try {
                        const monthKey = format(new Date(op.date), "yyyy-MM");
                        if (!stpMonthlyCalc[monthKey]) stpMonthlyCalc[monthKey] = { inlet: 0, tse: 0, days: 0 };
                        stpMonthlyCalc[monthKey].inlet += op.inlet_sewage || 0;
                        stpMonthlyCalc[monthKey].tse += op.tse_for_irrigation || 0;
                        stpMonthlyCalc[monthKey].days += 1;
                    } catch { /* skip invalid dates */ }
                }
            });
            const stpSortedMonths = Object.keys(stpMonthlyCalc).sort();

            // Use the latest COMPLETE month for stats (see MIN_DAYS_FOR_COMPLETE_MONTH)
            // Partial current month would show misleadingly low values
            let stpStatsMonthIdx = stpSortedMonths.length - 1;
            for (let i = stpSortedMonths.length - 1; i >= 0; i--) {
                if (stpMonthlyCalc[stpSortedMonths[i]].days >= MIN_DAYS_FOR_COMPLETE_MONTH) {
                    stpStatsMonthIdx = i;
                    break;
                }
            }
            const stpLatestMonth = stpSortedMonths[stpStatsMonthIdx];
            const stpPrevMonth = stpStatsMonthIdx > 0 ? stpSortedMonths[stpStatsMonthIdx - 1] : undefined;
            const stpLatestData = stpLatestMonth ? stpMonthlyCalc[stpLatestMonth] : { inlet: 0, tse: 0, days: 0 };
            const stpPrevData = stpPrevMonth ? stpMonthlyCalc[stpPrevMonth] : { inlet: 0, tse: 0, days: 0 };
            // === ELECTRICITY CALCULATIONS ===
            const allReadings: Record<string, number> = {};
            elecData.forEach(meter => {
                Object.entries(meter.readings || {}).forEach(([month, value]) => {
                    allReadings[month] = (allReadings[month] || 0) + (value as number);
                });
            });
            const sortedElecMonths = sortMonthKeys(Object.keys(allReadings));
            const latestElecMonth = sortedElecMonths[sortedElecMonths.length - 1] || "";
            const prevElecMonth = sortedElecMonths[sortedElecMonths.length - 2] || "";
            const elecTotal = allReadings[latestElecMonth] || 0;
            const elecPrevTotal = allReadings[prevElecMonth] || 0;

            // Month-over-month changes — ONE shared calculation (lib/trends.ts)
            const waterTrend = calcTrend(waterValue, waterPrevValue);
            const elecTrend = calcTrend(elecTotal, elecPrevTotal);
            // Electricity cost at the flat tariff — surfaces the OMR figure that
            // executives track alongside the raw MWh usage.
            const elecCost = elecTotal * ELECTRICITY_RATES.RATE_PER_KWH;
            const elecCostTrend = calcTrend(elecCost, elecPrevTotal * ELECTRICITY_RATES.RATE_PER_KWH);
            const stpInletTrend = calcTrend(stpLatestData.inlet, stpPrevData.inlet);
            const stpTseTrend = calcTrend(stpLatestData.tse, stpPrevData.tse);

            const prevTotalTrips = Math.floor(stpPrevData.inlet / 15);
            const prevIncome = (prevTotalTrips * TANKER_FEE) + (stpPrevData.tse * TSE_SAVING_RATE);
            const currentIncome = (Math.floor(stpLatestData.inlet / 15) * TANKER_FEE) + (stpLatestData.tse * TSE_SAVING_RATE);
            const stpEconomicTrend = calcTrend(currentIncome, prevIncome);

            // Month labels — the app-standard "Mon-YY" everywhere (electricity keys
            // already are; STP buckets are yyyy-MM and previously rendered "Mon YY",
            // a third format on the same KPI deck).
            const formattedElecMonth = latestElecMonth || "Latest Month";
            const formattedStpMonth = stpLatestMonth ? ymToMonthKey(stpLatestMonth) : "Latest Month";

            // === STATS ===
            const nextStats: DashboardStats[] = [
                {
                    label: "WATER PRODUCTION",
                    value: `${(waterValue / 1000).toFixed(1)}k m³`,
                    subtitle: waterMonth,
                    icon: null,
                    variant: "water" as const,
                    trend: waterTrend.trend,
                    trendValue: waterTrend.trendValue,
                    invertTrend: true,   // Less water drawn = conservation = green ✓
                },
                {
                    label: "ELECTRICITY USAGE",
                    value: `${(elecTotal / 1000).toFixed(1)} MWh`,
                    subtitle: formattedElecMonth,
                    icon: null,
                    variant: "warning" as const,
                    trend: elecTrend.trend,
                    trendValue: elecTrend.trendValue,
                    invertTrend: true,   // Less electricity = saving = green ✓
                },
                {
                    label: "ELECTRICITY COST",
                    value: `${(elecCost / 1000).toFixed(1)}k OMR`,
                    subtitle: formattedElecMonth,
                    icon: null,
                    variant: "warning" as const,
                    trend: elecCostTrend.trend,
                    trendValue: elecCostTrend.trendValue,
                    invertTrend: true,   // Lower cost = saving = green ✓
                },
                {
                    label: "STP INLET FLOW",
                    value: `${(stpLatestData.inlet / 1000).toFixed(1)}k m³`,
                    subtitle: formattedStpMonth,
                    icon: null,
                    variant: "success" as const,
                    trend: stpInletTrend.trend,
                    trendValue: stpInletTrend.trendValue,
                    // default: more inlet = system processing more = green ✓
                },
                {
                    label: "TSE OUTPUT",
                    value: `${(stpLatestData.tse / 1000).toFixed(1)}k m³`,
                    subtitle: formattedStpMonth,
                    icon: null,
                    variant: "primary" as const,
                    trend: stpTseTrend.trend,
                    trendValue: stpTseTrend.trendValue,
                    // default: more TSE = more irrigation savings = green ✓
                },
                {
                    label: "STP ECONOMIC IMPACT",
                    value: `${(currentIncome / 1000).toFixed(1)}k OMR`,
                    subtitle: formattedStpMonth,
                    icon: null,
                    variant: "success" as const,
                    trend: stpEconomicTrend.trend,
                    trendValue: stpEconomicTrend.trendValue,
                    // default: more economic impact = better = green ✓
                }
            ];
            setStats(nextStats);

            // === CHARTS — one shared, calendar-contiguous month window ===
            // Both charts plot the SAME last-8-months axis (ending at the newest
            // month across water + STP), so the side-by-side time axes always
            // align. A month with no reading is a gap (null), never a hidden
            // column. STP mirrors the main STP Plant page: every month as-is,
            // no completeness filter, including the in-progress current month.
            const waterByMonth = new Map(
                useSupabaseWater
                    ? waterMonthly.map(m => [m.month, m.value] as const)
                    : waterMock.monthlyTrends.map(w => [w.month, w.A1] as const)
            );
            const stpByMonth = new Map(
                stpSortedMonths.map(ym => [ymToMonthKey(ym), stpMonthlyCalc[ym]] as const)
            );
            const monthWindow = sharedMonthWindow([...waterByMonth.keys()], [...stpByMonth.keys()]);

            const nextChartData: ChartData[] = monthWindow.map(month => {
                const v = waterByMonth.get(month);
                return { month, water: v != null ? Math.round(v / 1000) : null };
            });
            setChartData(nextChartData);

            const nextStpChartData: ChartData[] = monthWindow.map(month => {
                const bucket = stpByMonth.get(month);
                return {
                    month,
                    inlet: bucket ? Math.round(bucket.inlet / 1000) : null,
                    tse: bucket ? Math.round(bucket.tse / 1000) : null,
                };
            });
            setStpChartData(nextStpChartData);

            // === GENERATE RECENT ACTIVITY from real data ===
            const trendDesc = describeTrend;

            const activities: RecentActivityItem[] = [
                {
                    title: `Water Production — ${waterMonth}`,
                    description: `${(waterValue / 1000).toFixed(1)}k m³ · ${trendDesc(waterTrend)}`,
                    type: waterTrend.trend === 'up' ? 'warning' : 'info'
                },
                {
                    title: `Electricity Usage — ${formattedElecMonth}`,
                    description: `${(elecTotal / 1000).toFixed(1)} MWh · ${trendDesc(elecTrend)}`,
                    type: elecTrend.trend === 'up' ? 'warning' : 'info'
                },
                {
                    title: `STP Inlet Flow — ${formattedStpMonth}`,
                    description: `${(stpLatestData.inlet / 1000).toFixed(1)}k m³ · ${trendDesc(stpInletTrend)}`,
                    type: 'info'
                },
                {
                    title: `TSE Output — ${formattedStpMonth}`,
                    description: `${(stpLatestData.tse / 1000).toFixed(1)}k m³ · ${trendDesc(stpTseTrend)}`,
                    type: stpTseTrend.trend === 'down' ? 'warning' : 'info'
                },
                {
                    title: `STP Revenue — ${formattedStpMonth}`,
                    description: `${(currentIncome / 1000).toFixed(1)}k OMR · ${trendDesc(stpEconomicTrend)}`,
                    type: stpEconomicTrend.trend === 'down' ? 'warning' : 'info'
                },
                {
                    title: `Active Contractors`,
                    description: `${contractorsCount} service providers currently registered`,
                    type: 'info'
                }
            ];
            setRecentActivity(activities);

            // Cache live results so returning to the dashboard is instant
            // (mock fallbacks are not cached — they should retry next visit).
            if (liveDataFetched) {
                setPageCache<DashboardCache>(DASHBOARD_CACHE_KEY, {
                    stats: nextStats,
                    chartData: nextChartData,
                    stpChartData: nextStpChartData,
                    recentActivity: activities,
                    isLiveData: liveDataFetched,
                });
            }

        } catch (error) {
            console.error("Failed to load dashboard data", error);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + refetch when refreshCount changes
    useEffect(() => {
        loadDashboardData();
    }, [refreshCount, loadDashboardData]);

    // Debounced refresh — multiple realtime events within 2500ms trigger only one reload
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRefresh = useCallback(() => {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
            setRefreshCount(n => n + 1);
        }, 2500);
    }, []);
    useEffect(() => () => {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    }, []);

    // One consolidated realtime channel with a postgres_changes listener per
    // table — instead of five separate channels (one per table).
    useSupabaseRealtime({ table: DASHBOARD_REALTIME_TABLES, channelName: 'dashboard-rt', onChanged: triggerRefresh });

    return {
        stats,
        chartData,
        stpChartData,
        recentActivity,
        loading,
        isLiveData,
        error,
        refetch: triggerRefresh
    };
}
