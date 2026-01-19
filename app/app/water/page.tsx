"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Droplets, ChevronsRight, Users, AlertTriangle, ArrowRightLeft,
    BarChart3, TestTube2, Database, Network, Minus, TrendingUp,
    Gauge, Calendar, Activity, Loader2, CalendarDays,
    Wifi, WifiOff, Building2, Home, Layers, AlertCircle, MapPin,
    TrendingDown, ChevronDown, ChevronRight
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, BarChart, Bar, Cell, Line, CartesianGrid
} from "recharts";

// Water data imports
import {
    WATER_METERS as MOCK_WATER_METERS, AVAILABLE_MONTHS, ZONE_CONFIG,
    getConsumption, WaterMeter
} from "@/lib/water-data";

// Supabase imports
import { getWaterMetersFromSupabase, getDailyWaterConsumptionFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DailyWaterConsumption } from "@/entities/water";

// Components
import { DateRangePicker } from "@/components/water/date-range-picker";
import { TypeFilterPills } from "@/components/water/type-filter-pills";
import { LiquidProgressRing } from "../../components/charts/liquid-progress-ring";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { MeterTable } from "@/components/water/meter-table";
import { WaterNetworkHierarchy } from "@/components/water/network-hierarchy";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGrid } from "@/components/shared/stats-grid";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";

// Dashboard view type
type DashboardView = 'monthly' | 'hierarchy' | 'daily';

// Helper functions that work with dynamic data
function calculateRangeAnalysisFromData(meters: WaterMeter[], startMonth: string, endMonth: string) {
    const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
    const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return { A1: 0, A2: 0, A3Bulk: 0, A3Individual: 0, stage1Loss: 0, stage2Loss: 0, totalLoss: 0, efficiency: 0, lossPercentage: 0 };

    const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);

    const l1Meters = meters.filter(m => m.level === 'L1');
    const l2Meters = meters.filter(m => m.level === 'L2');
    const l3Meters = meters.filter(m => m.level === 'L3');
    const l4Meters = meters.filter(m => m.level === 'L4');
    const dcMeters = meters.filter(m => m.level === 'DC');

    const sumConsumption = (meterList: WaterMeter[]) =>
        meterList.reduce((sum, m) => sum + months.reduce((s, month) => s + getConsumption(m, month), 0), 0);

    const A1 = sumConsumption(l1Meters);
    const A2 = sumConsumption(l2Meters) + sumConsumption(dcMeters);
    const l3NonBuildings = l3Meters.filter(m => !m.type.includes('Building_Bulk'));
    const A3Individual = sumConsumption(l3NonBuildings) + sumConsumption(l4Meters) + sumConsumption(dcMeters);
    const A3Bulk = sumConsumption(l3Meters) + sumConsumption(dcMeters);

    const stage1Loss = A1 - A2;
    const stage2Loss = A2 - A3Individual;
    const totalLoss = A1 - A3Individual;
    const efficiency = A1 > 0 ? Math.round((A3Individual / A1) * 1000) / 10 : 0;
    const lossPercentage = A1 > 0 ? Math.round((totalLoss / A1) * 1000) / 10 : 0;

    return { A1, A2, A3Bulk, A3Individual, stage1Loss, stage2Loss, totalLoss, efficiency, lossPercentage };
}

function getMonthlyTrendsFromData(meters: WaterMeter[], startMonth: string, endMonth: string) {
    const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
    const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
    if (startIdx === -1 || endIdx === -1) return [];

    return AVAILABLE_MONTHS.slice(startIdx, endIdx + 1).map(month => {
        const l1Meters = meters.filter(m => m.level === 'L1');
        const l2Meters = meters.filter(m => m.level === 'L2');
        const l3Meters = meters.filter(m => m.level === 'L3');
        const l4Meters = meters.filter(m => m.level === 'L4');
        const dcMeters = meters.filter(m => m.level === 'DC');

        const A1 = l1Meters.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const A2 = l2Meters.reduce((sum, m) => sum + getConsumption(m, month), 0) + dcMeters.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const l3NonBuildings = l3Meters.filter(m => !m.type.includes('Building_Bulk'));
        const A3Individual = l3NonBuildings.reduce((sum, m) => sum + getConsumption(m, month), 0) + l4Meters.reduce((sum, m) => sum + getConsumption(m, month), 0) + dcMeters.reduce((sum, m) => sum + getConsumption(m, month), 0);

        const stage1Loss = A1 - A2;
        const stage2Loss = A2 - A3Individual;
        const totalLoss = A1 - A3Individual;

        return { month, A1, A2, A3Individual, stage1Loss, stage2Loss, totalLoss };
    });
}

function calculateZoneAnalysisFromData(meters: WaterMeter[], zone: string, month: string) {
    const config = ZONE_CONFIG.find(z => z.code === zone);
    if (!config) return { zone, zoneName: zone, bulkMeterReading: 0, individualTotal: 0, loss: 0, lossPercentage: 0, efficiency: 0, meterCount: 0 };

    const bulkMeter = meters.find(m => m.accountNumber === config.bulkMeterAccount);
    const bulkMeterReading = bulkMeter ? getConsumption(bulkMeter, month) : 0;
    const zoneMeters = meters.filter(m => m.zone === zone && (m.level === 'L3' || m.level === 'L4'));
    const l3Meters = zoneMeters.filter(m => m.level === 'L3' && !m.type.includes('Building_Bulk'));
    const l4Meters = zoneMeters.filter(m => m.level === 'L4');
    const individualTotal = l3Meters.reduce((sum, m) => sum + getConsumption(m, month), 0) + l4Meters.reduce((sum, m) => sum + getConsumption(m, month), 0);

    const loss = bulkMeterReading - individualTotal;
    const lossPercentage = bulkMeterReading > 0 ? Math.round((loss / bulkMeterReading) * 1000) / 10 : 0;
    const efficiency = bulkMeterReading > 0 ? Math.round((individualTotal / bulkMeterReading) * 1000) / 10 : 0;

    return { zone, zoneName: config.name, bulkMeterReading, individualTotal, loss, lossPercentage, efficiency, meterCount: zoneMeters.length };
}

function getAllZonesAnalysisFromData(meters: WaterMeter[], month: string) {
    return ZONE_CONFIG.map(config => calculateZoneAnalysisFromData(meters, config.code, month));
}

function getMeterCountsByLevelFromData(meters: WaterMeter[]) {
    return ['L1', 'L2', 'L3', 'L4', 'DC'].map(level => ({ level, count: meters.filter(m => m.level === level).length }));
}

export default function WaterPage() {
    const [dashboardView, setDashboardView] = useState<DashboardView>('monthly');
    const [monthlyTab, setMonthlyTab] = useState("overview"); // Changed to string for TabNavigation compatibility
    const [startMonth, setStartMonth] = useState('Jan-25');
    const [endMonth, setEndMonth] = useState('Oct-25');
    const [selectedZone, setSelectedZone] = useState('Zone_01_(FM)');
    const [selectedType, setSelectedType] = useState('All');

    // Supabase data state
    const [waterMeters, setWaterMeters] = useState<WaterMeter[]>(MOCK_WATER_METERS);
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');

    // Fetch water data from Supabase on mount
    useEffect(() => {
        async function fetchWaterData() {
            setIsLoading(true);
            try {
                if (isSupabaseConfigured()) {
                    const supabaseData = await getWaterMetersFromSupabase();
                    if (supabaseData.length > 0) {
                        setWaterMeters(supabaseData);
                        setDataSource('supabase');
                        console.log(`Water data loaded from Supabase: ${supabaseData.length} meters`);
                    } else {
                        setWaterMeters(MOCK_WATER_METERS);
                        setDataSource('mock');
                        console.log('No Supabase data, using mock data');
                    }
                } else {
                    setWaterMeters(MOCK_WATER_METERS);
                    setDataSource('mock');
                    console.log('Supabase not configured, using mock data');
                }
            } catch (error) {
                console.error('Error fetching water data:', error);
                setWaterMeters(MOCK_WATER_METERS);
                setDataSource('mock');
            } finally {
                setIsLoading(false);
            }
        }
        fetchWaterData();

        // Load saved filter preferences
        const savedPrefs = loadFilterPreferences<{
            dashboardView?: DashboardView;
            monthlyTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedZone?: string;
            selectedType?: string;
        }>('water');
        if (savedPrefs) {
            if (savedPrefs.dashboardView) setDashboardView(savedPrefs.dashboardView);
            if (savedPrefs.monthlyTab) setMonthlyTab(savedPrefs.monthlyTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedZone) setSelectedZone(savedPrefs.selectedZone);
            if (savedPrefs.selectedType) setSelectedType(savedPrefs.selectedType);
        }
    }, []);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('water', {
            dashboardView,
            monthlyTab,
            startMonth,
            endMonth,
            selectedZone,
            selectedType
        });
    }, [dashboardView, monthlyTab, startMonth, endMonth, selectedZone, selectedType]);

    // Calculate analysis data using the loaded meters
    const rangeAnalysis = useMemo(() =>
        calculateRangeAnalysisFromData(waterMeters, startMonth, endMonth), [waterMeters, startMonth, endMonth]);

    const monthlyTrends = useMemo(() =>
        getMonthlyTrendsFromData(waterMeters, startMonth, endMonth), [waterMeters, startMonth, endMonth]);

    const zoneAnalysis = useMemo(() =>
        calculateZoneAnalysisFromData(waterMeters, selectedZone, endMonth), [waterMeters, selectedZone, endMonth]);

    const allZones = useMemo(() =>
        getAllZonesAnalysisFromData(waterMeters, endMonth), [waterMeters, endMonth]);

    const meterCounts = useMemo(() => getMeterCountsByLevelFromData(waterMeters), [waterMeters]);

    // Get unique types for filter
    const uniqueTypes = useMemo(() => {
        const types = new Set(waterMeters.map(m => m.type));
        return ['All', ...Array.from(types)];
    }, [waterMeters]);

    // Filter meters by type
    const filteredMeters = useMemo(() => {
        if (selectedType === 'All') return waterMeters;
        return waterMeters.filter(m => m.type === selectedType);
    }, [waterMeters, selectedType]);

    // Calculate total consumption for filtered data
    const totalConsumption = useMemo(() => {
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);
        return filteredMeters.reduce((total, meter) => {
            return total + months.reduce((sum, m) => sum + getConsumption(meter, m), 0);
        }, 0);
    }, [filteredMeters, startMonth, endMonth]);

    // Find highest consumer
    const highestConsumer = useMemo(() => {
        let max = { meter: waterMeters[0], total: 0 };
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);

        filteredMeters.forEach(meter => {
            const total = months.reduce((sum, m) => sum + getConsumption(meter, m), 0);
            if (total > max.total) max = { meter, total };
        });
        return max;
    }, [filteredMeters, startMonth, endMonth]);

    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    const handleResetRange = () => {
        setStartMonth('Jan-25');
        setEndMonth('Oct-25');
    };

    // Consumption by type chart data
    const consumptionChartData = useMemo(() => {
        const typeConsumption: Record<string, number> = {};
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);

        waterMeters.forEach(meter => {
            const total = months.reduce((sum, m) => sum + getConsumption(meter, m), 0);
            typeConsumption[meter.type] = (typeConsumption[meter.type] || 0) + total;
        });

        return Object.entries(typeConsumption)
            .map(([type, total]) => ({ type, total }))
            .sort((a, b) => b.total - a.total);
    }, [startMonth, endMonth]);

    const TYPE_COLORS = {
        'Main BULK': '#5BA88B', // Success/Green
        'Retail': '#C95D63', // Danger/Red
        'Zone Bulk': '#81D8D0', // Secondary/Teal
        'Residential (Villa)': '#4E4456', // Primary/Plum
        'IRR_Servies': '#E8A838', // Warning/Amber
        'D_Building_Bulk': '#81D8D0', // Teal
        'Residential (Apart)': '#6B5F73', // Primary Light
        'MB_Common': '#374151', // Neutral
        'Building': '#E8A838', // Warning
        'D_Building_Common': '#4E4456' // Primary
    };

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

    // Calculate previous month analysis for trend comparison
    const prevMonthAnalysis = useMemo(() => {
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        if (endIdx <= 0) return null;
        const prevMonth = AVAILABLE_MONTHS[endIdx - 1];
        return calculateRangeAnalysisFromData(waterMeters, prevMonth, prevMonth);
    }, [waterMeters, endMonth]);

    // Generate stats for Overview using StatsGrid format with trends
    const overviewStats = useMemo(() => {
        const a1Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A1, prevMonthAnalysis.A1) : { trend: 'neutral' as const, trendValue: '—' };
        const a2Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A2, prevMonthAnalysis.A2) : { trend: 'neutral' as const, trendValue: '—' };
        const a3Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A3Individual, prevMonthAnalysis.A3Individual) : { trend: 'neutral' as const, trendValue: '—' };
        const effTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.efficiency, prevMonthAnalysis.efficiency) : { trend: 'neutral' as const, trendValue: '—' };

        return [
            {
                label: "A1 - MAIN SOURCE",
                value: `${(rangeAnalysis.A1 / 1000).toFixed(1)}k m³`,
                subtitle: "L1 (Main source input)",
                icon: Droplets,
                variant: "default" as const,
                trend: a1Trend.trend,
                trendValue: a1Trend.trendValue
            },
            {
                label: "A2 - ZONE DISTRIBUTION",
                value: `${(rangeAnalysis.A2 / 1000).toFixed(1)}k m³`,
                subtitle: "L2 Bulks + DC",
                icon: ChevronsRight,
                variant: "secondary" as const,
                trend: a2Trend.trend,
                trendValue: a2Trend.trendValue
            },
            {
                label: "A3 - INDIVIDUAL",
                value: `${(rangeAnalysis.A3Individual / 1000).toFixed(1)}k m³`,
                subtitle: "Villas + Apts + DC",
                icon: Users,
                variant: "primary" as const,
                trend: a3Trend.trend,
                trendValue: a3Trend.trendValue
            },
            {
                label: "SYSTEM EFFICIENCY",
                value: `${rangeAnalysis.efficiency}%`,
                subtitle: "A3 / A1 Ratio",
                icon: ArrowRightLeft,
                variant: "success" as const,
                trend: effTrend.trend,
                trendValue: effTrend.trendValue
            }
        ];
    }, [rangeAnalysis, prevMonthAnalysis]);

    const lossStats = useMemo(() => {
        const s1LossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.stage1Loss, prevMonthAnalysis.stage1Loss) : { trend: 'neutral' as const, trendValue: '—' };
        const s2LossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.stage2Loss, prevMonthAnalysis.stage2Loss) : { trend: 'neutral' as const, trendValue: '—' };
        const totalLossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.totalLoss, prevMonthAnalysis.totalLoss) : { trend: 'neutral' as const, trendValue: '—' };

        return [
            {
                label: "STAGE 1 LOSS",
                value: `${rangeAnalysis.stage1Loss.toLocaleString('en-US')} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A1 > 0 ? ((rangeAnalysis.stage1Loss / rangeAnalysis.A1) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "danger" as const,
                trend: s1LossTrend.trend,
                trendValue: s1LossTrend.trendValue
            },
            {
                label: "STAGE 2 LOSS",
                value: `${rangeAnalysis.stage2Loss.toLocaleString('en-US')} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A2 > 0 ? ((rangeAnalysis.stage2Loss / rangeAnalysis.A2) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "warning" as const,
                trend: s2LossTrend.trend,
                trendValue: s2LossTrend.trendValue
            },
            {
                label: "TOTAL SYSTEM LOSS",
                value: `${rangeAnalysis.totalLoss.toLocaleString('en-US')} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.lossPercentage}%`,
                icon: AlertTriangle,
                variant: "danger" as const,
                trend: totalLossTrend.trend,
                trendValue: totalLossTrend.trendValue
            },
            {
                label: "HIGHEST CONSUMER",
                value: highestConsumer.meter.label,
                subtitle: `${highestConsumer.total.toLocaleString('en-US')} m³`,
                icon: TrendingUp,
                variant: "warning" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            }
        ];
    }, [rangeAnalysis, highestConsumer, prevMonthAnalysis]);

    if (isLoading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-300">
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
                {/* Stats skeleton */}
                <StatsGridSkeleton />
                <StatsGridSkeleton />
                {/* Chart skeleton */}
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
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${dataSource === 'supabase' ? 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success-hover' : 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning'}`}>
                        {dataSource === 'supabase' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {dataSource === 'supabase' ? 'Live Data (Supabase)' : 'Demo Data (Local)'}
                    </div>
                </div>
            </div>

            {/* View Switching Tabs - Custom for this page as it switches modes */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setDashboardView('monthly')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${dashboardView === 'monthly'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Monthly Dashboard
                </button>

                <button
                    onClick={() => setDashboardView('hierarchy')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${dashboardView === 'hierarchy'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                >
                    <Network className="w-4 h-4" />
                    Water Hierarchy
                </button>

                <button
                    onClick={() => setDashboardView('daily')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${dashboardView === 'daily'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    Daily Report
                </button>
            </div>

            {/* Monthly Dashboard View */}
            {dashboardView === 'monthly' && (
                <div className="space-y-6 animate-in fade-in duration-300">

                    <TabNavigation
                        activeTab={monthlyTab}
                        onTabChange={setMonthlyTab}
                        tabs={[
                            { key: 'overview', label: 'Overview', icon: BarChart3 },
                            { key: 'zone', label: 'Zone Analysis', icon: TestTube2 },
                            { key: 'consumption', label: 'Consumption by Type', icon: Activity },
                            { key: 'database', label: 'Main Database', icon: Database },
                        ]}
                    />

                    {/* Date Range Picker */}
                    <Card className="glass-card">
                        <CardContent className="p-4 sm:p-5 md:p-6">
                            <DateRangePicker
                                startMonth={startMonth}
                                endMonth={endMonth}
                                availableMonths={AVAILABLE_MONTHS}
                                onRangeChange={handleRangeChange}
                                onReset={handleResetRange}
                            />
                        </CardContent>
                    </Card>

                    {/* Overview Tab */}
                    {monthlyTab === 'overview' && (
                        <div className="space-y-6">
                            <StatsGrid stats={overviewStats} />
                            <StatsGrid stats={lossStats} />

                            {/* A-Values Distribution Chart */}
                            <Card className="glass-card">
                                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Water System A-Values Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradA1" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4E4456" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#4E4456" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradA2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="A1 - Main Source" dataKey="A1" stroke="#4E4456" fill="url(#gradA1)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                                <Area type="monotone" name="A2 - Zone Distribution" dataKey="A2" stroke="#81D8D0" fill="url(#gradA2)" strokeWidth={3} animationDuration={1500} />
                                                <Area type="monotone" name="A3 - Individual" dataKey="A3Individual" stroke="#6B5F73" fill="none" strokeWidth={2} strokeDasharray="5 5" animationDuration={1500} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Water Loss Analysis Chart */}
                            <Card className="glass-card">
                                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Water Loss Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradLoss" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#C95D63" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#C95D63" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="Total Loss" dataKey="totalLoss" stroke="#C95D63" fill="url(#gradLoss)" strokeWidth={2} strokeDasharray="5 5" animationDuration={1500} />
                                                <Line type="monotone" name="Stage 1 Loss" dataKey="stage1Loss" stroke="#E8A838" strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={1500} />
                                                <Line type="monotone" name="Stage 2 Loss" dataKey="stage2Loss" stroke="#6B5F73" strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={1500} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Zone Analysis Tab */}
                    {monthlyTab === 'zone' && (
                        <div className="space-y-6">
                            {/* Month/Zone Selectors */}
                            <Card className="glass-card">
                                <CardContent className="p-4 sm:p-5 md:p-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Select Month</span>
                                            <select
                                                value={endMonth}
                                                onChange={(e) => setEndMonth(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                {AVAILABLE_MONTHS.map((m) => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Zone</span>
                                            <select
                                                value={selectedZone}
                                                onChange={(e) => setSelectedZone(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                {ZONE_CONFIG.map((z) => (
                                                    <option key={z.code} value={z.code}>{z.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={() => { setEndMonth('Oct-25'); setSelectedZone('Zone_01_(FM)'); }}
                                            className="ml-auto"
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Zone Heading */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    {ZONE_CONFIG.find(z => z.code === selectedZone)?.name} Analysis for {endMonth}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <span className="text-mb-secondary font-medium">Zone Bulk</span> = L2 only •
                                    <span className="text-mb-primary font-medium"> L3/L4 total</span> = L3 + L4 (metered) •
                                    <span className="text-mb-danger font-medium"> Difference</span> = L2 - (L3 + L4)
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                                <LiquidProgressRing
                                    value={zoneAnalysis.bulkMeterReading}
                                    max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                                    label="Zone Bulk Meter Total"
                                    sublabel="Total water entering zone"
                                    color="#81D8D0"
                                    size={160}
                                    showPercentage={false}
                                    elementId="gauge-1"
                                />
                                <LiquidProgressRing
                                    value={zoneAnalysis.individualTotal}
                                    max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                                    label="Individual Meters Sum"
                                    sublabel="Recorded by individual meters"
                                    color="#4E4456"
                                    size={160}
                                    showPercentage={false}
                                    elementId="gauge-2"
                                />
                                <LiquidProgressRing
                                    value={Math.abs(zoneAnalysis.loss)}
                                    max={zoneAnalysis.bulkMeterReading || 100}
                                    label="Water Loss Distribution"
                                    sublabel="Leakage, meter loss, etc."
                                    color={zoneAnalysis.loss > 0 ? '#C95D63' : '#5BA88B'}
                                    size={160}
                                    showPercentage={true}
                                    elementId="gauge-3"
                                />
                            </div>

                            {/* Zone Consumption Trend Chart */}
                            <Card className="glass-card">
                                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Zone Consumption Trend</CardTitle>
                                    <p className="text-xs sm:text-sm text-slate-500">Monthly comparison of L2 (Bulk) vs L3 + L4 totals</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={(() => {
                                                // Calculate zone-specific monthly trends
                                                return AVAILABLE_MONTHS.map(month => {
                                                    const analysis = calculateZoneAnalysisFromData(waterMeters, selectedZone, month);
                                                    return {
                                                        month,
                                                        'Zone Bulk': analysis.bulkMeterReading,
                                                        'Individual Total': analysis.individualTotal,
                                                        'Loss': Math.abs(analysis.loss)
                                                    };
                                                });
                                            })()}>
                                                <defs>
                                                    <linearGradient id="gradZoneBulk" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradIndividual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4E4456" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#4E4456" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                                                <YAxis className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="Individual Total" dataKey="Individual Total" stroke="#4E4456" fill="url(#gradIndividual)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                                <Line type="monotone" name="Loss" dataKey="Loss" stroke="#C95D63" strokeWidth={2} dot={false} strokeDasharray="5 5" animationDuration={1500} />
                                                <Area type="monotone" name="Zone Bulk" dataKey="Zone Bulk" stroke="#81D8D0" fill="url(#gradZoneBulk)" strokeWidth={3} animationDuration={1500} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Individual Meters Table */}
                            <Card className="glass-card">
                                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-base sm:text-lg">Individual Meters - Zone {ZONE_CONFIG.find(z => z.code === selectedZone)?.name}</CardTitle>
                                            <p className="text-xs sm:text-sm text-slate-500">All individual meters (L3 Villas + L4 Building Apts) in this zone</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <MeterTable
                                        meters={waterMeters.filter(m => m.zone === selectedZone && (m.level === 'L3' || m.level === 'L4'))}
                                        months={AVAILABLE_MONTHS}
                                        pageSize={10}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Consumption by Type Tab */}
                    {monthlyTab === 'consumption' && (
                        <div className="space-y-6">
                            {/* Type Filter Pills */}
                            <TypeFilterPills
                                types={uniqueTypes}
                                selectedType={selectedType}
                                onTypeChange={setSelectedType}
                            />

                            {/* Summary Stats */}
                            <StatsGrid stats={[
                                {
                                    label: "TOTAL CONSUMPTION",
                                    value: `${totalConsumption.toLocaleString('en-US')} m³`,
                                    subtitle: "Selected range",
                                    icon: Droplets,
                                    variant: "success"
                                },
                                {
                                    label: "METER COUNT",
                                    value: filteredMeters.length.toString(),
                                    subtitle: `Type: ${selectedType}`,
                                    icon: Gauge,
                                    variant: "water"
                                },
                                {
                                    label: "HIGHEST CONSUMER",
                                    value: highestConsumer.meter.label,
                                    subtitle: `${highestConsumer.total.toLocaleString('en-US')} m³`,
                                    icon: TrendingUp,
                                    variant: "primary"
                                },
                                {
                                    label: "ACTIVE TYPES",
                                    value: (uniqueTypes.length - 1).toString(),
                                    subtitle: "Across range",
                                    icon: Database,
                                    variant: "warning"
                                }
                            ]} />

                            {/* Consumption by Type Chart */}
                            <Card className="glass-card">
                                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Consumption by Type (m³)</CardTitle>
                                    <p className="text-xs sm:text-sm text-slate-500">Aggregated for {startMonth} - {endMonth}</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={consumptionChartData} layout="vertical" margin={{ left: 120 }}>
                                                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'm³', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                                <YAxis type="category" dataKey="type" width={110} className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                                    {consumptionChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS] || '#6B7280'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Database Tab */}
                    {monthlyTab === 'database' && (
                        <Card className="glass-card">
                            <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                                <CardTitle className="text-base sm:text-lg">Full Meter Database</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                <MeterTable
                                    meters={waterMeters}
                                    months={AVAILABLE_MONTHS}
                                    pageSize={15}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Other Dashboard Views */}


            {dashboardView === 'hierarchy' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <WaterNetworkHierarchy />
                </div>
            )}

            {/* Daily Dashboard View */}
            {dashboardView === 'daily' && (
                <DailyWaterDashboard />
            )}
        </div>
    );
}

// ============================================
// Daily Water Dashboard Component (Integrated)
// ============================================

// Types for transformed daily data structure
interface DailyDataStructure {
    date: string;
    l1_total: number;
    zones: Array<{
        name: string;
        fullName: string;
        l2_bulk: number;
        alert: boolean;
        l3_meters: Array<{
            name: string;
            type: string;
            consumption: number;
            l4_children?: Array<{ name: string; consumption: number }>;
        }>;
    }>;
    directConnections: Array<{ name: string; consumption: number }>;
}

// Zone name mapping for display
const ZONE_NAME_MAP: Record<string, string> = {
    'Zone_05': 'ZONE 5 (Bulk Zone 5)',
    'Zone_03_(A)': 'ZONE 3A (Bulk Zone 3A)',
    'Zone_03_(B)': 'ZONE 3B (Bulk Zone 3B)',
    'Zone_08': 'ZONE 8 (Bulk Zone 8)',
    'Zone_01_(FM)': 'ZONE FM (Bulk Zone FM)',
    'Zone_VS': 'Village Square',
    'Zone_SC': 'Sports Club',
};

// Transform flat Supabase data to nested daily structure
function transformToNestedDailyData(
    meters: DailyWaterConsumption[],
    day: number,
    year: number = 2026,
    month: string = 'Jan'
): DailyDataStructure {
    const dayKey = day;

    // Find L2 zone bulk meters (type = 'Zone Bulk' or label = 'L2')
    const l2Meters = meters.filter(m => m.type === 'Zone Bulk' || m.label === 'L2');

    // Find L3 meters (building bulks, villas, retail, irrigation within zones)
    const l3Meters = meters.filter(m =>
        (m.label === 'L3' ||
        m.type === 'D_Building_Bulk' ||
        m.type === 'Residential (Villa)' ||
        m.type === 'Retail' ||
        m.type === 'IRR_Servies' ||
        m.type === 'MB_Common' ||
        m.type === 'Building') &&
        m.zone !== 'Direct Connection'
    );

    // Find L4 meters (apartments and building common areas)
    const l4Meters = meters.filter(m =>
        m.type === 'Residential (Apart)' ||
        m.type === 'D_Building_Common' ||
        m.label === 'L4'
    );

    // Find direct connections (zone = 'Direct Connection' or label = 'DC')
    const directMeters = meters.filter(m => m.zone === 'Direct Connection' || m.label === 'DC');

    // Calculate L1 total as sum of all L2 (zone bulks) + direct connections
    const l2Total = l2Meters.reduce((sum, m) => sum + (m.dailyReadings[dayKey] ?? 0), 0);
    const dcTotal = directMeters.reduce((sum, m) => sum + (m.dailyReadings[dayKey] ?? 0), 0);
    const l1Total = l2Total + dcTotal;

    // Group by zones
    const zoneMap = new Map<string, {
        name: string;
        fullName: string;
        l2_bulk: number;
        l3_meters: Array<{
            name: string;
            type: string;
            consumption: number;
            l4_children?: Array<{ name: string; consumption: number }>;
        }>;
    }>();

    // Process L2 meters to create zone entries
    l2Meters.forEach(l2 => {
        const zoneName = l2.zone || 'Unknown';
        if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
                name: zoneName,
                fullName: ZONE_NAME_MAP[zoneName] || l2.meterName || zoneName,
                l2_bulk: l2.dailyReadings[dayKey] ?? 0,
                l3_meters: [],
            });
        } else {
            const zone = zoneMap.get(zoneName)!;
            zone.l2_bulk += l2.dailyReadings[dayKey] ?? 0;
        }
    });

    // Add L3 meters to their zones
    l3Meters.forEach(l3 => {
        const zoneName = l3.zone || 'Unknown';
        if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
                name: zoneName,
                fullName: ZONE_NAME_MAP[zoneName] || zoneName,
                l2_bulk: 0,
                l3_meters: [],
            });
        }

        const zone = zoneMap.get(zoneName)!;

        // Determine display type
        let displayType = l3.type || 'Unknown';
        if (displayType === 'Residential (Villa)') displayType = 'Villa';
        if (displayType === 'D_Building_Bulk') displayType = 'Building';
        if (displayType === 'IRR_Servies') displayType = 'IRR';

        const meterEntry: {
            name: string;
            type: string;
            consumption: number;
            l4_children?: Array<{ name: string; consumption: number }>;
        } = {
            name: l3.meterName || l3.label || 'Unknown',
            type: displayType,
            consumption: l3.dailyReadings[dayKey] ?? 0,
        };

        // Find L4 children for building bulk meters
        if (l3.type === 'D_Building_Bulk') {
            const children = l4Meters.filter(l4 =>
                l4.parentMeter === l3.meterName ||
                l4.parentMeter?.includes(l3.meterName.replace(' Building Bulk Meter', ''))
            );
            if (children.length > 0) {
                meterEntry.l4_children = children.map(child => ({
                    name: child.meterName || child.label || 'Unknown',
                    consumption: child.dailyReadings[dayKey] ?? 0,
                }));
            }
        }

        zone.l3_meters.push(meterEntry);
    });

    // Convert to array and calculate alert status
    const zones = Array.from(zoneMap.values()).map(zone => {
        const l3Total = zone.l3_meters.reduce((sum, m) => sum + m.consumption, 0);
        const lossPercent = zone.l2_bulk > 0 ? ((zone.l2_bulk - l3Total) / zone.l2_bulk) * 100 : 0;
        return {
            ...zone,
            alert: lossPercent > 50,
        };
    });

    // Sort zones by name
    zones.sort((a, b) => a.name.localeCompare(b.name));

    // Process direct connections
    const directConnections = directMeters.map(dc => ({
        name: dc.meterName || dc.label || 'Unknown',
        consumption: dc.dailyReadings[dayKey] ?? 0,
    }));

    return {
        date: `${year}-${month === 'Jan' ? '01' : '01'}-${day.toString().padStart(2, '0')}`,
        l1_total: l1Total,
        zones,
        directConnections,
    };
}

// --- Helper: Number Formatter ---
const fmt = (n: number | string | undefined | null) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// --- Component: Radial Gauge ---
const MetricGauge = ({ value, max, label, subLabel, color, icon: Icon }: {
    value: number;
    max: number;
    label: string;
    subLabel: string;
    color: string;
    icon?: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
}) => {
    const radius = 30;
    const stroke = 5;
    const circumference = 2 * Math.PI * radius;
    const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl relative overflow-hidden h-full shadow-sm">
            {Icon && <Icon className="absolute -right-2 -bottom-2 opacity-5" size={40} style={{ color }} />}

            <div className="relative flex items-center justify-center mb-1">
                <svg height={radius * 2 + stroke * 2} width={radius * 2 + stroke * 2} className="rotate-[-90deg]">
                    <circle
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={radius}
                        cx={radius + stroke}
                        cy={radius + stroke}
                        className="text-slate-400 dark:text-slate-600"
                    />
                    <circle
                        stroke={color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={radius + stroke}
                        cy={radius + stroke}
                    />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                    <span className="text-sm font-bold" style={{ color }}>
                        {typeof value === 'number' ? fmt(value) : value}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">{subLabel}</span>
                </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground z-10">{label}</span>
        </div>
    );
};

// Brand colors - matching Electricity section
const DAILY_BRAND = {
    primary: '#E8A838',      // Amber (main accent like Electricity)
    secondary: '#81D8D0',    // Teal
    tertiary: '#5BA88B',     // Success green
    purple: '#4E4456',       // Brand purple
    lossRed: '#C95D63',      // Danger red
    warningOrange: '#F59E0B', // Warning
    successGreen: '#5BA88B',  // Success
    lightAmber: '#FBBF24',   // Light amber for gradients
};

function DailyWaterDashboard() {
    const [selectedDay, setSelectedDay] = useState('1');
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
    const [dailyData, setDailyData] = useState<DailyWaterConsumption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch daily water consumption from Supabase
    useEffect(() => {
        async function fetchDailyData() {
            setIsLoading(true);
            try {
                if (isSupabaseConfigured()) {
                    const data = await getDailyWaterConsumptionFromSupabase('Jan-26', 2026);
                    setDailyData(data);
                }
            } catch (error) {
                console.error('Error fetching daily water data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDailyData();
    }, []);

    // Generate days 1-31
    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => (i + 1).toString()), []);

    // Transform Supabase data to nested structure for selected day
    const sampleData = useMemo(() => {
        if (dailyData.length === 0) {
            // Return empty structure if no data
            return {
                date: `2026-01-${selectedDay.padStart(2, '0')}`,
                l1_total: 0,
                zones: [],
                directConnections: [],
            };
        }
        return transformToNestedDailyData(dailyData, parseInt(selectedDay), 2026, 'Jan');
    }, [dailyData, selectedDay]);

    const calculateLosses = () => {
        const zonesArr = sampleData?.zones || [];
        const directArr = sampleData?.directConnections || [];
        const totalZoneBulks = zonesArr.reduce((sum, z) => sum + Number(z?.l2_bulk || 0), 0);
        const totalDirect = directArr.reduce((sum, d) => sum + Number(d?.consumption || 0), 0);
        const l1 = Number(sampleData?.l1_total || 0);
        const l1ToL2Loss = l1 - (totalZoneBulks + totalDirect);
        const l1ToL2LossPercent = l1 > 0 ? ((l1ToL2Loss / l1) * 100).toFixed(1) : '0.0';
        return { l1ToL2Loss, l1ToL2LossPercent, totalZoneBulks, totalDirect };
    };

    const calculateZoneLoss = (zone: typeof sampleData.zones[0]) => {
        const l3Total = (zone?.l3_meters || []).reduce((sum, m) => sum + Number(m?.consumption || 0), 0);
        const bulk = Number(zone?.l2_bulk || 0);
        const loss = bulk - l3Total;
        const lossPercent = bulk > 0 ? ((loss / bulk) * 100).toFixed(1) : '0.0';
        return { loss, lossPercent, l3Total };
    };

    const calculateBuildingLoss = (building: typeof sampleData.zones[0]['l3_meters'][0]) => {
        if (!building?.l4_children || building.l4_children.length === 0) return null;
        const l4Total = building.l4_children.reduce((sum, apt) => sum + Number(apt?.consumption || 0), 0);
        const b = Number(building?.consumption || 0);
        const loss = b - l4Total;
        const lossPercent = b > 0 ? ((loss / b) * 100).toFixed(1) : '0.0';
        return { loss, lossPercent, l4Total };
    };

    const losses = calculateLosses();

    const zoneChartData = (sampleData?.zones || []).map((zone) => {
        const zoneLoss = calculateZoneLoss(zone);
        return {
            name: zone.name.replace('Zone_', 'Z').replace('_(', ' ('),
            bulk: Number(zone?.l2_bulk || 0),
            metered: zoneLoss.l3Total,
            loss: zoneLoss.loss > 0 ? zoneLoss.loss : 0,
        };
    });

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ fill: string; name: string; value: number }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                    <p className="font-semibold mb-2 text-popover-foreground">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.fill }}>
                            {entry.name}: <span className="font-bold">{fmt(entry.value)} m³</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                            <span className="text-muted-foreground">Loading daily water consumption data...</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Day Selector */}
            <Card className="glass-card">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Daily Water Consumption</h3>
                            <p className="text-sm text-muted-foreground">Analysis for {sampleData?.date || 'Selected Day'}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg">
                            <span className="text-xs font-medium text-muted-foreground">Select Day:</span>
                            <select
                                value={selectedDay}
                                onChange={(e) => { setSelectedDay(e.target.value); setSelectedZone(null); setSelectedBuilding(null); }}
                                className="bg-background text-sm font-semibold outline-none cursor-pointer px-3 py-1.5 rounded-md border border-border text-foreground"
                            >
                                {days.map((d) => (<option key={d} value={d}>Jan {d}, 2026</option>))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards - Electricity-style amber/teal colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card border-l-4" style={{ borderLeftColor: DAILY_BRAND.primary }}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg">
                                <Gauge className="text-amber-600 dark:text-amber-400" size={22} />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-foreground">{fmt(losses.totalZoneBulks)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">m³</div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground">Zone Bulks Total</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-secondary/20 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${Math.min((losses.totalZoneBulks / (sampleData?.l1_total || 1)) * 100, 100)}%`, backgroundColor: DAILY_BRAND.primary }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{((losses.totalZoneBulks / (sampleData?.l1_total || 1)) * 100).toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-l-4" style={{ borderLeftColor: DAILY_BRAND.secondary }}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-teal-50 dark:bg-teal-900/20 p-2.5 rounded-lg">
                                <Building2 className="text-teal-600 dark:text-teal-400" size={22} />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-foreground">{fmt(losses.totalDirect)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">m³</div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground">Direct Connections</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-secondary/20 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${Math.min((losses.totalDirect / (sampleData?.l1_total || 1)) * 100, 100)}%`, backgroundColor: DAILY_BRAND.secondary }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{((losses.totalDirect / (sampleData?.l1_total || 1)) * 100).toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`glass-card border-l-4 ${parseFloat(losses.l1ToL2LossPercent) > 10 ? 'bg-red-50/10' : ''}`} style={{ borderLeftColor: parseFloat(losses.l1ToL2LossPercent) > 10 ? DAILY_BRAND.lossRed : DAILY_BRAND.warningOrange }}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-lg ${parseFloat(losses.l1ToL2LossPercent) > 10 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
                                <TrendingDown className={parseFloat(losses.l1ToL2LossPercent) > 10 ? 'text-red-600' : 'text-orange-600'} size={22} />
                            </div>
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${parseFloat(losses.l1ToL2LossPercent) > 10 ? 'text-red-600' : 'text-orange-600'}`}>{fmt(losses.l1ToL2Loss)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">m³</div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground">Network Loss (L1→L2)</div>
                        <div className="flex items-center gap-2 mt-2">
                            <AlertCircle size={14} className={parseFloat(losses.l1ToL2LossPercent) > 10 ? 'text-red-500' : 'text-orange-500'} />
                            <span className={`text-sm font-semibold ${parseFloat(losses.l1ToL2LossPercent) > 10 ? 'text-red-600' : 'text-orange-600'}`}>{losses.l1ToL2LossPercent}% variance</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-l-4 relative overflow-hidden" style={{ borderLeftColor: DAILY_BRAND.tertiary, backgroundColor: DAILY_BRAND.tertiary }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white opacity-10 rounded-full" />
                    <CardContent className="p-5 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-white/20 p-2.5 rounded-lg"><Layers className="text-white" size={22} /></div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{(((losses.totalZoneBulks + losses.totalDirect) / (sampleData?.l1_total || 1)) * 100).toFixed(1)}</div>
                                <div className="text-xs text-white/80 mt-0.5">%</div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-white">Water Accountability</div>
                        <div className="text-xs text-white/80 mt-2">{fmt(losses.totalZoneBulks + losses.totalDirect)} m³ accounted</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader className="glass-card-header pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Gauge size={18} className="text-amber-500" /> Zone Performance
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Bulk vs Metered (L2→L3)</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={zoneChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="bulk" fill={DAILY_BRAND.primary} name="Zone Bulk" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="metered" fill={DAILY_BRAND.secondary} name="Metered" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="loss" fill={DAILY_BRAND.lossRed} name="Loss" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="glass-card-header pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" /> Loss Analysis by Zone
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Bulk - Metered = Unaccounted</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(sampleData?.zones || []).map((zone, idx) => {
                            const zoneLoss = calculateZoneLoss(zone);
                            const lossPercent = parseFloat(zoneLoss.lossPercent);
                            const isHigh = lossPercent > 50;
                            const isMed = lossPercent > 20 && lossPercent <= 50;
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-20 text-xs font-medium text-muted-foreground truncate">{zone.name.replace('Zone_', '').replace('_(', ' (')}</div>
                                    <div className="flex-1 bg-secondary/20 rounded-full h-3 relative overflow-hidden">
                                        <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(lossPercent, 100)}%`, backgroundColor: isHigh ? DAILY_BRAND.lossRed : isMed ? DAILY_BRAND.warningOrange : DAILY_BRAND.successGreen }} />
                                    </div>
                                    <div className={`w-12 text-right text-xs font-bold ${isHigh ? 'text-red-600' : isMed ? 'text-orange-600' : 'text-green-600'}`}>{zoneLoss.lossPercent}%</div>
                                    <div className="w-16 text-right text-xs text-muted-foreground">{fmt(zoneLoss.loss)} m³</div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Zone Section */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-amber-500" />
                    Zone Details & Loss Analysis
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {(sampleData?.zones || []).map((zone, idx) => {
                        const zoneLoss = calculateZoneLoss(zone);
                        const isHighLoss = parseFloat(zoneLoss.lossPercent) > 50;
                        const isMedLoss = parseFloat(zoneLoss.lossPercent) > 20;
                        const isExpanded = selectedZone === zone.name;

                        return (
                            <Card key={idx} className={`glass-card transition-all duration-300 ${isExpanded ? 'ring-2 ring-amber-400' : ''} ${zone.alert ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                <div className="p-5 cursor-pointer" onClick={() => { setSelectedZone(isExpanded ? null : zone.name); setSelectedBuilding(null); }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${zone.alert ? 'bg-red-100 text-red-600' : 'bg-secondary/20 text-muted-foreground'}`}>
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                                                    {zone.fullName || zone.name}
                                                    {zone.alert && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} />HIGH LOSS</span>}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">{(zone.l3_meters || []).length} meters at Level 3</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold" style={{ color: DAILY_BRAND.primary }}>{fmt(zone.l2_bulk)}</div>
                                            <div className="text-xs text-muted-foreground">m³ bulk</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <MetricGauge value={zone.l2_bulk} max={zone.l2_bulk * 1.2} label="Zone Bulk" subLabel="m³" color={DAILY_BRAND.primary} icon={Gauge} />
                                        <MetricGauge value={zoneLoss.l3Total} max={zone.l2_bulk} label="Total Indiv." subLabel="m³" color={DAILY_BRAND.secondary} icon={Building2} />
                                        <MetricGauge value={zoneLoss.loss} max={zone.l2_bulk} label="Loss" subLabel={`${zoneLoss.lossPercent}%`} color={isHighLoss ? DAILY_BRAND.lossRed : isMedLoss ? DAILY_BRAND.warningOrange : DAILY_BRAND.successGreen} icon={AlertCircle} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border bg-muted/30 p-4 animate-in fade-in slide-in-from-top-2">
                                        <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                            <Layers size={14} className="text-amber-500" />
                                            Level 3 Meters ({(zone.l3_meters || []).length})
                                        </h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                            {(zone.l3_meters || []).map((meter, mIdx) => {
                                                const buildingLoss = calculateBuildingLoss(meter);
                                                const hasChildren = !!(meter.l4_children && meter.l4_children.length > 0);
                                                const isBuildingExpanded = selectedBuilding === meter.name;

                                                return (
                                                    <div key={mIdx} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-sm transition-all">
                                                        <div className={`p-3 ${hasChildren ? 'cursor-pointer hover:bg-muted/50' : ''}`} onClick={(e) => { e.stopPropagation(); if (hasChildren) setSelectedBuilding(isBuildingExpanded ? null : meter.name); }}>
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    {hasChildren ? (
                                                                        <div className="text-muted-foreground">
                                                                            {isBuildingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                        </div>
                                                                    ) : meter.type === 'Villa' ? <Home size={16} className="text-muted-foreground/50" /> : <MapPin size={16} className="text-muted-foreground/50" />}
                                                                    <div>
                                                                        <span className="font-medium text-sm text-foreground block">{meter.name}</span>
                                                                        {buildingLoss && <span className="text-[10px] text-muted-foreground">{meter.l4_children?.length} apts</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-sm text-foreground">{fmt(meter.consumption)}</span>
                                                                    <span className="text-muted-foreground text-[10px] ml-1">m³</span>
                                                                    {buildingLoss && <div className={`text-[10px] font-semibold ${parseFloat(buildingLoss.lossPercent) > 30 ? 'text-red-600' : 'text-orange-600'}`}>{buildingLoss.lossPercent}% loss</div>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {hasChildren && isBuildingExpanded && (
                                                            <div className="bg-muted/50 border-t border-border p-3 space-y-2">
                                                                {meter.l4_children?.map((apt, aIdx) => (
                                                                    <div key={aIdx} className="flex justify-between items-center py-1.5 px-3 bg-background rounded border border-border/50 text-xs">
                                                                        <span className="text-muted-foreground flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                            {apt.name}
                                                                        </span>
                                                                        <span className="font-semibold text-foreground">{fmt(apt.consumption)} m³</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
