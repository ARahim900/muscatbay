"use client";
import { cn } from "@/lib/utils";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { getWaterMetersFromSupabase, getWaterLossDailyFromSupabase, getDailyWaterConsumptionFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { WaterLossDaily, DailyWaterConsumption } from "@/entities/water";
import { networkData, NetworkNode } from "@/lib/water-network-data";
import { buildDailyHierarchy, DailyMeterNode } from "@/lib/water-daily-hierarchy";

// Components
import { DateRangePicker } from "@/components/water/date-range-picker";
import { TypeFilterPills } from "@/components/water/type-filter-pills";
import { LiquidProgressRing } from "../../components/charts/liquid-progress-ring";
import { WaterLossGauge } from "@/components/water/water-loss-gauge";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { MeterTable } from "@/components/water/meter-table";
import { WaterNetworkHierarchy } from "@/components/water/network-hierarchy";
import { DailyWaterReport } from "@/components/water/DailyWaterReport";
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
        const a1Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A1, prevMonthAnalysis.A1) : { trend: 'neutral' as const, trendValue: 'â€”' };
        const a2Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A2, prevMonthAnalysis.A2) : { trend: 'neutral' as const, trendValue: 'â€”' };
        const a3Trend = prevMonthAnalysis ? calcTrend(rangeAnalysis.A3Individual, prevMonthAnalysis.A3Individual) : { trend: 'neutral' as const, trendValue: 'â€”' };
        const effTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.efficiency, prevMonthAnalysis.efficiency) : { trend: 'neutral' as const, trendValue: 'â€”' };

        return [
            {
                label: "A1 - MAIN SOURCE",
                value: `${(rangeAnalysis.A1 / 1000).toFixed(1)}k mÂ³`,
                subtitle: "L1 (Main source input)",
                icon: Droplets,
                variant: "default" as const,
                trend: a1Trend.trend,
                trendValue: a1Trend.trendValue
            },
            {
                label: "A2 - ZONE DISTRIBUTION",
                value: `${(rangeAnalysis.A2 / 1000).toFixed(1)}k mÂ³`,
                subtitle: "L2 Bulks + DC",
                icon: ChevronsRight,
                variant: "secondary" as const,
                trend: a2Trend.trend,
                trendValue: a2Trend.trendValue
            },
            {
                label: "A3 - INDIVIDUAL",
                value: `${(rangeAnalysis.A3Individual / 1000).toFixed(1)}k mÂ³`,
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
        const s1LossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.stage1Loss, prevMonthAnalysis.stage1Loss) : { trend: 'neutral' as const, trendValue: 'â€”' };
        const s2LossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.stage2Loss, prevMonthAnalysis.stage2Loss) : { trend: 'neutral' as const, trendValue: 'â€”' };
        const totalLossTrend = prevMonthAnalysis ? calcTrend(rangeAnalysis.totalLoss, prevMonthAnalysis.totalLoss) : { trend: 'neutral' as const, trendValue: 'â€”' };

        return [
            {
                label: "STAGE 1 LOSS",
                value: `${rangeAnalysis.stage1Loss.toLocaleString('en-US')} mÂ³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A1 > 0 ? ((rangeAnalysis.stage1Loss / rangeAnalysis.A1) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "danger" as const,
                trend: s1LossTrend.trend,
                trendValue: s1LossTrend.trendValue
            },
            {
                label: "STAGE 2 LOSS",
                value: `${rangeAnalysis.stage2Loss.toLocaleString('en-US')} mÂ³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A2 > 0 ? ((rangeAnalysis.stage2Loss / rangeAnalysis.A2) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "warning" as const,
                trend: s2LossTrend.trend,
                trendValue: s2LossTrend.trendValue
            },
            {
                label: "TOTAL SYSTEM LOSS",
                value: `${rangeAnalysis.totalLoss.toLocaleString('en-US')} mÂ³`,
                subtitle: `Loss Rate: ${rangeAnalysis.lossPercentage}%`,
                icon: AlertTriangle,
                variant: "danger" as const,
                trend: totalLossTrend.trend,
                trendValue: totalLossTrend.trendValue
            },
            {
                label: "HIGHEST CONSUMER",
                value: highestConsumer.meter.label,
                subtitle: `${highestConsumer.total.toLocaleString('en-US')} mÂ³`,
                icon: TrendingUp,
                variant: "warning" as const,
                trend: 'neutral' as const,
                trendValue: 'â€”'
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

            {/* View Switching Tabs */}
            <TabNavigation
                activeTab={dashboardView}
                onTabChange={(key) => setDashboardView(key as 'monthly' | 'hierarchy' | 'daily')}
                variant="secondary"
                tabs={[
                    { key: 'monthly', label: 'Monthly Dashboard', icon: BarChart3 },
                    { key: 'hierarchy', label: 'Water Hierarchy', icon: Network },
                    { key: 'daily', label: 'Daily Report', icon: CalendarDays },
                ]}
            />

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

                    {/* Date Range Picker - hidden on database tab since it uses external Airtable embed */}
                    {monthlyTab !== 'database' && (
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
                    )}

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
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'mÂ³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
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
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'mÂ³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
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
                                    <span className="text-mb-secondary font-medium">Zone Bulk</span> = L2 only â€¢
                                    <span className="text-mb-primary font-medium"> L3/L4 total</span> = L3 + L4 (metered) â€¢
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
                                                <YAxis className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'mÂ³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
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
                                    value: `${totalConsumption.toLocaleString('en-US')} mÂ³`,
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
                                    subtitle: `${highestConsumer.total.toLocaleString('en-US')} mÂ³`,
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
                                    <CardTitle className="text-base sm:text-lg">Consumption by Type (mÂ³)</CardTitle>
                                    <p className="text-xs sm:text-sm text-slate-500">Aggregated for {startMonth} - {endMonth}</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={consumptionChartData} layout="vertical" margin={{ left: 120 }}>
                                                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'mÂ³', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
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
                        <div className="w-full animate-in fade-in duration-300">
                            <iframe
                                className="airtable-embed"
                                src="https://airtable.com/embed/appvmeThHxvhcbgcx/shrwfK2evoJkUEl5Y?viewControls=on"
                                frameBorder="0"
                                width="100%"
                                height="533"
                                style={{ background: 'transparent', border: '1px solid #ccc' }}
                            />
                        </div>
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
                <DailyWaterReport />
            )}
        </div>
    );
}

// ============================================
// Daily Water Dashboard Component (Using water_loss_daily table)
// ============================================

// Zone display name mapping
const ZONE_DISPLAY_NAMES: Record<string, string> = {
    'Zone FM': 'Zone FM (Bulk)',
    'Zone 3A': 'Zone 3A (Bulk)',
    'Zone 3B': 'Zone 3B (Bulk)',
    'Zone 5': 'Zone 5 (Bulk)',
    'Zone 8': 'Zone 8 (Bulk)',
    'Zone 08': 'Zone 8 (Bulk)',
    'Sales Center': 'Sales Center',
    'Village Square': 'Village Square',
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
    const [viewMode, setViewMode] = useState<'hierarchy' | 'zone'>('hierarchy');
    const [selectedDay, setSelectedDay] = useState(1);
    const [dailyLossData, setDailyLossData] = useState<WaterLossDaily[]>([]);
    const [dailyConsumption, setDailyConsumption] = useState<DailyWaterConsumption[]>([]);
    const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Zone Analysis State
    const [selectedTrendZone, setSelectedTrendZone] = useState<string>('Zone 01 (FM)'); // Default
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['C43659', 'DC']));

    const currentYear = 2026;
    const currentMonth = 'Jan-26';

    const hierarchy = useMemo(() => buildDailyHierarchy(), []);

    useEffect(() => {
        async function fetchDailyData() {
            setIsLoading(true);
            setHasError(false);
            try {
                if (isSupabaseConfigured()) {
                    const [lossData, consumptionData, metersData] = await Promise.all([
                        getWaterLossDailyFromSupabase(undefined, currentMonth, currentYear),
                        getDailyWaterConsumptionFromSupabase(currentMonth, currentYear),
                        getWaterMetersFromSupabase()
                    ]);
                    setDailyLossData(lossData);
                    setDailyConsumption(consumptionData);
                    setWaterMeters(metersData);

                    if (lossData.length === 0 && consumptionData.length === 0 && metersData.length === 0) {
                        setHasError(true);
                    }
                } else {
                    setHasError(true);
                }
            } catch (error) {
                console.error('Error fetching daily water data:', error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDailyData();
    }, []);

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    // Helper to get reading/usage
    const getNodeReading = (node: DailyMeterNode, day: number): number => {
        if (node.zone && node.label === 'L2') {
            // Find by Zone Name in Loss Data
            // Map generic zone names if needed, or rely on exact match
            const zoneRecord = dailyLossData.find(d => d.zone === node.zone && d.day === day);
            if (zoneRecord) return zoneRecord.l2TotalM3;
        }
        const reading = dailyConsumption.find(d => d.accountNumber === node.id || d.meterName === node.id);
        if (reading) {
            const val = reading.dailyReadings[day];
            return typeof val === 'number' ? val : 0;
        }
        return 0;
    };

    const getChildrenAggregate = (node: DailyMeterNode, day: number): number => {
        if (!node.children || node.children.length === 0) return 0;
        return node.children.reduce((sum, child) => sum + getNodeReading(child, day), 0);
    };

    // Calculate Gauge Data for a Zone/Node
    const getZoneGaugeData = (node: DailyMeterNode) => {
        const input = getNodeReading(node, selectedDay);
        const childrenSum = getChildrenAggregate(node, selectedDay);
        let loss = 0;
        if (input > 0) loss = input - childrenSum;

        // Efficiency score: (Consumed / Input) * 100
        // Or (Input - Loss) / Input * 100
        let efficiency = 100;
        if (input > 0) {
            efficiency = ((input - Math.max(0, loss)) / input) * 100;
        } else if (loss > 0) {
            efficiency = 0;
        }

        return {
            id: node.id,
            name: node.name,
            input,
            loss,
            efficiency
        };
    };

    // Memoize Gauge Data
    const gaugeData = useMemo(() => {
        const mainBulk = getZoneGaugeData(hierarchy);
        // Get L2 Zones
        const zones = hierarchy.children
            ?.filter(c => c.label === 'L2')
            .map(z => getZoneGaugeData(z)) || [];

        return [mainBulk, ...zones];
    }, [hierarchy, dailyConsumption, dailyLossData, selectedDay]);

    // ---- Zone Trend Analysis Logic ----
    const zoneTrendData = useMemo(() => {
        if (!dailyLossData.length) return [];
        // Filter by selected zone
        // Note: Supabase data 'zone' name (e.g. "Zone 3A") might need normalization to match selectedTrendZone

        const filtered = dailyLossData.filter(d => d.zone === selectedTrendZone).sort((a, b) => a.day - b.day);

        return filtered.map(d => ({
            day: d.day,
            date: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            bulkInput: d.l2TotalM3,
            individualSum: d.l3TotalM3,
            loss: d.lossM3,
            efficiency: d.l2TotalM3 > 0 ? (d.l3TotalM3 / d.l2TotalM3) * 100 : 0
        }));
    }, [dailyLossData, selectedTrendZone]);

    const zoneStats = useMemo(() => {
        if (!zoneTrendData.length) return null;
        const totalBulk = zoneTrendData.reduce((acc, curr) => acc + curr.bulkInput, 0);
        const totalIndiv = zoneTrendData.reduce((acc, curr) => acc + curr.individualSum, 0);
        const totalLoss = zoneTrendData.reduce((acc, curr) => acc + curr.loss, 0);
        const avgEff = totalBulk > 0 ? (totalIndiv / totalBulk) * 100 : 0;

        return { totalBulk, totalIndiv, totalLoss, avgEff };
    }, [zoneTrendData]);

    const availableZones = useMemo(() => {
        // Extract unique zones from dailyLossData
        const zones = new Set(dailyLossData.map(d => d.zone));
        return Array.from(zones).sort();
    }, [dailyLossData]);


    const RecursiveRow = ({ node, depth = 0 }: { node: DailyMeterNode, depth?: number }) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const reading = getNodeReading(node, selectedDay);
        const childrenSum = getChildrenAggregate(node, selectedDay);

        let loss = 0;
        let lossPercent = 0;
        let isHighLoss = false;
        let isMedLoss = false;
        const isReconciliationNode = ['L1', 'L2', 'L3'].includes(node.label) && hasChildren;

        if (isReconciliationNode) {
            loss = reading - childrenSum;
            lossPercent = reading > 0 ? (loss / reading) * 100 : 0;
            isHighLoss = lossPercent > 20;
            isMedLoss = lossPercent > 5 && lossPercent <= 20;
        }

        return (
            <>
                <TableRow className={cn(
                    "transition-all duration-200 border-b border-white/5 hover:bg-white/5",
                    depth === 0 ? "bg-white/5 font-medium" : ""
                )}>
                    <TableCell className="font-medium p-3 w-[280px]">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 p-0 hover:bg-white/10 rounded-md transition-colors text-muted-foreground"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleNode(node.id); }}
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </Button>
                            ) : <div className="w-6" />}

                            <span className={cn(
                                "truncate text-sm tracking-tight",
                                node.label === 'L1' ? "text-primary font-bold" : "text-foreground/90"
                            )} title={node.name}>
                                {node.name}
                            </span>
                        </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground/70">{node.id}</TableCell>

                    <TableCell className="text-center">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-semibold border",
                            node.label === 'L1' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                node.label === 'L2' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    node.label === 'L3' ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" :
                                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                            {node.label}
                        </span>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground/60">{node.zone}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground/60 truncate max-w-[100px]">{node.parent}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-muted-foreground">
                            {node.type}
                        </span>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                        {reading > 0 ? reading.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '-'}
                    </TableCell>

                    <TableCell className="text-center font-mono text-sm">
                        {isReconciliationNode ? (
                            <div className={cn(
                                "inline-flex items-center gap-1 font-medium",
                                loss > 0.1 ? "text-red-400" : "text-emerald-400"
                            )}>
                                {loss > 0.1 ? '+' : ''}{loss.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            </div>
                        ) : '-'}
                    </TableCell>

                    <TableCell className="text-center">
                        {isReconciliationNode ? (
                            <div className={cn(
                                "inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-[10px] font-bold border backdrop-blur-sm shadow-sm transition-all",
                                isHighLoss
                                    ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5"
                                    : isMedLoss
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                {lossPercent.toFixed(1)}%
                            </div>
                        ) : '-'}
                    </TableCell>
                </TableRow>
                {isExpanded && node.children && node.children.map(child => (
                    <RecursiveRow key={child.id} node={child} depth={depth + 1} />
                ))}
            </>
        );
    };

    if (isLoading) {
        return (
            <div className="h-[500px] flex flex-col items-center justify-center gap-4 bg-muted/5 rounded-xl border border-white/5">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Droplets className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">Analyzing daily flow data...</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="p-8 text-center border border-red-500/20 bg-red-500/5 rounded-xl text-red-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                Error loading data. Please check your connection.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
                <div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        Daily Water Analysis
                    </h3>
                    <p className="text-muted-foreground mt-1 ml-9">
                        {currentMonth.replace('-', ' ')} {currentYear}
                    </p>
                </div>

                {/* View Switcher */}
                <div className="flex p-1 bg-muted/20 rounded-lg border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setViewMode('hierarchy')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === 'hierarchy'
                                ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Hierarchy Snapshot
                    </button>
                    <button
                        onClick={() => setViewMode('zone')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === 'zone'
                                ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Zone Trends
                    </button>
                </div>
            </div>

            {/* Content Based on View Mode */}
            {viewMode === 'hierarchy' ? (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                    {/* Day Selector for Hierarchy */}
                    <div className="flex justify-end">
                        <div className="flex items-center gap-4 bg-card/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm shadow-xl">
                            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap pl-2">Select Day:</span>
                            <input
                                type="range"
                                min="1"
                                max="31"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                                className="w-full md:w-48 h-2 bg-gradient-to-r from-primary/20 to-primary/60 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                            />
                            <div className="h-8 w-10 flex items-center justify-center rounded bg-primary/20 border border-primary/30 font-bold text-primary font-mono shadow-inner">
                                {selectedDay}
                            </div>
                        </div>
                    </div>

                    {/* Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {gaugeData.slice(0, 8).map((gauge) => (
                            <WaterLossGauge
                                key={gauge.id}
                                label={gauge.name.replace(' (NAMA)', '').replace(' (Bulk Zone 3A)', '').replace(' (Bulk Zone 3B)', '').replace(' (Bulk Zone 5)', '')}
                                subLabel={`Input: ${gauge.input.toLocaleString()} m³`}
                                score={gauge.efficiency}
                                className="h-full bg-gradient-to-br from-card/30 to-card/10 hover:from-card/40 hover:to-card/20 transition-all duration-300 transform hover:-translate-y-1"
                            />
                        ))}
                    </div>

                    {/* Table */}
                    <Card className="border-none shadow-2xl bg-card/20 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
                        <CardHeader className="px-6 py-6 border-b border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                                        <Layers className="text-primary h-5 w-5" />
                                        Hierarchical Breakdown
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        Detailed meter-level readings and reconciliation analysis.
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" className="hidden sm:flex gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground">
                                    <Database size={14} /> Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-black/20">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="w-[280px] font-semibold text-white/70">Meter Hierarchy</TableHead>
                                        <TableHead className="w-[100px] font-semibold text-white/50">Acct #</TableHead>
                                        <TableHead className="w-[80px] text-center font-semibold text-white/50">Level</TableHead>
                                        <TableHead className="hidden sm:table-cell font-semibold text-white/50">Zone</TableHead>
                                        <TableHead className="hidden md:table-cell font-semibold text-white/50">Parent Node</TableHead>
                                        <TableHead className="hidden lg:table-cell font-semibold text-white/50">Details</TableHead>
                                        <TableHead className="text-right font-semibold text-white/70">Flow (m³)</TableHead>
                                        <TableHead className="text-center font-semibold text-white/70">Diff</TableHead>
                                        <TableHead className="text-center font-semibold text-white/70">Loss %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <RecursiveRow node={hierarchy} depth={0} />
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    {/* Zone Trends View */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar / Controls */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="glass-card bg-card/10 h-full">
                                <CardHeader>
                                    <CardTitle className="text-base">Filter Zone</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground uppercase font-semibold">Select Zone</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            value={selectedTrendZone}
                                            onChange={(e) => setSelectedTrendZone(e.target.value)}
                                        >
                                            {availableZones.length > 0 ? availableZones.map(z => (
                                                <option key={z} value={z}>{z}</option>
                                            )) : <option>Loading...</option>}
                                        </select>
                                    </div>

                                    {/* Monthly Stats Summary for Zone */}
                                    {zoneStats && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <div className="text-xs text-blue-400 mb-1">Total Input (Bulk)</div>
                                                <div className="text-xl font-bold text-blue-100">{zoneStats.totalBulk.toLocaleString()} m³</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="text-xs text-emerald-400 mb-1">Total Consumed</div>
                                                <div className="text-xl font-bold text-emerald-100">{zoneStats.totalIndiv.toLocaleString()} m³</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <div className="text-xs text-red-400 mb-1">Total Loss</div>
                                                <div className="text-xl font-bold text-red-100">{zoneStats.totalLoss.toLocaleString()} m³</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <div className="text-xs text-muted-foreground mb-1">Avg Efficiency</div>
                                                <div className="text-xl font-bold text-white">{zoneStats.avgEff.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Chart Area */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            Daily Loss Trend: {selectedTrendZone}
                                        </CardTitle>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Comparing Bulk Input vs. Aggregate Individual Consumption over the month.</p>
                                </CardHeader>
                                <CardContent className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={zoneTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorBulk" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorIndiv" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                            <XAxis
                                                dataKey="day"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={value => `${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="bulkInput"
                                                name="Bulk Input"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill="url(#colorBulk)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="individualSum"
                                                name="Total Consumed"
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#colorIndiv)"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="loss"
                                                name="Loss Gap"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Detailed List */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Daily Records</CardTitle>
                                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
                                            <Database size={14} className="mr-2" /> Export
                                        </Button>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-black/40 backdrop-blur-md z-10">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead>Day</TableHead>
                                                <TableHead className="text-right">Bulk Input (m³)</TableHead>
                                                <TableHead className="text-right">Billed (m³)</TableHead>
                                                <TableHead className="text-right">Loss (m³)</TableHead>
                                                <TableHead className="text-right">Efficiency</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {zoneTrendData.map((day) => (
                                                <TableRow key={day.day} className="border-white/5 hover:bg-white/5">
                                                    <TableCell className="font-mono">{day.date}</TableCell>
                                                    <TableCell className="text-right text-blue-300 font-mono">{day.bulkInput.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-emerald-300 font-mono">{day.individualSum.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-red-300 font-mono">{day.loss.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono">{day.efficiency.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full border",
                                                            day.loss > (day.bulkInput * 0.2)
                                                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        )}>
                                                            {day.loss > (day.bulkInput * 0.2) ? 'High Loss' : 'Normal'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

