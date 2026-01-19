import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { getWaterSystemData, getElectricityMeters, getSTPOperations, getContractors, getAssets, WaterSystemData } from "@/lib/mock-data";
import {
    getSTPOperationsFromSupabase,
    getContractorSummary,
    getAssetsFromSupabase,
    getElectricityMetersFromSupabase,
    isSupabaseConfigured
} from "@/lib/supabase";

export interface DashboardStats {
    label: string;
    value: string;
    subtitle: string;
    icon: any;
    variant: "water" | "warning" | "success" | "primary";
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

export interface ChartData {
    month: string;
    water?: number;
    efficiency?: number;
    inlet?: number;
    tse?: number;
}

export function useDashboardData() {
    const [stats, setStats] = useState<DashboardStats[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [stpChartData, setStpChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);

    const loadDashboardData = async () => {
        // Simple rate limiting: prevent fetches more than once per 30 seconds
        const now = Date.now();
        if (now - lastFetch < 30000) {
            console.warn("Rate limited: please wait before refetching");
            return;
        }
        setLastFetch(now);

        try {
            setError(null);
            let liveDataFetched = false;

            // Fetch water data (mock for now as no Supabase table)
            const water = await getWaterSystemData();
            const latestWater = water.monthlyTrends[water.monthlyTrends.length - 1];

            // Try to fetch live data from Supabase
            let stpData: any[] = [];
            let elecData: any[] = [];
            let contractorsCount = 0;
            let assetsCount = 0;
            let stpTotalInlet = 0;
            let stpTotalTSE = 0;
            let stpTotalIncome = 0;
            let elecTotal = 0;

            if (isSupabaseConfigured()) {
                // Fetch all data in PARALLEL for better performance
                const [stpResult, elecResult, contractorsResult, assetsResult] = await Promise.allSettled([
                    getSTPOperationsFromSupabase(),
                    getElectricityMetersFromSupabase(),
                    getContractorSummary(),
                    getAssetsFromSupabase(1, 1, '')
                ]);

                // Process STP data
                if (stpResult.status === 'fulfilled' && stpResult.value.length > 0) {
                    stpData = stpResult.value;
                    liveDataFetched = true;
                } else if (stpResult.status === 'rejected') {
                    console.warn("STP fetch from Supabase failed, using mock");
                }

                // Process Electricity data
                if (elecResult.status === 'fulfilled' && elecResult.value.length > 0) {
                    elecData = elecResult.value;
                    liveDataFetched = true;
                } else if (elecResult.status === 'rejected') {
                    console.warn("Electricity fetch from Supabase failed, using mock");
                }

                // Process Contractors count
                if (contractorsResult.status === 'fulfilled' && contractorsResult.value.length > 0) {
                    contractorsCount = contractorsResult.value.filter(c => c.status === "Active").length;
                    liveDataFetched = true;
                } else if (contractorsResult.status === 'rejected') {
                    console.warn("Contractors fetch from Supabase failed, using mock");
                }

                // Process Assets count
                if (assetsResult.status === 'fulfilled' && assetsResult.value.count > 0) {
                    assetsCount = assetsResult.value.count;
                    liveDataFetched = true;
                } else if (assetsResult.status === 'rejected') {
                    console.warn("Assets fetch from Supabase failed, using mock");
                }
            }

            // Fallback to mock data if no live data
            if (stpData.length === 0) {
                stpData = await getSTPOperations();
            }
            if (elecData.length === 0) {
                elecData = await getElectricityMeters();
            }
            if (contractorsCount === 0) {
                const contractorsMock = await getContractors();
                contractorsCount = contractorsMock.filter(c => c.status === "Active").length;
            }
            if (assetsCount === 0) {
                const assetsMock = await getAssets();
                assetsCount = assetsMock.length;
            }

            setIsLiveData(liveDataFetched);

            // Calculate STP Totals (all data)
            const TANKER_FEE = 4.50;
            const TSE_SAVING_RATE = 1.32;
            stpTotalInlet = stpData.reduce((acc, op) => acc + (op.inlet_sewage || 0), 0);
            stpTotalTSE = stpData.reduce((acc, op) => acc + (op.tse_for_irrigation || 0), 0);
            const totalTrips = stpData.reduce((acc, op) => acc + (op.tanker_trips || 0), 0);
            stpTotalIncome = (totalTrips * TANKER_FEE) + (stpTotalTSE * TSE_SAVING_RATE);

            // Calculate Electricity Totals
            const allReadings: Record<string, number> = {};
            elecData.forEach(meter => {
                Object.entries(meter.readings || {}).forEach(([month, value]) => {
                    allReadings[month] = (allReadings[month] || 0) + (value as number);
                });
            });
            const sortedMonths = Object.keys(allReadings).sort();
            const latestMonth = sortedMonths[sortedMonths.length - 1] || "";
            const prevMonth = sortedMonths[sortedMonths.length - 2] || "";
            elecTotal = allReadings[latestMonth] || 0;
            const elecPrevTotal = allReadings[prevMonth] || 0;

            // Helper function to calculate trend
            const calcTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; trendValue: string } => {
                if (previous === 0) return { trend: 'neutral', trendValue: '0%' };
                const change = ((current - previous) / previous) * 100;
                if (Math.abs(change) < 0.5) return { trend: 'neutral', trendValue: '0%' };
                return {
                    trend: change > 0 ? 'up' : 'down',
                    trendValue: `${Math.abs(change).toFixed(1)}%`
                };
            };

            // Calculate trends for water
            const prevWater = water.monthlyTrends.length >= 2 ? water.monthlyTrends[water.monthlyTrends.length - 2] : null;
            const waterTrend = prevWater ? calcTrend(latestWater.A1, prevWater.A1) : { trend: 'neutral' as const, trendValue: '0%' };

            // Calculate trends for electricity
            const elecTrend = calcTrend(elecTotal, elecPrevTotal);

            // Calculate trends for STP (using monthly aggregated data)
            const stpMonthlyCalc: Record<string, { inlet: number; tse: number }> = {};
            stpData.forEach(op => {
                if (op.date) {
                    try {
                        const monthKey = format(new Date(op.date), "yyyy-MM");
                        if (!stpMonthlyCalc[monthKey]) {
                            stpMonthlyCalc[monthKey] = { inlet: 0, tse: 0 };
                        }
                        stpMonthlyCalc[monthKey].inlet += op.inlet_sewage || 0;
                        stpMonthlyCalc[monthKey].tse += op.tse_for_irrigation || 0;
                    } catch (e) {
                        // Skip invalid dates
                    }
                }
            });
            const stpSortedMonths = Object.keys(stpMonthlyCalc).sort();
            const stpLatestMonth = stpSortedMonths[stpSortedMonths.length - 1];
            const stpPrevMonth = stpSortedMonths[stpSortedMonths.length - 2];
            const stpLatestData = stpLatestMonth ? stpMonthlyCalc[stpLatestMonth] : { inlet: 0, tse: 0 };
            const stpPrevData = stpPrevMonth ? stpMonthlyCalc[stpPrevMonth] : { inlet: 0, tse: 0 };
            const stpInletTrend = calcTrend(stpLatestData.inlet, stpPrevData.inlet);
            const stpTseTrend = calcTrend(stpLatestData.tse, stpPrevData.tse);

            // Calculate STP economic trend
            const prevTotalTrips = Math.floor(stpPrevData.inlet / 15); // Estimated trips based on avg trip capacity
            const prevIncome = (prevTotalTrips * TANKER_FEE) + (stpPrevData.tse * TSE_SAVING_RATE);
            const currentIncome = (Math.floor(stpLatestData.inlet / 15) * TANKER_FEE) + (stpLatestData.tse * TSE_SAVING_RATE);
            const stpEconomicTrend = calcTrend(currentIncome, prevIncome);

            setStats([
                {
                    label: "WATER PRODUCTION",
                    value: `${(latestWater.A1 / 1000).toFixed(1)}k m³`,
                    subtitle: `${latestWater.month}`,
                    icon: null, // Will be imported in component
                    variant: "water" as const,
                    trend: waterTrend.trend,
                    trendValue: waterTrend.trendValue
                },
                {
                    label: "ELECTRICITY USAGE",
                    value: `${(elecTotal / 1000).toFixed(1)} MWh`,
                    subtitle: latestMonth || "Latest Month",
                    icon: null,
                    variant: "warning" as const,
                    trend: elecTrend.trend,
                    trendValue: elecTrend.trendValue
                },
                {
                    label: "STP INLET FLOW",
                    value: `${(stpTotalInlet / 1000).toFixed(1)}k m³`,
                    subtitle: "Total Processed",
                    icon: null,
                    variant: "success" as const,
                    trend: stpInletTrend.trend,
                    trendValue: stpInletTrend.trendValue
                },
                {
                    label: "TSE OUTPUT",
                    value: `${(stpTotalTSE / 1000).toFixed(1)}k m³`,
                    subtitle: "Recycled Water",
                    icon: null,
                    variant: "primary" as const,
                    trend: stpTseTrend.trend,
                    trendValue: stpTseTrend.trendValue
                },
                {
                    label: "STP ECONOMIC IMPACT",
                    value: `${(stpTotalIncome / 1000).toFixed(1)}k OMR`,
                    subtitle: "Income + Savings",
                    icon: null,
                    variant: "success" as const,
                    trend: stpEconomicTrend.trend,
                    trendValue: stpEconomicTrend.trendValue
                },
                {
                    label: "ACTIVE CONTRACTORS",
                    value: contractorsCount.toString(),
                    subtitle: "Service Providers",
                    icon: null,
                    variant: "primary" as const,
                    trend: 'neutral',
                    trendValue: '—'
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

            // Chart Data: Water Trend
            const trendData = water.monthlyTrends.slice(-8).map(w => ({
                month: w.month,
                water: Math.round(w.A1 / 1000),
                efficiency: w.efficiency
            }));
            setChartData(trendData);

            // STP Monthly Chart Data
            const stpMonthly: Record<string, { inlet: number; tse: number }> = {};
            stpData.forEach(op => {
                if (op.date) {
                    try {
                        const monthKey = format(new Date(op.date), "MMM-yy");
                        if (!stpMonthly[monthKey]) {
                            stpMonthly[monthKey] = { inlet: 0, tse: 0 };
                        }
                        stpMonthly[monthKey].inlet += op.inlet_sewage || 0;
                        stpMonthly[monthKey].tse += op.tse_for_irrigation || 0;
                    } catch (e) {
                        // Skip invalid dates
                    }
                }
            });
            const stpChartArr = Object.entries(stpMonthly)
                .map(([month, data]) => ({
                    month,
                    inlet: Math.round(data.inlet / 1000),
                    tse: Math.round(data.tse / 1000)
                }))
                .slice(-8);
            setStpChartData(stpChartArr);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Memoize computed values if needed
    const memoizedStats = useMemo(() => stats, [stats]);

    return {
        stats: memoizedStats,
        chartData,
        stpChartData,
        loading,
        isLiveData,
        error,
        refetch: loadDashboardData
    };
}