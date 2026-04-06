import { useCallback, useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import type { STPOperation, MeterReading } from "@/lib/mock-data";
import { getWaterSystemData, getElectricityMeters, getSTPOperations, getContractors, getAssets } from "@/lib/mock-data";
import {
    getSTPOperationsFromSupabase,
    getContractorSummary,
    getAssetsFromSupabase,
    getElectricityMetersFromSupabase,
    getWaterMetersFromSupabase,
    isSupabaseConfigured
} from "@/lib/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
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
    water?: number;
    efficiency?: number;
    inlet?: number;
    tse?: number;
}

export interface RecentActivityItem {
    title: string;
    description: string;
    type: 'critical' | 'warning' | 'info';
}

// Sort month keys like 'Jan-25', 'Feb-26' chronologically
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sortMonthKeys(keys: string[]): string[] {
    return [...keys].sort((a, b) => {
        const [mA, yA] = a.split('-');
        const [mB, yB] = b.split('-');
        const yearDiff = parseInt('20' + yA) - parseInt('20' + yB);
        if (yearDiff !== 0) return yearDiff;
        return MONTH_NAMES.indexOf(mA) - MONTH_NAMES.indexOf(mB);
    });
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
    const [stats, setStats] = useState<DashboardStats[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [stpChartData, setStpChartData] = useState<ChartData[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
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
            let assetsCount = 0;
            let waterMeters: WaterMeter[] = [];

            if (isSupabaseConfigured()) {
                const [stpResult, elecResult, contractorsResult, assetsResult, waterResult] = await Promise.allSettled([
                    getSTPOperationsFromSupabase(),
                    getElectricityMetersFromSupabase(),
                    getContractorSummary(),
                    getAssetsFromSupabase(1, 1, ''),
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

                if (contractorsResult.status === 'fulfilled' && contractorsResult.value.length > 0) {
                    contractorsCount = contractorsResult.value.filter(c => c.status === "Active").length;
                    liveDataFetched = true;
                } else if (contractorsResult.status === 'rejected') {
                    console.warn("Contractors fetch from Supabase failed, using mock");
                }

                if (assetsResult.status === 'fulfilled' && assetsResult.value.count > 0) {
                    assetsCount = assetsResult.value.count;
                    liveDataFetched = true;
                } else if (assetsResult.status === 'rejected') {
                    console.warn("Assets fetch from Supabase failed, using mock");
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
            if (assetsCount === 0) {
                const assetsMock = await getAssets();
                assetsCount = assetsMock.length;
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
                    } catch (e) { /* skip invalid dates */ }
                }
            });
            const stpSortedMonths = Object.keys(stpMonthlyCalc).sort();

            // Use the latest COMPLETE month for stats (>= 25 days of data)
            // Partial current month would show misleadingly low values
            let stpStatsMonthIdx = stpSortedMonths.length - 1;
            for (let i = stpSortedMonths.length - 1; i >= 0; i--) {
                if (stpMonthlyCalc[stpSortedMonths[i]].days >= 25) {
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

            // === TREND HELPER ===
            const calcTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; trendValue: string } => {
                if (previous === 0) return { trend: 'neutral', trendValue: '0%' };
                const change = ((current - previous) / previous) * 100;
                if (Math.abs(change) < 0.5) return { trend: 'neutral', trendValue: '0%' };
                return {
                    trend: change > 0 ? 'up' : 'down',
                    trendValue: `${Math.abs(change).toFixed(1)}%`
                };
            };

            const waterTrend = calcTrend(waterValue, waterPrevValue);
            const elecTrend = calcTrend(elecTotal, elecPrevTotal);
            const stpInletTrend = calcTrend(stpLatestData.inlet, stpPrevData.inlet);
            const stpTseTrend = calcTrend(stpLatestData.tse, stpPrevData.tse);

            const prevTotalTrips = Math.floor(stpPrevData.inlet / 15);
            const prevIncome = (prevTotalTrips * TANKER_FEE) + (stpPrevData.tse * TSE_SAVING_RATE);
            const currentIncome = (Math.floor(stpLatestData.inlet / 15) * TANKER_FEE) + (stpLatestData.tse * TSE_SAVING_RATE);
            const stpEconomicTrend = calcTrend(currentIncome, prevIncome);

            const formattedElecMonth = latestElecMonth ? latestElecMonth.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Latest Month";
            const formattedStpMonth = stpLatestMonth ? format(new Date(stpLatestMonth + "-01"), "MMM yy") : "Latest Month";

            // === STATS ===
            setStats([
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
                },
                {
                    label: "TOTAL ASSETS",
                    value: assetsCount.toLocaleString('en-US'),
                    subtitle: "Registered Items",
                    icon: null,
                    variant: "water" as const,
                    trend: 'neutral',
                    trendValue: '—'
                }
            ]);

            // === WATER CHART (Supabase L1 → fallback to mock) ===
            if (useSupabaseWater) {
                setChartData(waterMonthly.slice(-8).map(m => ({
                    month: m.month,
                    water: Math.round(m.value / 1000)
                })));
            } else {
                setChartData(waterMock.monthlyTrends.slice(-8).map(w => ({
                    month: w.month,
                    water: Math.round(w.A1 / 1000),
                    efficiency: w.efficiency
                })));
            }

            // === STP CHART (sorted chronologically, last 8 complete months) ===
            const stpMonthlyChart: Record<string, { inlet: number; tse: number }> = {};
            stpData.forEach(op => {
                if (op.date) {
                    try {
                        const monthKey = format(new Date(op.date), "MMM-yy");
                        if (!stpMonthlyChart[monthKey]) stpMonthlyChart[monthKey] = { inlet: 0, tse: 0 };
                        stpMonthlyChart[monthKey].inlet += op.inlet_sewage || 0;
                        stpMonthlyChart[monthKey].tse += op.tse_for_irrigation || 0;
                    } catch (e) { /* skip */ }
                }
            });
            const stpChartMonthsSorted = sortMonthKeys(Object.keys(stpMonthlyChart));
            setStpChartData(stpChartMonthsSorted.slice(-8).map(month => ({
                month,
                inlet: Math.round(stpMonthlyChart[month].inlet / 1000),
                tse: Math.round(stpMonthlyChart[month].tse / 1000)
            })));

            // === GENERATE RECENT ACTIVITY from real data ===
            const trendDesc = (t: { trend: string; trendValue: string }) =>
                t.trend === 'up' ? `Up ${t.trendValue} vs prev month`
                    : t.trend === 'down' ? `Down ${t.trendValue} vs prev month`
                        : 'Stable vs previous month';

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
                },
                {
                    title: `Total Assets`,
                    description: `${assetsCount.toLocaleString('en-US')} items tracked in the system`,
                    type: 'info'
                }
            ];
            setRecentActivity(activities);

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

    useSupabaseRealtime({ table: 'stp_operations', channelName: 'dashboard-stp-rt', onChanged: triggerRefresh });
    useSupabaseRealtime({ table: 'Water System', channelName: 'dashboard-water-rt', onChanged: triggerRefresh });
    useSupabaseRealtime({ table: 'electricity_readings', channelName: 'dashboard-elec-rt', onChanged: triggerRefresh });
    useSupabaseRealtime({ table: 'Contractor_Tracker', channelName: 'dashboard-contractors-rt', onChanged: triggerRefresh });
    useSupabaseRealtime({ table: 'assets_register', channelName: 'dashboard-assets-rt', onChanged: triggerRefresh });

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
