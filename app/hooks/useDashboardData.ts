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
                // Fetch STP data
                try {
                    const stpResult = await getSTPOperationsFromSupabase();
                    if (stpResult.length > 0) {
                        stpData = stpResult;
                        liveDataFetched = true;
                    }
                } catch (e) {
                    console.warn("STP fetch from Supabase failed, using mock");
                }

                // Fetch Electricity data
                try {
                    const elecResult = await getElectricityMetersFromSupabase();
                    if (elecResult.length > 0) {
                        elecData = elecResult;
                        liveDataFetched = true;
                    }
                } catch (e) {
                    console.warn("Electricity fetch from Supabase failed, using mock");
                }

                // Fetch Contractors count
                try {
                    const contractorsSummary = await getContractorSummary();
                    if (contractorsSummary.length > 0) {
                        contractorsCount = contractorsSummary.filter(c => c.status === "Active").length;
                        liveDataFetched = true;
                    }
                } catch (e) {
                    console.warn("Contractors fetch from Supabase failed, using mock");
                }

                // Fetch Assets count
                try {
                    const assetsResult = await getAssetsFromSupabase(1, 1, '');
                    if (assetsResult.count > 0) {
                        assetsCount = assetsResult.count;
                        liveDataFetched = true;
                    }
                } catch (e) {
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
            elecTotal = allReadings[latestMonth] || 0;

            setStats([
                {
                    label: "WATER PRODUCTION",
                    value: `${(latestWater.A1 / 1000).toFixed(1)}k m³`,
                    subtitle: `${latestWater.month}`,
                    icon: null, // Will be imported in component
                    variant: "water" as const
                },
                {
                    label: "ELECTRICITY USAGE",
                    value: `${(elecTotal / 1000).toFixed(1)} MWh`,
                    subtitle: latestMonth || "Latest Month",
                    icon: null,
                    variant: "warning" as const
                },
                {
                    label: "STP INLET FLOW",
                    value: `${(stpTotalInlet / 1000).toFixed(1)}k m³`,
                    subtitle: "Total Processed",
                    icon: null,
                    variant: "success" as const
                },
                {
                    label: "TSE OUTPUT",
                    value: `${(stpTotalTSE / 1000).toFixed(1)}k m³`,
                    subtitle: "Recycled Water",
                    icon: null,
                    variant: "primary" as const
                },
                {
                    label: "STP ECONOMIC IMPACT",
                    value: `${(stpTotalIncome / 1000).toFixed(1)}k OMR`,
                    subtitle: "Income + Savings",
                    icon: null,
                    variant: "success" as const
                },
                {
                    label: "ACTIVE CONTRACTORS",
                    value: contractorsCount.toString(),
                    subtitle: "Service Providers",
                    icon: null,
                    variant: "primary" as const
                },
                {
                    label: "TOTAL ASSETS",
                    value: assetsCount.toLocaleString('en-US'),
                    subtitle: "Registered Items",
                    icon: null,
                    variant: "water" as const
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