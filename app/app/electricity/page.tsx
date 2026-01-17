"use client";

import { useEffect, useState, useMemo } from "react";
import { getElectricityMeters, MeterReading } from "@/lib/mock-data";
import { getElectricityMetersFromSupabase } from "@/lib/supabase";
import { ELECTRICITY_RATES } from "@/lib/config";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, DollarSign, MapPin, TrendingUp, BarChart3, Database, Wifi, WifiOff, CalendarDays, RotateCcw, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend } from "recharts";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";

// Use centralized config for rates
const ratePerKWh = ELECTRICITY_RATES.RATE_PER_KWH;

export default function ElectricityPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<"supabase" | "mock">("mock");
    const [debugError, setDebugError] = useState<string | null>(null);
    const [readingsCount, setReadingsCount] = useState<number>(0);
    const [analysisType, setAnalysisType] = useState<string>("All");
    const [dateRangeIndex, setDateRangeIndex] = useState<[number, number]>([0, 100]);
    // Date range state for Overview tab
    const [startMonth, setStartMonth] = useState<string>("Apr-24");
    const [endMonth, setEndMonth] = useState<string>("Dec-25");

    // Database table sorting and pagination state
    const [dbSortField, setDbSortField] = useState<string>('label');
    const [dbSortDirection, setDbSortDirection] = useState<'asc' | 'desc'>('asc');
    const [dbCurrentPage, setDbCurrentPage] = useState(1);
    const dbPageSize = 15;
    const [dbSearchTerm, setDbSearchTerm] = useState('');
    // Year filter state
    const [selectedYear, setSelectedYear] = useState<string>("All");

    useEffect(() => {
        async function loadData() {
            try {
                // Try to fetch from Supabase first
                const supabaseData = await getElectricityMetersFromSupabase();
                if (supabaseData && supabaseData.length > 0) {
                    setMeters(supabaseData);
                    setDataSource("supabase");
                    // Count total readings
                    const totalReadings = supabaseData.reduce((sum, m) => sum + Object.keys(m.readings).length, 0);
                    setReadingsCount(totalReadings);
                } else {
                    throw new Error("Supabase returned empty data");
                }
            } catch (e: any) {
                console.error("Supabase load error:", e);
                setDebugError(e.message || "Unknown error");

                try {
                    const mockData = await getElectricityMeters();
                    setMeters(mockData);
                    setDataSource("mock");
                } catch (mockError) {
                    // console.error("Failed to load mock data as well", mockError);
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Load saved filter preferences
        const savedPrefs = loadFilterPreferences<{
            activeTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedYear?: string;
            analysisType?: string;
            dateRangeIndex?: [number, number];
        }>('electricity');
        if (savedPrefs) {
            if (savedPrefs.activeTab) setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedYear) setSelectedYear(savedPrefs.selectedYear);
            if (savedPrefs.analysisType) setAnalysisType(savedPrefs.analysisType);
            if (savedPrefs.dateRangeIndex) setDateRangeIndex(savedPrefs.dateRangeIndex);
        }
    }, []);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('electricity', {
            activeTab,
            startMonth,
            endMonth,
            selectedYear,
            analysisType,
            dateRangeIndex
        });
    }, [activeTab, startMonth, endMonth, selectedYear, analysisType, dateRangeIndex]);

    // Get all unique months and sort them (must be declared before stats)
    const allMonths = useMemo(() => {
        const monthsSet = new Set<string>();
        meters.forEach(m => Object.keys(m.readings).forEach(month => monthsSet.add(month)));

        // Sort chronologically
        return Array.from(monthsSet).sort((a, b) => {
            const [aMonth, aYear] = a.split('-');
            const [bMonth, bYear] = b.split('-');
            const monthOrder: Record<string, number> = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
            const yearA = parseInt('20' + aYear);
            const yearB = parseInt('20' + bYear);
            if (yearA !== yearB) return yearA - yearB;
            return (monthOrder[aMonth] || 0) - (monthOrder[bMonth] || 0);
        });
    }, [meters]);

    // Extract available years from the data
    const availableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        allMonths.forEach(month => {
            const year = '20' + month.split('-')[1];
            yearsSet.add(year);
        });
        return ['All', ...Array.from(yearsSet).sort()];
    }, [allMonths]);

    // Filter months by selected year
    const filteredMonthsByYear = useMemo(() => {
        if (selectedYear === 'All') return allMonths;
        return allMonths.filter(month => {
            const year = '20' + month.split('-')[1];
            return year === selectedYear;
        });
    }, [allMonths, selectedYear]);

    // Database view: filter, sort, and paginate meters
    const dbFilteredMeters = useMemo(() => {
        let result = [...meters];

        // Search filter
        if (dbSearchTerm) {
            const term = dbSearchTerm.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(term) ||
                m.account_number.toLowerCase().includes(term) ||
                m.type.toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (dbSortField) {
                case 'label': aVal = a.name; bVal = b.name; break;
                case 'account': aVal = a.account_number; bVal = b.account_number; break;
                case 'type': aVal = a.type; bVal = b.type; break;
                default:
                    // Check if it's a month column
                    if (allMonths.includes(dbSortField)) {
                        aVal = a.readings[dbSortField] || 0;
                        bVal = b.readings[dbSortField] || 0;
                    } else {
                        aVal = a.name; bVal = b.name;
                    }
            }

            if (typeof aVal === 'string') {
                return dbSortDirection === 'asc'
                    ? aVal.localeCompare(bVal as string)
                    : (bVal as string).localeCompare(aVal);
            }
            return dbSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });

        return result;
    }, [meters, dbSearchTerm, dbSortField, dbSortDirection, allMonths]);

    const dbTotalPages = Math.ceil(dbFilteredMeters.length / dbPageSize);
    const dbStartIndex = (dbCurrentPage - 1) * dbPageSize;
    const dbPaginatedMeters = dbFilteredMeters.slice(dbStartIndex, dbStartIndex + dbPageSize);

    const handleDbSort = (field: string) => {
        if (dbSortField === field) {
            setDbSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setDbSortField(field);
            setDbSortDirection('asc');
        }
        setDbCurrentPage(1);
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

    const stats = useMemo(() => {
        // Get months within selected range
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        const rangeMonths = startIdx >= 0 && endIdx >= 0
            ? allMonths.slice(startIdx, endIdx + 1)
            : allMonths;

        // Calculate totals across selected months
        const totalConsumption = meters.reduce((sum, meter) => {
            return sum + rangeMonths.reduce((mSum, month) => mSum + (meter.readings[month] || 0), 0);
        }, 0);

        // Total cost
        const totalCost = totalConsumption * ratePerKWh;

        // Highest consumer in range
        const highest = meters.reduce((max, meter) => {
            const c = rangeMonths.reduce((s, month) => s + (meter.readings[month] || 0), 0);
            return c > max.val ? { name: meter.name, val: c } : max;
        }, { name: "N/A", val: 0 });

        const rangeLabel = startMonth && endMonth ? `${startMonth} - ${endMonth}` : "All Time";

        // Calculate previous period for trend comparison
        const prevEndIdx = startIdx > 0 ? startIdx - 1 : -1;
        const prevStartIdx = prevEndIdx >= 0 ? Math.max(0, prevEndIdx - (endIdx - startIdx)) : -1;

        let prevConsumption = 0;
        let prevCost = 0;
        if (prevStartIdx >= 0 && prevEndIdx >= 0) {
            const prevMonths = allMonths.slice(prevStartIdx, prevEndIdx + 1);
            prevConsumption = meters.reduce((sum, meter) => {
                return sum + prevMonths.reduce((mSum, month) => mSum + (meter.readings[month] || 0), 0);
            }, 0);
            prevCost = prevConsumption * ratePerKWh;
        }

        const consumptionTrend = calcTrend(totalConsumption, prevConsumption);
        const costTrend = calcTrend(totalCost, prevCost);

        return [
            {
                label: "TOTAL CONSUMPTION",
                value: `${(totalConsumption / 1000).toFixed(1)} MWh`,
                subtitle: rangeLabel,
                icon: Zap,
                variant: "warning" as const,
                trend: consumptionTrend.trend,
                trendValue: consumptionTrend.trendValue
            },
            {
                label: "TOTAL COST",
                value: `${totalCost.toLocaleString('en-US')} OMR`,
                subtitle: `@ ${ratePerKWh} OMR/kWh`,
                icon: DollarSign,
                variant: "success" as const,
                trend: costTrend.trend,
                trendValue: costTrend.trendValue
            },
            {
                label: "METER COUNT",
                value: meters.length.toString(),
                subtitle: "Active Meters",
                icon: MapPin,
                variant: "water" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            },
            {
                label: "HIGHEST CONSUMER",
                value: highest.name,
                subtitle: `${Math.round(highest.val).toLocaleString('en-US')} kWh`,
                icon: TrendingUp,
                variant: "danger" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            }
        ];
    }, [meters, allMonths, startMonth, endMonth]);

    // Monthly data filtered by selected range (for Overview chart)
    const filteredMonthlyData = useMemo(() => {
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        const rangeMonths = startIdx >= 0 && endIdx >= 0
            ? allMonths.slice(startIdx, endIdx + 1)
            : allMonths;

        return rangeMonths.map(month => {
            const total = meters.reduce((sum, m) => sum + (m.readings[month] || 0), 0);
            return { month, consumption: total };
        });
    }, [meters, allMonths, startMonth, endMonth]);

    // --- Consumption By Type (for Overview) - filtered by range ---
    const consumptionByType = useMemo(() => {
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        const rangeMonths = startIdx >= 0 && endIdx >= 0
            ? allMonths.slice(startIdx, endIdx + 1)
            : allMonths;

        const grouped: Record<string, number> = {};
        meters.forEach(m => {
            const type = m.type || "Unknown";
            const c = rangeMonths.reduce((s, month) => s + (m.readings[month] || 0), 0);
            grouped[type] = (grouped[type] || 0) + c;
        });

        return Object.entries(grouped).map(([type, val], i) => ({
            type,
            value: val,
            color: ["#E8A838", "#5BA88B", "#81D8D0", "#6B5F73", "#C95D63"][i % 5]
        })).sort((a, b) => b.value - a.value);
    }, [meters, allMonths, startMonth, endMonth]);

    // Range change handlers for DateRangePicker
    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    const handleResetRange = () => {
        if (allMonths.length > 0) {
            setStartMonth(allMonths[0]);
            setEndMonth(allMonths[allMonths.length - 1]);
        }
    };

    // 2. Get available types and their counts
    const meterTypes = useMemo(() => {
        const types = new Map<string, number>();
        meters.forEach(m => {
            const t = m.type || "Unknown";
            types.set(t, (types.get(t) || 0) + 1);
        });
        return Array.from(types.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
    }, [meters]);

    // 3. Filtered Data Provider
    const analysisData = useMemo(() => {
        const monthsToUse = filteredMonthsByYear.length > 0 ? filteredMonthsByYear : allMonths;
        if (monthsToUse.length === 0) return { stats: [], chartData: [], tableData: [], dateRangeLabel: "" };

        // Determine Index Range based on filtered months
        const startIdx = Math.floor((dateRangeIndex[0] / 100) * (monthsToUse.length - 1));
        const endIdx = Math.floor((dateRangeIndex[1] / 100) * (monthsToUse.length - 1));
        const selectedMonths = monthsToUse.slice(startIdx, endIdx + 1);

        // Filter Meters by Type
        const filteredMeters = analysisType === "All"
            ? meters
            : meters.filter(m => m.type === analysisType);

        // Aggregate Data
        let totalConsumption = 0;
        let totalCost = 0;
        let highestConsumer = { name: "N/A", val: 0 };
        const chartMap: Record<string, number> = {};

        // Initialize chart map for selected months
        selectedMonths.forEach(m => chartMap[m] = 0);

        const tableRows = filteredMeters.map(meter => {
            let meterConsumption = 0;
            selectedMonths.forEach(month => {
                const val = meter.readings[month] || 0;
                meterConsumption += val;
                chartMap[month] = (chartMap[month] || 0) + val;
            });
            totalConsumption += meterConsumption;

            if (meterConsumption > highestConsumer.val) {
                highestConsumer = { name: meter.name, val: meterConsumption };
            }

            return {
                ...meter,
                rangeConsumption: meterConsumption,
                rangeCost: meterConsumption * ratePerKWh
            };
        }).sort((a, b) => b.rangeConsumption - a.rangeConsumption);

        totalCost = totalConsumption * ratePerKWh;

        // Formats for Chart
        const chartData = selectedMonths.map(month => ({
            month,
            consumption: chartMap[month],
        }));

        // Stats Cards Data
        const stats = [
            {
                label: "TOTAL CONSUMPTION",
                value: `${(totalConsumption / 1000).toFixed(2)} MWh`,
                subtitle: "in selected period",
                icon: Zap,
                variant: "primary" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            },
            {
                label: "TOTAL COST",
                value: `${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OMR`,
                subtitle: `at ${ratePerKWh} OMR/kWh`,
                icon: DollarSign,
                variant: "success" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            },
            {
                label: "METER COUNT",
                value: filteredMeters.length.toString(),
                subtitle: analysisType === "All" ? "Total Meters" : `${analysisType} Meters`,
                icon: MapPin,
                variant: "warning" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            },
            {
                label: "HIGHEST CONSUMER",
                value: highestConsumer.name,
                subtitle: `${(highestConsumer.val / 1000).toFixed(1)} MWh`,
                icon: TrendingUp,
                variant: "danger" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            }
        ];

        const startMonthStr = selectedMonths[0];
        const endMonthStr = selectedMonths[selectedMonths.length - 1];

        // Top consumers data for bar chart (top 10)
        const topConsumers = tableRows.slice(0, 10).map((meter, idx) => ({
            name: meter.name.length > 20 ? meter.name.substring(0, 20) + '...' : meter.name,
            fullName: meter.name,
            consumption: meter.rangeConsumption,
            cost: meter.rangeCost,
            color: idx === 0 ? '#E8A838' : idx === 1 ? '#F59E0B' : idx === 2 ? '#FBBF24' : '#81D8D0'
        }));

        return {
            stats,
            chartData,
            tableData: tableRows,
            topConsumers,
            dateRangeLabel: `${startMonthStr} - ${endMonthStr}`
        };

    }, [meters, allMonths, filteredMonthsByYear, analysisType, dateRangeIndex]);

    const handleReset = () => {
        setDateRangeIndex([0, 100]);
        setAnalysisType("All");
        setSelectedYear("All");
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-300">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-8 w-36 rounded-full" />
                </div>
                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
                {/* Date filter skeleton */}
                <div className="p-6 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-800/50">
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

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Electricity Monitoring"
                    description="Track power consumption and costs across all meters"
                />
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${dataSource === 'supabase' ? 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success-hover' : 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning'}`}>
                        {dataSource === 'supabase' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {dataSource === 'supabase' ? 'Live Data (Supabase)' : 'Demo Data (Local)'}
                    </div>
                    {dataSource === 'supabase' && <span className="text-[10px] text-muted-foreground mr-2">{readingsCount} readings</span>}
                    {debugError && <span className="text-[10px] text-red-500 font-bold mr-2">Error: {debugError}</span>}
                </div>
            </div>

            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { key: "overview", label: "Overview", icon: BarChart3 },
                    { key: "analysis", label: "Analysis by Type", icon: TrendingUp },
                    { key: "database", label: "Database", icon: Database },
                ]}
            />

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Date Range Picker with Year Selector */}
                    {allMonths.length > 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-4">
                                    {/* Year Selector Row */}
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Year:</span>
                                            <div className="flex items-center gap-2">
                                                {availableYears.map((year) => (
                                                    <Button
                                                        key={year}
                                                        variant={selectedYear === year ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedYear(year);
                                                            // Update the month range to match the selected year
                                                            if (year === 'All') {
                                                                setStartMonth(allMonths[0]);
                                                                setEndMonth(allMonths[allMonths.length - 1]);
                                                            } else {
                                                                const yearMonths = allMonths.filter(m => '20' + m.split('-')[1] === year);
                                                                if (yearMonths.length > 0) {
                                                                    setStartMonth(yearMonths[0]);
                                                                    setEndMonth(yearMonths[yearMonths.length - 1]);
                                                                }
                                                            }
                                                        }}
                                                        className={`rounded-full px-4 ${selectedYear === year ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-slate-200 dark:border-slate-700"}`}
                                                    >
                                                        {year}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                            {filteredMonthsByYear.length} Months Available
                                        </Badge>
                                    </div>

                                    {/* Date Range Picker */}
                                    <DateRangePicker
                                        startMonth={startMonth || allMonths[0]}
                                        endMonth={endMonth || allMonths[allMonths.length - 1]}
                                        availableMonths={selectedYear === 'All' ? allMonths : filteredMonthsByYear}
                                        onRangeChange={handleRangeChange}
                                        onReset={handleResetRange}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <StatsGrid stats={stats} />

                    <div className="grid gap-6 lg:grid-cols-5">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Monthly Consumption Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E8A838" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#E8A838" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                                            <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Area type="natural" dataKey="consumption" name="Consumption" stroke="#E8A838" fill="url(#elecGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Consumption by Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={consumptionByType} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="type" width={100} className="text-xs" axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                                {consumptionByType.map((entry, index) => (
                                                    <Cell key={`c-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-6 animate-in fade-in duration-500">

                    {/* Controls Card */}
                    <Card className="glass-card">
                        <CardContent className="p-4 space-y-6">
                            {/* Year Selector Row */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Year:</span>
                                    <div className="flex items-center gap-2">
                                        {availableYears.map((year) => (
                                            <Button
                                                key={year}
                                                variant={selectedYear === year ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedYear(year)}
                                                className={`rounded-full px-4 ${selectedYear === year ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-slate-200 dark:border-slate-700"}`}
                                            >
                                                {year}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Date Range and Meters Info Row */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border text-sm font-medium">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <span>{analysisData.dateRangeLabel}</span>
                                    </div>
                                    <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                        {analysisData.tableData.length} Meters Found
                                    </Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                    Reset Filters
                                </Button>
                            </div>

                            {/* Slider */}
                            <div className="px-2 pt-2">
                                <Slider
                                    value={dateRangeIndex}
                                    onValueChange={(val) => setDateRangeIndex([val[0], val[1]])} // force tuple type
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    <span>{filteredMonthsByYear[0] || allMonths[0]}</span>
                                    <span>{filteredMonthsByYear[filteredMonthsByYear.length - 1] || allMonths[allMonths.length - 1]}</span>
                                </div>
                            </div>

                            {/* Type Chips */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                                <Button
                                    variant={analysisType === "All" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAnalysisType("All")}
                                    className={`rounded-full h-8 ${analysisType === "All" ? "bg-mb-primary hover:bg-mb-primary/90" : "border-slate-200 dark:border-slate-700"}`}
                                >
                                    All <span className="ml-1.5 opacity-70 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{meters.length}</span>
                                </Button>
                                {meterTypes.map((t) => (
                                    <Button
                                        key={t.type}
                                        variant={analysisType === t.type ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setAnalysisType(t.type)}
                                        className={`rounded-full h-8 ${analysisType === t.type ? "bg-mb-secondary-active hover:bg-mb-secondary-active/90 border-transparent text-white" : "border-slate-200 dark:border-slate-700"}`}
                                    >
                                        {t.type} <span className="ml-1.5 opacity-70 bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{t.count}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filtered Stats Grid */}
                    <StatsGrid stats={analysisData.stats} />

                    {/* Chart & Table */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <CardTitle className="text-lg">Monthly Trend for {analysisType === "All" ? "All Types (Total)" : analysisType}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="anlGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                                        <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="consumption" stroke="#81D8D0" fill="url(#anlGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Consumers Bar Chart */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <CardTitle className="text-lg">Top 10 {analysisType === "All" ? "Overall" : analysisType} Consumers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analysisData.topConsumers}
                                        layout="vertical"
                                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                    >
                                        <defs>
                                            <linearGradient id="topConsumerGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#E8A838" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#81D8D0" stopOpacity={0.9} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.06)" />
                                        <XAxis
                                            type="number"
                                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: "#6B7280" }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={150}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: "#6B7280" }}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="glass-card px-4 py-3 border border-white/50 shadow-xl !rounded-xl !bg-white/90 dark:!bg-slate-900/90 backdrop-blur-md">
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{data.fullName}</p>
                                                            <div className="flex items-center gap-2 text-xs mb-1">
                                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                                <span className="text-slate-500 dark:text-slate-400">Consumption:</span>
                                                                <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                                                                    {data.consumption.toLocaleString()} kWh
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                <span className="text-slate-500 dark:text-slate-400">Cost:</span>
                                                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                                    {data.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                                        />
                                        <Bar
                                            dataKey="consumption"
                                            radius={[0, 8, 8, 0]}
                                            barSize={28}
                                            animationDuration={1500}
                                        >
                                            {(analysisData.topConsumers || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Meter Details</CardTitle>
                                <div className="text-xs text-muted-foreground">Showing {analysisData.tableData.length} of {meters.length} meters</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-[600px] rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
                                        <tr className="border-b">
                                            <th className="p-4 text-left font-medium text-muted-foreground w-[250px]">Name</th>
                                            <th className="p-4 text-left font-medium text-muted-foreground">Account #</th>
                                            <th className="p-4 text-left font-medium text-muted-foreground">Type</th>
                                            <th className="p-4 text-right font-medium text-muted-foreground">Consumption (Range)</th>
                                            <th className="p-4 text-right font-medium text-muted-foreground">Cost (Range)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {analysisData.tableData.map((meter) => (
                                            <tr key={meter.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-medium text-foreground">{meter.name}</td>
                                                <td className="p-4 text-muted-foreground text-xs font-mono">{meter.account_number}</td>
                                                <td className="p-4">
                                                    <Badge variant="secondary" className="font-normal text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        {meter.type}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right font-mono font-medium">
                                                    {meter.rangeConsumption.toLocaleString()} <span className="text-xs text-muted-foreground">kWh</span>
                                                </td>
                                                <td className="p-4 text-right font-mono font-medium text-mb-success dark:text-mb-success-hover">
                                                    {meter.rangeCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-muted-foreground">OMR</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
            }

            {
                activeTab === 'database' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle>Meter Database</CardTitle>
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search meters..."
                                            value={dbSearchTerm}
                                            onChange={(e) => { setDbSearchTerm(e.target.value); setDbCurrentPage(1); }}
                                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-auto max-h-[500px] rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="text-left bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleDbSort('label')}>
                                                    <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div>
                                                </th>
                                                <th className="p-3 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleDbSort('account')}>
                                                    <div className="flex items-center gap-1">Account <ArrowUpDown className="w-3 h-3" /></div>
                                                </th>
                                                <th className="p-3 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleDbSort('type')}>
                                                    <div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3" /></div>
                                                </th>
                                                <th className="p-3 font-medium text-right">Total (kWh)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dbPaginatedMeters.map(meter => {
                                                const sum = Object.values(meter.readings).reduce((a, b) => a + b, 0);
                                                return (
                                                    <tr key={meter.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="p-3">{meter.name}</td>
                                                        <td className="p-3 text-muted-foreground">{meter.account_number}</td>
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800">
                                                                {meter.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right font-mono">{sum.toLocaleString('en-US')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                {dbFilteredMeters.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 px-2">
                                        <span className="text-sm text-muted-foreground">
                                            Showing {dbStartIndex + 1} - {Math.min(dbStartIndex + dbPageSize, dbFilteredMeters.length)} of {dbFilteredMeters.length}
                                        </span>
                                        {dbTotalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDbCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={dbCurrentPage === 1}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <span className="text-sm text-muted-foreground">
                                                    Page {dbCurrentPage} of {dbTotalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDbCurrentPage(prev => Math.min(dbTotalPages, prev + 1))}
                                                    disabled={dbCurrentPage === dbTotalPages}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
