"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    BarChart3, TestTube2, Database, Minus, TrendingUp,
    Gauge, Calendar, Activity, Loader2, CalendarDays,
    Home, Layers, AlertCircle, MapPin,
    TrendingDown, ChevronDown, ChevronRight, Download
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, BarChart, Bar, Cell, Line, CartesianGrid,

} from "recharts";

// Water data imports
import {
    WATER_METERS as MOCK_WATER_METERS, AVAILABLE_MONTHS, ZONE_CONFIG,
    getConsumption, WaterMeter
} from "@/lib/water-data";

// Supabase imports
import { getWaterMetersFromSupabase, getWaterLossDailyFromSupabase, getDailyWaterConsumptionFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { WaterLossDaily, DailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

// Components
import { DateRangePicker } from "@/components/water/date-range-picker";
import { TypeFilterPills } from "@/components/water/type-filter-pills";
import { LiquidProgressRing } from "../../components/charts/liquid-progress-ring";
import { WaterLossGauge } from "@/components/water/water-loss-gauge";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { MeterTable } from "@/components/water/meter-table";
import dynamic from "next/dynamic";
const DailyWaterReport = dynamic(
    () => import("@/components/water/DailyWaterReport").then(m => ({ default: m.DailyWaterReport })),
    { loading: () => <Skeleton className="h-96 w-full rounded-xl" />, ssr: false }
);
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGrid } from "@/components/shared/stats-grid";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
// Remove duplicate PageStatusBar import
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";

// Dashboard view type
type DashboardView = 'monthly' | 'daily';

const CHART_COLORS = {
    primary: 'var(--chart-water-primary, #6B9AC4)',
    secondary: 'var(--chart-water-secondary, #A1D1D5)',
    accent: 'var(--chart-water-accent, #A1D1D5)',
    success: 'var(--chart-success, #84B59F)',
    loss: 'var(--chart-loss, #D67A7A)',
    brand: 'var(--chart-brand, #4D445D)',
    amber: 'var(--chart-amber, #E8C064)',
    gray: 'var(--chart-gray, #9B86A8)',
} as const;

// Static type-to-color mapping (outside component to avoid re-creation per render)
const TYPE_COLORS: Record<string, string> = {
    'Main BULK': CHART_COLORS.success,
    'Retail': CHART_COLORS.loss,
    'Zone Bulk': CHART_COLORS.primary,
    'Residential (Villa)': CHART_COLORS.brand,
    'IRR_Servies': CHART_COLORS.amber,
    'D_Building_Bulk': CHART_COLORS.secondary,
    'Residential (Apart)': CHART_COLORS.gray,
    'MB_Common': CHART_COLORS.gray,
    'Building': CHART_COLORS.amber,
    'Muscat Bay Community': 'var(--secondary)',
    'D_Building_Common': CHART_COLORS.brand,
    'Un-Sold': 'var(--status-stale)',
    'N/A': CHART_COLORS.gray,
};

// Helper: compute trend direction and formatted % change between two values
const calcTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; trendValue: string } => {
    if (previous === 0) return { trend: 'neutral', trendValue: '—' };
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.5) return { trend: 'neutral', trendValue: '~0%' };
    return { trend: change > 0 ? 'up' : 'down', trendValue: `${Math.abs(change).toFixed(1)}%` };
};

// Pre-computed level caches to avoid repeated .filter() calls
interface LevelCaches {
    l1: WaterMeter[];
    l2: WaterMeter[];
    l3: WaterMeter[];
    l4: WaterMeter[];
    dc: WaterMeter[];
    l3NonBuildings: WaterMeter[];
    /** L3 meters grouped by zone code */
    l3ByZone: Record<string, WaterMeter[]>;
    /** Meters indexed by account number */
    byAccount: Record<string, WaterMeter>;
    /** Count per level */
    counts: { level: string; count: number }[];
}

function buildLevelCaches(meters: WaterMeter[]): LevelCaches {
    const l1: WaterMeter[] = [];
    const l2: WaterMeter[] = [];
    const l3: WaterMeter[] = [];
    const l4: WaterMeter[] = [];
    const dc: WaterMeter[] = [];
    const l3ByZone: Record<string, WaterMeter[]> = {};
    const byAccount: Record<string, WaterMeter> = {};

    for (const m of meters) {
        byAccount[m.accountNumber] = m;
        switch (m.level) {
            case 'L1': l1.push(m); break;
            case 'L2': l2.push(m); break;
            case 'L3':
                l3.push(m);
                (l3ByZone[m.zone] ??= []).push(m);
                break;
            case 'L4': l4.push(m); break;
            case 'DC': dc.push(m); break;
        }
    }

    const l3NonBuildings = l3.filter(m => !m.type.includes('Building_Bulk'));
    const counts = [
        { level: 'L1', count: l1.length },
        { level: 'L2', count: l2.length },
        { level: 'L3', count: l3.length },
        { level: 'L4', count: l4.length },
        { level: 'DC', count: dc.length },
    ];

    return { l1, l2, l3, l4, dc, l3NonBuildings, l3ByZone, byAccount, counts };
}

// Helper functions that work with pre-computed caches
function calculateRangeAnalysisFromData(caches: LevelCaches, startMonth: string, endMonth: string) {
    const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
    const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return { A1: 0, A2: 0, A3Bulk: 0, A3Individual: 0, stage1Loss: 0, stage2Loss: 0, totalLoss: 0, efficiency: 0, lossPercentage: 0 };

    const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);

    const sumConsumption = (meterList: WaterMeter[]) =>
        meterList.reduce((sum, m) => sum + months.reduce((s, month) => s + getConsumption(m, month), 0), 0);

    const A1 = sumConsumption(caches.l1);
    const A2 = sumConsumption(caches.l2) + sumConsumption(caches.dc);
    const A3Individual = sumConsumption(caches.l3NonBuildings) + sumConsumption(caches.l4) + sumConsumption(caches.dc);
    const A3Bulk = sumConsumption(caches.l3) + sumConsumption(caches.dc);

    const stage1Loss = A1 - A2;
    const stage2Loss = A2 - A3Individual;
    const totalLoss = A1 - A3Individual;
    const efficiency = A1 > 0 ? Math.round((A3Individual / A1) * 1000) / 10 : 0;
    const lossPercentage = A1 > 0 ? Math.round((totalLoss / A1) * 1000) / 10 : 0;

    return { A1, A2, A3Bulk, A3Individual, stage1Loss, stage2Loss, totalLoss, efficiency, lossPercentage };
}

function getMonthlyTrendsFromData(caches: LevelCaches, startMonth: string, endMonth: string) {
    const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
    const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
    if (startIdx === -1 || endIdx === -1) return [];

    return AVAILABLE_MONTHS.slice(startIdx, endIdx + 1).map(month => {
        const A1 = caches.l1.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const A2 = caches.l2.reduce((sum, m) => sum + getConsumption(m, month), 0) + caches.dc.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const A3Individual = caches.l3NonBuildings.reduce((sum, m) => sum + getConsumption(m, month), 0) + caches.l4.reduce((sum, m) => sum + getConsumption(m, month), 0) + caches.dc.reduce((sum, m) => sum + getConsumption(m, month), 0);

        const stage1Loss = A1 - A2;
        const stage2Loss = A2 - A3Individual;
        const totalLoss = A1 - A3Individual;

        return { month, A1, A2, A3Individual, stage1Loss, stage2Loss, totalLoss };
    });
}

function calculateZoneAnalysisFromData(caches: LevelCaches, zone: string, month: string) {
    // Direct Connection: L1 vs (L2+DC) analysis
    if (zone === 'Direct_Connection') {
        const l1Total = caches.l1.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const l2Total = caches.l2.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const dcTotal = caches.dc.reduce((sum, m) => sum + getConsumption(m, month), 0);
        const distributed = l2Total + dcTotal;
        const loss = l1Total - distributed;
        const lossPercentage = l1Total > 0 ? Math.round((loss / l1Total) * 1000) / 10 : 0;
        const efficiency = l1Total > 0 ? Math.round((distributed / l1Total) * 1000) / 10 : 0;
        return { zone, zoneName: 'Direct Connection', bulkMeterReading: l1Total, individualTotal: distributed, loss, lossPercentage, efficiency, meterCount: caches.l2.length + caches.dc.length };
    }

    const config = ZONE_CONFIG.find(z => z.code === zone);
    if (!config) return { zone, zoneName: zone, bulkMeterReading: 0, individualTotal: 0, loss: 0, lossPercentage: 0, efficiency: 0, meterCount: 0 };

    const bulkMeter = caches.byAccount[config.bulkMeterAccount];
    const bulkMeterReading = bulkMeter ? getConsumption(bulkMeter, month) : 0;
    const zoneL3 = caches.l3ByZone[zone] || [];
    const individualTotal = zoneL3.reduce((sum, m) => sum + getConsumption(m, month), 0);

    const loss = bulkMeterReading - individualTotal;
    const lossPercentage = bulkMeterReading > 0 ? Math.round((loss / bulkMeterReading) * 1000) / 10 : 0;
    const efficiency = bulkMeterReading > 0 ? Math.round((individualTotal / bulkMeterReading) * 1000) / 10 : 0;

    return { zone, zoneName: config.name, bulkMeterReading, individualTotal, loss, lossPercentage, efficiency, meterCount: zoneL3.length };
}

function calculateZoneRangeAnalysisFromData(caches: LevelCaches, zone: string, startMonth: string, endMonth: string) {
    const si = AVAILABLE_MONTHS.indexOf(startMonth);
    const ei = AVAILABLE_MONTHS.indexOf(endMonth);
    const months = AVAILABLE_MONTHS.slice(si < 0 ? 0 : si, ei < 0 ? undefined : ei + 1);

    // Direct Connection: L1 vs (L2+DC) analysis
    if (zone === 'Direct_Connection') {
        const l1Total = caches.l1.reduce((sum, m) => sum + months.reduce((s, mo) => s + getConsumption(m, mo), 0), 0);
        const l2Total = caches.l2.reduce((sum, m) => sum + months.reduce((s, mo) => s + getConsumption(m, mo), 0), 0);
        const dcTotal = caches.dc.reduce((sum, m) => sum + months.reduce((s, mo) => s + getConsumption(m, mo), 0), 0);
        const distributed = l2Total + dcTotal;
        const loss = l1Total - distributed;
        const lossPercentage = l1Total > 0 ? Math.round((loss / l1Total) * 1000) / 10 : 0;
        const efficiency = l1Total > 0 ? Math.round((distributed / l1Total) * 1000) / 10 : 0;
        return { zone, zoneName: 'Direct Connection', bulkMeterReading: l1Total, individualTotal: distributed, loss, lossPercentage, efficiency, meterCount: caches.l2.length + caches.dc.length };
    }

    const config = ZONE_CONFIG.find(z => z.code === zone);
    if (!config) return { zone, zoneName: zone, bulkMeterReading: 0, individualTotal: 0, loss: 0, lossPercentage: 0, efficiency: 0, meterCount: 0 };

    const bulkMeter = caches.byAccount[config.bulkMeterAccount];
    const bulkMeterReading = bulkMeter ? months.reduce((sum, m) => sum + getConsumption(bulkMeter, m), 0) : 0;
    const zoneL3 = caches.l3ByZone[zone] || [];
    const individualTotal = zoneL3.reduce((sum, meter) => sum + months.reduce((s, m) => s + getConsumption(meter, m), 0), 0);

    const loss = bulkMeterReading - individualTotal;
    const lossPercentage = bulkMeterReading > 0 ? Math.round((loss / bulkMeterReading) * 1000) / 10 : 0;
    const efficiency = bulkMeterReading > 0 ? Math.round((individualTotal / bulkMeterReading) * 1000) / 10 : 0;

    return { zone, zoneName: config.name, bulkMeterReading, individualTotal, loss, lossPercentage, efficiency, meterCount: zoneL3.length };
}

function getAllZonesAnalysisFromData(caches: LevelCaches, month: string) {
    return ZONE_CONFIG.map(config => calculateZoneAnalysisFromData(caches, config.code, month));
}

export default function WaterPage() {
    const [dashboardView, setDashboardView] = useState<DashboardView>('monthly');
    const [monthlyTab, setMonthlyTab] = useState("overview"); // Changed to string for TabNavigation compatibility
    const [startMonth, setStartMonth] = useState('Jan-24');
    const [endMonth, setEndMonth] = useState(AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1]);
    const [selectedZone, setSelectedZone] = useState('Zone_01_(FM)');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedChartType, setSelectedChartType] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('');

    // Supabase data state
    const [waterMeters, setWaterMeters] = useState<WaterMeter[]>(MOCK_WATER_METERS);
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Stable fetch function — used both on mount and by real-time handler
    const fetchWaterData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            if (isSupabaseConfigured()) {
                const supabaseData = await getWaterMetersFromSupabase();
                if (supabaseData.length > 0) {
                    setWaterMeters(supabaseData);
                    setDataSource('supabase');
                    setLastUpdated(new Date());
                } else if (!silent) {
                    setWaterMeters(MOCK_WATER_METERS);
                    setDataSource('mock');
                }
            } else if (!silent) {
                setWaterMeters(MOCK_WATER_METERS);
                setDataSource('mock');
            }
        } catch (error) {
            if (!silent) {
                console.error('Error fetching water data:', error);
                setWaterMeters(MOCK_WATER_METERS);
                setDataSource('mock');
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // ── Supabase real-time subscription for Water System table ─────────────
    const { isLive } = useSupabaseRealtime({
        table: 'Water System',
        channelName: 'water-system-rt',
        onChanged: () => fetchWaterData(true),
        enabled: dataSource === 'supabase',
    });

    // Fetch on mount + load saved preferences
    useEffect(() => {
        fetchWaterData();

        // Load saved filter preferences
        const savedPrefs = loadFilterPreferences<{
            dashboardView?: DashboardView;
            monthlyTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedZone?: string;
            selectedType?: string;
            selectedYear?: string;
        }>('water');
        if (savedPrefs) {
            if (savedPrefs.dashboardView) setDashboardView(savedPrefs.dashboardView);
            if (savedPrefs.monthlyTab) setMonthlyTab(savedPrefs.monthlyTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.selectedZone) setSelectedZone(savedPrefs.selectedZone);
            if (savedPrefs.selectedType) setSelectedType(savedPrefs.selectedType);
            if (savedPrefs.selectedYear) {
                setSelectedYear(savedPrefs.selectedYear);
                // Only restore the saved end month when a year filter is active (user scoped to a year)
                if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            }
            // Without a year filter, always default to the latest available month
        }
    }, [fetchWaterData]);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('water', {
            dashboardView,
            monthlyTab,
            startMonth,
            endMonth,
            selectedZone,
            selectedType,
            selectedYear
        });
    }, [dashboardView, monthlyTab, startMonth, endMonth, selectedZone, selectedType, selectedYear]);

    // Extract available years from AVAILABLE_MONTHS
    const availableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        AVAILABLE_MONTHS.forEach(month => {
            const year = '20' + month.split('-')[1];
            yearsSet.add(year);
        });
        return Array.from(yearsSet).sort();
    }, []);

    // Filter months by selected year
    const filteredMonthsByYear = useMemo(() => {
        if (!selectedYear) return AVAILABLE_MONTHS;
        return AVAILABLE_MONTHS.filter(month => {
            const year = '20' + month.split('-')[1];
            return year === selectedYear;
        });
    }, [selectedYear]);

    // Pre-compute level caches once when waterMeters changes — eliminates O(n) filter calls per helper
    const levelCaches = useMemo(() => buildLevelCaches(waterMeters), [waterMeters]);

    // Calculate analysis data using pre-computed caches
    const rangeAnalysis = useMemo(() =>
        calculateRangeAnalysisFromData(levelCaches, startMonth, endMonth), [levelCaches, startMonth, endMonth]);

    // Calculate previous period analysis for trend comparison
    const prevAnalysis = useMemo(() => {
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        if (startIdx <= 0 || endIdx < 0) return null;
        const rangeLen = endIdx - startIdx;
        const prevEndIdx = startIdx - 1;
        const prevStartIdx = Math.max(0, prevEndIdx - rangeLen);
        return calculateRangeAnalysisFromData(
            levelCaches,
            AVAILABLE_MONTHS[prevStartIdx],
            AVAILABLE_MONTHS[prevEndIdx]
        );
    }, [levelCaches, startMonth, endMonth]);

    const monthlyTrends = useMemo(() =>
        getMonthlyTrendsFromData(levelCaches, startMonth, endMonth), [levelCaches, startMonth, endMonth]);

    const zoneAnalysis = useMemo(() =>
        calculateZoneRangeAnalysisFromData(levelCaches, selectedZone, startMonth, endMonth), [levelCaches, selectedZone, startMonth, endMonth]);

    const allZones = useMemo(() =>
        getAllZonesAnalysisFromData(levelCaches, endMonth), [levelCaches, endMonth]);

    const meterCounts = useMemo(() => levelCaches.counts, [levelCaches]);

    // Muscat Bay Community: specific meters billed to the community
    const MUSCAT_BAY_COMMUNITY = 'Muscat Bay Community';
    const COMMUNITY_ACCOUNTS = new Set([
        // D_Building_Common (21)
        '4300126','4300135','4300136','4300137','4300138','4300139','4300140','4300141',
        '4300142','4300143','4300144','4300145','4300201','4300202','4300203','4300204',
        '4300205','4300206','4300207','4300208','4300209',
        // IRR_Servies (7)
        '4300294','4300308','4300320','4300321','4300323','4300326','4300341',
        // MB_Common (8)
        '4300295','4300296','4300297','4300299','4300309','4300336','4300337','4300338',
        // Un-Sold (15)
        '4300083','4300093','4300095','4300151','4300159','4300160','4300167','4300173',
        '4300188','4300191','4300192','4300193','4300194','4300195','4300237',
    ]);

    // Applicable meters for consumption view:
    // Exclude IRR_Servies meters where parentMeter is 'N/A' (non-applicable meters like Outlet/TSE)
    const applicableMeters = useMemo(() => {
        return waterMeters.filter(m => {
            if (m.type === 'IRR_Servies' && (m.parentMeter === 'N/A' || !m.parentMeter)) {
                return false;
            }
            return true;
        });
    }, [waterMeters]);

    // Get unique types for filter (from applicable meters) + composite "Muscat Bay Community"
    const uniqueTypes = useMemo(() => {
        const types = new Set(applicableMeters.map(m => m.type));
        return ['All', MUSCAT_BAY_COMMUNITY, ...Array.from(types)];
    }, [applicableMeters]);

    // Filter meters by type (from applicable meters)
    const filteredMeters = useMemo(() => {
        if (selectedType === 'All') return applicableMeters;
        if (selectedType === MUSCAT_BAY_COMMUNITY) return applicableMeters.filter(m => COMMUNITY_ACCOUNTS.has(m.accountNumber));
        return applicableMeters.filter(m => m.type === selectedType);
    }, [applicableMeters, selectedType]);

    // Single-pass: compute per-meter total consumption for applicable meters in range
    const meterTotalsMap = useMemo(() => {
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);
        const map = new Map<string, number>();
        for (const meter of applicableMeters) {
            let total = 0;
            for (const m of months) total += getConsumption(meter, m);
            map.set(meter.accountNumber, total);
        }
        return map;
    }, [applicableMeters, startMonth, endMonth]);

    // Calculate total consumption for filtered data (uses pre-computed totals)
    const totalConsumption = useMemo(() => {
        let sum = 0;
        for (const meter of filteredMeters) sum += meterTotalsMap.get(meter.accountNumber) || 0;
        return sum;
    }, [filteredMeters, meterTotalsMap]);

    // Find highest consumer (uses pre-computed totals)
    const highestConsumer = useMemo(() => {
        let max = { meter: filteredMeters[0] ?? waterMeters[0], total: 0 };
        for (const meter of filteredMeters) {
            const total = meterTotalsMap.get(meter.accountNumber) || 0;
            if (total > max.total) max = { meter, total };
        }
        return max;
    }, [filteredMeters, waterMeters, meterTotalsMap]);

    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    const handleResetRange = () => {
        setSelectedYear('');
        setStartMonth(AVAILABLE_MONTHS[0]);
        setEndMonth(AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1]);
    };

    // Consumption by type chart data (uses pre-computed totals)
    const consumptionChartData = useMemo(() => {
        const typeConsumption: Record<string, number> = {};
        for (const meter of applicableMeters) {
            const total = meterTotalsMap.get(meter.accountNumber) || 0;
            typeConsumption[meter.type] = (typeConsumption[meter.type] || 0) + total;
        }
        return Object.entries(typeConsumption)
            .map(([type, total]) => ({ type, total }))
            .sort((a, b) => b.total - a.total);
    }, [applicableMeters, meterTotalsMap]);

    // ── Type Detail Data (for interactive drill-down) ─────────────────────
    const activeDetailType = selectedChartType || (selectedType !== 'All' ? selectedType : null);

    // Monthly trend for the selected type
    const typeTrendData = useMemo(() => {
        if (!activeDetailType) return [];
        const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
        const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
        const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);
        const metersOfType = activeDetailType === MUSCAT_BAY_COMMUNITY
            ? applicableMeters.filter(m => COMMUNITY_ACCOUNTS.has(m.accountNumber))
            : applicableMeters.filter(m => m.type === activeDetailType);

        return months.map(month => {
            const total = metersOfType.reduce((sum, m) => sum + getConsumption(m, month), 0);
            return { month, consumption: Math.round(total * 10) / 10 };
        });
    }, [activeDetailType, applicableMeters, startMonth, endMonth]);

    // Top consumers within selected type (uses pre-computed totals)
    const typeTopConsumers = useMemo(() => {
        if (!activeDetailType) return [];

        const metersOfType = activeDetailType === MUSCAT_BAY_COMMUNITY
            ? applicableMeters.filter(m => COMMUNITY_ACCOUNTS.has(m.accountNumber))
            : applicableMeters.filter(m => m.type === activeDetailType);

        return metersOfType
            .map(m => ({
                label: m.label,
                zone: m.zone,
                total: Math.round((meterTotalsMap.get(m.accountNumber) || 0) * 10) / 10,
            }))
            .sort((a, b) => b.total - a.total);
    }, [activeDetailType, applicableMeters, meterTotalsMap]);

    // Type-specific stats
    const typeDetailStats = useMemo(() => {
        if (!activeDetailType || typeTopConsumers.length === 0) return null;
        const meterCount = activeDetailType === MUSCAT_BAY_COMMUNITY
            ? applicableMeters.filter(m => COMMUNITY_ACCOUNTS.has(m.accountNumber)).length
            : applicableMeters.filter(m => m.type === activeDetailType).length;
        const totalForType = typeTopConsumers.reduce((s, m) => s + m.total, 0);
        const avgPerMeter = meterCount > 0 ? totalForType / meterCount : 0;
        const maxConsumer = typeTopConsumers[0];
        const minConsumer = typeTopConsumers[typeTopConsumers.length - 1];
        const overallTotal = consumptionChartData.reduce((s, d) => s + d.total, 0);
        const pctOfTotal = overallTotal > 0 ? (totalForType / overallTotal) * 100 : 0;

        return { meterCount, totalForType, avgPerMeter, maxConsumer, minConsumer, pctOfTotal };
    }, [activeDetailType, typeTopConsumers, applicableMeters, consumptionChartData]);

    // Zone consumption trend data (memoized to avoid IIFE recalculation in JSX)
    const isDC = selectedZone === 'Direct_Connection';
    const zoneConsumptionTrend = useMemo(() => {
        const si = AVAILABLE_MONTHS.indexOf(startMonth);
        const ei = AVAILABLE_MONTHS.indexOf(endMonth);
        const rangeMonths = AVAILABLE_MONTHS.slice(si < 0 ? 0 : si, ei < 0 ? undefined : ei + 1);
        return rangeMonths.map(month => {
            const analysis = calculateZoneAnalysisFromData(levelCaches, selectedZone, month);
            return {
                month,
                'Zone Bulk': analysis.bulkMeterReading,
                'Individual Total': analysis.individualTotal,
                'Loss': Math.abs(analysis.loss)
            };
        });
    }, [levelCaches, selectedZone, startMonth, endMonth]);

    // Generate stats for Overview using StatsGrid format
    const overviewStats = useMemo(() => {
        const a1Trend = prevAnalysis ? calcTrend(rangeAnalysis.A1, prevAnalysis.A1) : null;
        const a2Trend = prevAnalysis ? calcTrend(rangeAnalysis.A2, prevAnalysis.A2) : null;
        const a3Trend = prevAnalysis ? calcTrend(rangeAnalysis.A3Individual, prevAnalysis.A3Individual) : null;
        const effTrend = prevAnalysis ? calcTrend(rangeAnalysis.efficiency, prevAnalysis.efficiency) : null;

        return [
            {
                label: "A1 - MAIN SOURCE",
                value: `${(rangeAnalysis.A1 / 1000).toFixed(1)}k m³`,
                subtitle: "L1 (Main source input)",
                icon: Droplets,
                variant: "default" as const,
                ...(a1Trend && { trend: a1Trend.trend, trendValue: a1Trend.trendValue }),
                invertTrend: true,
            },
            {
                label: "A2 - ZONE DISTRIBUTION",
                value: `${(rangeAnalysis.A2 / 1000).toFixed(1)}k m³`,
                subtitle: "L2 Bulks + DC",
                icon: ChevronsRight,
                variant: "secondary" as const,
                ...(a2Trend && { trend: a2Trend.trend, trendValue: a2Trend.trendValue }),
                invertTrend: true,
            },
            {
                label: "A3 - INDIVIDUAL",
                value: `${(rangeAnalysis.A3Individual / 1000).toFixed(1)}k m³`,
                subtitle: "Villas + Apts + DC",
                icon: Users,
                variant: "primary" as const,
                ...(a3Trend && { trend: a3Trend.trend, trendValue: a3Trend.trendValue }),
                invertTrend: true,
            },
            {
                label: "SYSTEM EFFICIENCY",
                value: `${rangeAnalysis.efficiency}%`,
                subtitle: "A3 / A1 Ratio",
                icon: ArrowRightLeft,
                variant: "success" as const,
                ...(effTrend && { trend: effTrend.trend, trendValue: effTrend.trendValue }),
            }
        ];
    }, [rangeAnalysis, prevAnalysis]);

    const lossStats = useMemo(() => {
        const s1Trend = prevAnalysis ? calcTrend(rangeAnalysis.stage1Loss, prevAnalysis.stage1Loss) : null;
        const s2Trend = prevAnalysis ? calcTrend(rangeAnalysis.stage2Loss, prevAnalysis.stage2Loss) : null;
        const totalLossTrend = prevAnalysis ? calcTrend(rangeAnalysis.totalLoss, prevAnalysis.totalLoss) : null;

        return [
            {
                label: "STAGE 1 LOSS",
                value: `${rangeAnalysis.stage1Loss.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A1 > 0 ? ((rangeAnalysis.stage1Loss / rangeAnalysis.A1) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "danger" as const,
                ...(s1Trend && { trend: s1Trend.trend, trendValue: s1Trend.trendValue }),
                invertTrend: true,
            },
            {
                label: "STAGE 2 LOSS",
                value: `${rangeAnalysis.stage2Loss.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.A2 > 0 ? ((rangeAnalysis.stage2Loss / rangeAnalysis.A2) * 100).toFixed(1) : 0}%`,
                icon: Minus,
                variant: "warning" as const,
                ...(s2Trend && { trend: s2Trend.trend, trendValue: s2Trend.trendValue }),
                invertTrend: true,
            },
            {
                label: "TOTAL SYSTEM LOSS",
                value: `${rangeAnalysis.totalLoss.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³`,
                subtitle: `Loss Rate: ${rangeAnalysis.lossPercentage}%`,
                icon: AlertTriangle,
                variant: "danger" as const,
                ...(totalLossTrend && { trend: totalLossTrend.trend, trendValue: totalLossTrend.trendValue }),
                invertTrend: true,
            },
            {
                label: "HIGHEST CONSUMER",
                value: highestConsumer.meter.label,
                subtitle: `${highestConsumer.total.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³`,
                icon: TrendingUp,
                variant: "warning" as const,
            }
        ];
    }, [rangeAnalysis, prevAnalysis, highestConsumer]);

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
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                >

                </PageStatusBar>
            </div>

            {/* View Switching Tabs */}
            <TabNavigation
                activeTab={dashboardView}
                onTabChange={(key) => setDashboardView(key as 'monthly' | 'daily')}
                variant="secondary"
                tabs={[
                    { key: 'monthly', label: 'Monthly', icon: BarChart3 },
                    { key: 'daily', label: 'Daily', icon: CalendarDays },
                ]}
            />

            {/* Monthly Dashboard View */}
            {dashboardView === 'monthly' && (
                <div id="panel-monthly" role="tabpanel" aria-labelledby="tab-monthly" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">

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

                    {/* Date Range Picker - hidden on database tab */}
                    {monthlyTab !== 'database' && (
                        <Card className="card-elevated">
                            <CardContent className="p-4 sm:p-5 md:p-6">
                                <div className="flex flex-col gap-4">
                                    {/* Year Selector Row */}
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Year:</span>
                                            <div className="flex items-center gap-2">
                                                {availableYears.map((year) => (
                                                    <Button
                                                        key={year}
                                                        variant={selectedYear === year ? "default" : "outline"}
                                                        size="sm"
                                                        aria-label={`Filter by year ${year}`}
                                                        aria-pressed={selectedYear === year}
                                                        onClick={() => {
                                                            setSelectedYear(year);
                                                            const yearMonths = AVAILABLE_MONTHS.filter(m => '20' + m.split('-')[1] === year);
                                                            if (yearMonths.length > 0) {
                                                                setStartMonth(yearMonths[0]);
                                                                setEndMonth(yearMonths[yearMonths.length - 1]);
                                                            }
                                                        }}
                                                        className={`rounded-full px-4 min-h-[44px] lg:min-h-0 ${selectedYear === year ? "bg-secondary text-white" : "border-slate-200 dark:border-slate-700"}`}
                                                    >
                                                        {year}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {monthlyTab === 'consumption' ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Type:</span>
                                                <select
                                                    value={selectedType}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedType(val);
                                                        setSelectedChartType(val === 'All' ? null : val);
                                                    }}
                                                    aria-label="Filter by meter type"
                                                    className="px-2.5 py-2 sm:py-1.5 min-h-[44px] lg:min-h-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                                >
                                                    {uniqueTypes.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                <Badge variant="outline" className="px-2.5 py-1 text-xs font-normal">
                                                    {filteredMonthsByYear.length} Months
                                                </Badge>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                                {filteredMonthsByYear.length} Months Available
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Date Range Picker - shown for all tabs */}
                                    <DateRangePicker
                                        startMonth={startMonth}
                                        endMonth={endMonth}
                                        availableMonths={filteredMonthsByYear}
                                        onRangeChange={handleRangeChange}
                                        onReset={handleResetRange}
                                    />

                                    {/* Zone selector - only shown on zone tab */}
                                    {monthlyTab === 'zone' && (
                                        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">Zone:</span>
                                            <Button
                                                key="Direct_Connection"
                                                variant={selectedZone === 'Direct_Connection' ? "default" : "outline"}
                                                size="sm"
                                                aria-label="Select Direct Connection"
                                                aria-pressed={selectedZone === 'Direct_Connection'}
                                                onClick={() => setSelectedZone('Direct_Connection')}
                                                className={`rounded-full px-3 text-xs min-h-[44px] lg:min-h-0 h-auto lg:h-7 ${selectedZone === 'Direct_Connection' ? "bg-secondary text-white border-secondary" : "border-slate-200 dark:border-slate-700"}`}
                                            >
                                                Direct Connection
                                            </Button>
                                            {ZONE_CONFIG.map((z) => (
                                                <Button
                                                    key={z.code}
                                                    variant={selectedZone === z.code ? "default" : "outline"}
                                                    size="sm"
                                                    aria-label={`Select ${z.name} zone`}
                                                    aria-pressed={selectedZone === z.code}
                                                    onClick={() => setSelectedZone(z.code)}
                                                    className={`rounded-full px-3 text-xs min-h-[44px] lg:min-h-0 h-auto lg:h-7 ${selectedZone === z.code ? "bg-secondary text-white border-secondary" : "border-slate-200 dark:border-slate-700"}`}
                                                >
                                                    {z.name}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Reset zone selection"
                                                onClick={() => setSelectedZone(ZONE_CONFIG[0].code)}
                                                className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 min-h-[44px] lg:min-h-0 h-auto lg:h-7 ml-1"
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Overview Tab */}
                    {monthlyTab === 'overview' && (
                        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0} className="space-y-6">
                            <StatsGrid stats={overviewStats} />
                            <StatsGrid stats={lossStats} />

                            {/* A-Values Distribution Chart */}
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Water System A-Values Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div role="img" aria-label="Water System A-Values Distribution: area chart showing monthly trends for A1 main source input, A2 zone distribution, and A3 individual consumption" className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradA1" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradA2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} />
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="A1 - Main Source" dataKey="A1" stroke={CHART_COLORS.brand} fill="url(#gradA1)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} animationEasing="ease-out" />
                                                <Area type="monotone" name="A2 - Zone Distribution" dataKey="A2" stroke={CHART_COLORS.primary} fill="url(#gradA2)" strokeWidth={3} animationDuration={600} animationEasing="ease-out" />
                                                <Area type="monotone" name="A3 - Individual" dataKey="A3Individual" stroke={CHART_COLORS.gray} fill="none" strokeWidth={2} strokeDasharray="5 5" animationDuration={600} animationEasing="ease-out" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Water Loss Analysis Chart */}
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">Water Loss Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div role="img" aria-label="Water Loss Analysis: area chart showing total system loss, stage 1 loss (L1−L2), and stage 2 loss (L2−L3) trends over time in cubic meters" className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradLoss" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.loss} stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.loss} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} />
                                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="Total Loss" dataKey="totalLoss" stroke={CHART_COLORS.loss} fill="url(#gradLoss)" strokeWidth={2} strokeDasharray="5 5" animationDuration={600} animationEasing="ease-out" />
                                                <Line type="monotone" name="Stage 1 Loss" dataKey="stage1Loss" stroke={CHART_COLORS.amber} strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={600} animationEasing="ease-out" />
                                                <Line type="monotone" name="Stage 2 Loss" dataKey="stage2Loss" stroke={CHART_COLORS.gray} strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={600} animationEasing="ease-out" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Zone Analysis Tab */}
                    {monthlyTab === 'zone' && (
                        <div id="panel-zone" role="tabpanel" aria-labelledby="tab-zone" tabIndex={0} className="space-y-6">
                            {/* Zone Heading */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    {selectedZone === 'Direct_Connection' ? 'Direct Connection' : ZONE_CONFIG.find(z => z.code === selectedZone)?.name} — {startMonth === endMonth ? endMonth : `${startMonth} – ${endMonth}`}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {selectedZone === 'Direct_Connection' ? (
                                        <>
                                            <span className="text-mb-secondary font-medium">Main Bulk (L1)</span> = Total NAMA input •
                                            <span className="text-mb-primary font-medium"> L2 + DC Total</span> = All zone bulks + direct connections •
                                            <span className="text-[var(--mb-danger-text)] font-medium"> Difference</span> = L1 − (L2 + DC)
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-mb-secondary font-medium">Zone Bulk</span> = L2 only •
                                            <span className="text-mb-primary font-medium"> L3 Total</span> = Sum of all L3 meters in zone •
                                            <span className="text-[var(--mb-danger-text)] font-medium"> Difference</span> = L2 − L3
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                                <LiquidProgressRing
                                    value={zoneAnalysis.bulkMeterReading}
                                    max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                                    label={selectedZone === 'Direct_Connection' ? 'Main Bulk (L1)' : 'Zone Bulk Meter Total'}
                                    sublabel={selectedZone === 'Direct_Connection' ? 'Total NAMA input' : 'Total water entering zone'}
                                    color={CHART_COLORS.primary}
                                    size={160}
                                    showPercentage={false}
                                    elementId="gauge-1"
                                />
                                <LiquidProgressRing
                                    value={zoneAnalysis.individualTotal}
                                    max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                                    label={selectedZone === 'Direct_Connection' ? 'L2 + DC Total' : 'L3 Individual Total'}
                                    sublabel={selectedZone === 'Direct_Connection' ? 'Sum of all zone bulks + DC meters' : 'Sum of all L3 meters in zone'}
                                    color={CHART_COLORS.brand}
                                    size={160}
                                    showPercentage={false}
                                    elementId="gauge-2"
                                />
                                <LiquidProgressRing
                                    value={Math.abs(zoneAnalysis.loss)}
                                    max={zoneAnalysis.bulkMeterReading || 100}
                                    label={selectedZone === 'Direct_Connection' ? 'Stage 1 Loss' : 'Water Loss Distribution'}
                                    sublabel={selectedZone === 'Direct_Connection' ? 'L1 − (L2 + DC)' : 'Leakage, meter loss, etc.'}
                                    color={zoneAnalysis.loss > 0 ? CHART_COLORS.loss : CHART_COLORS.success}
                                    size={160}
                                    showPercentage={true}
                                    elementId="gauge-3"
                                />
                            </div>

                            {/* Zone Consumption Trend Chart */}
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                                    <CardTitle className="text-base sm:text-lg">{isDC ? 'Main Bulk vs Distribution Trend' : 'Zone Consumption Trend'}</CardTitle>
                                    <p className="text-xs sm:text-sm text-slate-500">{isDC ? 'Monthly comparison of L1 (Main Bulk) vs L2 + DC totals' : 'Monthly comparison of L2 (Bulk) vs L3 totals'}</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div role="img" aria-label={isDC ? 'Main Bulk vs Distribution Trend: area chart comparing L1 main bulk input against L2 zone bulk plus direct connections' : 'Zone Consumption Trend: area chart comparing zone bulk meter readings against individual L3 meter totals and loss'} className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={zoneConsumptionTrend}>
                                                <defs>
                                                    <linearGradient id="gradZoneBulk" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradIndividual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} />
                                                <YAxis className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" name="Individual Total" dataKey="Individual Total" stroke={CHART_COLORS.brand} fill="url(#gradIndividual)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} animationEasing="ease-out" />
                                                <Line type="monotone" name="Loss" dataKey="Loss" stroke={CHART_COLORS.loss} strokeWidth={2} dot={false} strokeDasharray="5 5" animationDuration={600} animationEasing="ease-out" />
                                                <Area type="monotone" name="Zone Bulk" dataKey="Zone Bulk" stroke={CHART_COLORS.primary} fill="url(#gradZoneBulk)" strokeWidth={3} animationDuration={600} animationEasing="ease-out" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Individual Meters Table */}
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-base sm:text-lg">{isDC ? 'Main Bulk, Zone Bulks & DC Meters' : `Zone Meters - ${ZONE_CONFIG.find(z => z.code === selectedZone)?.name}`}</CardTitle>
                                            <p className="text-xs sm:text-sm text-slate-500">{isDC ? 'L1 main source, L2 zone bulk meters, and direct connections' : 'Zone bulk and individual meters'}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <MeterTable
                                        meters={isDC
                                            ? waterMeters.filter(m => m.level === 'L1' || m.level === 'L2' || m.level === 'DC')
                                            // L2+L3 for the zone + all L4 meters (MeterTable matches them to buildings via BUILDING_CONFIG)
                                            : [
                                                ...waterMeters.filter(m => m.zone === selectedZone && (m.level === 'L2' || m.level === 'L3')),
                                                ...waterMeters.filter(m => m.level === 'L4'),
                                              ]
                                        }
                                        months={AVAILABLE_MONTHS.slice(
                                            Math.max(0, AVAILABLE_MONTHS.indexOf(startMonth)),
                                            AVAILABLE_MONTHS.indexOf(endMonth) + 1
                                        )}
                                        pageSize={10}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Consumption by Type Tab */}
                    {monthlyTab === 'consumption' && (
                        <div id="panel-consumption" role="tabpanel" aria-labelledby="tab-consumption" tabIndex={0} className="space-y-5">

                            {/* ── Main Chart ── */}
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <CardTitle className="text-base sm:text-lg">Consumption by Type (m³)</CardTitle>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {startMonth} – {endMonth} · <span className="font-medium text-slate-600 dark:text-slate-300">{totalConsumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³</span> total · {filteredMeters.length} meters
                                            </p>
                                        </div>
                                        {activeDetailType && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedChartType(null); setSelectedType('All'); }}
                                                className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                            >
                                                Clear selection
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                    <div role="img" aria-label="Consumption by Type: horizontal bar chart ranking meter types by total water usage in cubic meters" className="h-[280px] sm:h-[320px] md:h-[360px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={consumptionChartData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 10, bottom: 25, left: 5 }}
                                                onClick={(state) => {
                                                    if (state?.activeLabel) {
                                                        const clickedType = state.activeLabel as string;
                                                        if (selectedChartType === clickedType) {
                                                            setSelectedChartType(null);
                                                            setSelectedType('All');
                                                        } else {
                                                            setSelectedChartType(clickedType);
                                                            setSelectedType(clickedType);
                                                        }
                                                    }
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'm³', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                                <YAxis type="category" dataKey="type" width={55} className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                                <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24} animationDuration={600} animationEasing="ease-out">
                                                    {consumptionChartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={TYPE_COLORS[entry.type] || CHART_COLORS.gray}
                                                            fillOpacity={activeDetailType && activeDetailType !== entry.type ? 0.25 : 1}
                                                            stroke={activeDetailType === entry.type ? (TYPE_COLORS[entry.type] || CHART_COLORS.gray) : 'none'}
                                                            strokeWidth={activeDetailType === entry.type ? 2 : 0}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {!activeDetailType && (
                                        <p className="text-[11px] text-slate-400 text-center mt-2">Click any bar to see detailed breakdown</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ── Type Detail Panel ── */}
                            {activeDetailType && typeDetailStats && (
                                <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-300">

                                    {/* Inline summary strip */}
                                    <div className="flex items-center gap-3 px-1 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[activeDetailType] || CHART_COLORS.gray }} />
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeDetailType}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">|</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{typeDetailStats.totalForType.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³</span>
                                            {' '}({typeDetailStats.pctOfTotal.toFixed(1)}% of total)
                                        </span>
                                        <span className="text-xs text-slate-400">|</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{typeDetailStats.meterCount} meters · avg {typeDetailStats.avgPerMeter.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³ each</span>
                                    </div>

                                    {/* Monthly Trend — full width */}
                                    <Card className="card-elevated">
                                        <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2">
                                            <CardTitle className="text-sm sm:text-base">Monthly Trend</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                                            <div role="img" aria-label={`Monthly consumption trend for ${activeDetailType || 'selected meter type'}: area chart showing cubic meter usage per month`} className="h-[220px] sm:h-[260px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={typeTrendData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                                                        <defs>
                                                            <linearGradient id="typeGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={TYPE_COLORS[activeDetailType] || CHART_COLORS.primary} stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor={TYPE_COLORS[activeDetailType] || CHART_COLORS.primary} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, rgba(148,163,184,0.15))" />
                                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                                        <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} />
                                                        <Tooltip content={<LiquidTooltip />} />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="consumption"
                                                            stroke={TYPE_COLORS[activeDetailType] || CHART_COLORS.primary}
                                                            strokeWidth={2}
                                                            fill="url(#typeGradient)"
                                                            animationDuration={600} animationEasing="ease-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Top Meters Table */}
                                    <Card className="card-elevated">
                                        <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2">
                                            <CardTitle className="text-sm sm:text-base">Representing Meters</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead scope="col" className="text-xs pl-4 sm:pl-6 w-8">#</TableHead>
                                                            <TableHead scope="col" className="text-xs">Meter</TableHead>
                                                            <TableHead scope="col" className="text-xs">Zone</TableHead>
                                                            <TableHead scope="col" className="text-xs text-right pr-4 sm:pr-6">Consumption (m³)</TableHead>
                                                            <TableHead scope="col" className="text-xs text-right pr-4 sm:pr-6 hidden sm:table-cell w-36">Share</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {typeTopConsumers.map((meter, idx) => (
                                                            <TableRow key={meter.label}>
                                                                <TableCell className="text-xs text-slate-400 pl-4 sm:pl-6 font-mono">{idx + 1}</TableCell>
                                                                <TableCell className="text-xs font-medium">{meter.label}</TableCell>
                                                                <TableCell className="text-xs text-slate-500">
                                                                    {ZONE_CONFIG.find(z => z.code === meter.zone)?.name || meter.zone}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-right font-mono pr-4 sm:pr-6">
                                                                    {meter.total.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-right pr-4 sm:pr-6 hidden sm:table-cell">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full transition-all"
                                                                                style={{
                                                                                    width: `${typeDetailStats.totalForType > 0 ? Math.max((meter.total / typeDetailStats.totalForType) * 100, 2) : 0}%`,
                                                                                    backgroundColor: TYPE_COLORS[activeDetailType] || CHART_COLORS.primary,
                                                                                    opacity: 0.85
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-slate-400 w-10 text-right">
                                                                            {typeDetailStats.totalForType > 0 ? ((meter.total / typeDetailStats.totalForType) * 100).toFixed(1) : '0'}%
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Database Tab - Airtable Embed */}
                    {monthlyTab === 'database' && (
                        <div id="panel-database" role="tabpanel" aria-labelledby="tab-database" tabIndex={0} className="motion-safe:animate-in motion-safe:fade-in duration-200">
                            <Card className="card-elevated overflow-hidden">
                                <CardContent className="p-0">
                                    <iframe
                                        className="airtable-embed w-full"
                                        src="https://airtable.com/embed/appvmeThHxvhcbgcx/shrc2NpaEz7nXwZWm"
                                        width="100%"
                                        loading="lazy"
                                        title="Water Operations Database"
                                        sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation allow-forms allow-same-origin"
                                        style={{ background: 'transparent', border: 'none', height: 'clamp(600px, 80vh, 1200px)' }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Daily Dashboard View */}
            {dashboardView === 'daily' && (
                <div id="panel-daily" role="tabpanel" aria-labelledby="tab-daily" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    <DailyWaterReport />
                </div>
            )}
        </div>
    );
}

