"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { CSVUploadDialog } from "@/components/water/CSVUploadDialog";
import { WaterLossDaily, DailyWaterConsumption } from "@/entities/water";
import { ZONE_CONFIG, AVAILABLE_MONTHS } from "@/lib/water-data";
import {
    getWaterLossDailyFromSupabase,
    getDailyWaterConsumptionFromSupabase,
    isSupabaseConfigured
} from "@/lib/supabase";
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    Wifi,
    WifiOff,
    RotateCcw,
    Search,
    ArrowUpDown
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from "recharts";
import { cn } from "@/lib/utils";

// Brand colors
const BRAND = {
    primary: '#4E4456',
    accent: '#81D8D0',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    muted: '#6B7280',
};

// Zone display mapping for daily data (matching water_loss_daily table zones)
const DAILY_ZONES = [
    { code: 'Zone FM', name: 'Zone FM', zoneCode: 'Zone_01_(FM)' },
    { code: 'Zone 3A', name: 'Zone 3A', zoneCode: 'Zone_03_(A)' },
    { code: 'Zone 3B', name: 'Zone 3B', zoneCode: 'Zone_03_(B)' },
    { code: 'Zone 5', name: 'Zone 5', zoneCode: 'Zone_05' },
    { code: 'Zone 08', name: 'Zone 8', zoneCode: 'Zone_08' },
    { code: 'Village Square', name: 'Village Square', zoneCode: 'Zone_VS' },
    { code: 'Sales Center', name: 'Sales Center', zoneCode: 'Zone_SC' },
];

// Level badge colors
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
    'L1': { bg: 'bg-emerald-500', text: 'text-white' },
    'L2': { bg: 'bg-blue-500', text: 'text-white' },
    'L3': { bg: 'bg-indigo-500', text: 'text-white' },
    'L4': { bg: 'bg-rose-500', text: 'text-white' },
    'DC': { bg: 'bg-amber-500', text: 'text-white' },
};

interface MeterDailyReading {
    accountNumber: string;
    meterName: string;
    level: string;
    type: string;
    zone: string;
    reading: number;
}

export function DailyWaterReport() {
    // State
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedZone, setSelectedZone] = useState('Zone FM');
    const [dailyLossData, setDailyLossData] = useState<WaterLossDaily[]>([]);
    const [dailyConsumption, setDailyConsumption] = useState<DailyWaterConsumption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
    const [refreshKey, setRefreshKey] = useState(0);

    // Table state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('meterName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Get the most recent month with data (last in AVAILABLE_MONTHS that has daily data)
    const [selectedMonth, setSelectedMonth] = useState(AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1]);

    // Parse month and year from the selected month (e.g., "Jan-26" -> year: 2026, month: "Jan-26")
    const currentMonth = selectedMonth;
    const currentYear = parseInt('20' + selectedMonth.split('-')[1]);

    // Callback to trigger refresh after CSV upload
    const handleUploadComplete = useCallback(() => {
        console.log('[DailyWaterReport] CSV upload complete, refreshing data...');
        setRefreshKey(prev => prev + 1);
    }, []);

    // Get max day from data
    const maxDay = useMemo(() => {
        if (dailyLossData.length === 0) return 19;
        return Math.max(...dailyLossData.map(d => d.day));
    }, [dailyLossData]);

    // Fetch data
    useEffect(() => {
        async function fetchDailyData() {
            setIsLoading(true);
            setHasError(false);
            try {
                if (isSupabaseConfigured()) {
                    const [lossData, consumptionData] = await Promise.all([
                        getWaterLossDailyFromSupabase(undefined, currentMonth, currentYear),
                        getDailyWaterConsumptionFromSupabase(currentMonth, currentYear)
                    ]);

                    if (lossData.length > 0) {
                        setDailyLossData(lossData);
                        setDailyConsumption(consumptionData);
                        setDataSource('supabase');
                    } else {
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
    }, [refreshKey, selectedMonth, currentMonth, currentYear]);

    // Get analysis for selected zone and day
    const zoneAnalysis = useMemo(() => {
        const record = dailyLossData.find(d => d.zone === selectedZone && d.day === selectedDay);
        if (!record) {
            return {
                bulkMeterReading: 0,
                individualTotal: 0,
                loss: 0,
                lossPercent: 0,
                efficiency: 0
            };
        }
        return {
            bulkMeterReading: record.l2TotalM3,
            individualTotal: record.l3TotalM3,
            loss: record.lossM3,
            lossPercent: record.lossPercent,
            efficiency: record.l2TotalM3 > 0 ? (record.l3TotalM3 / record.l2TotalM3) * 100 : 0
        };
    }, [dailyLossData, selectedZone, selectedDay]);

    // Daily trend data for the selected zone
    const zoneTrendData = useMemo(() => {
        const zoneRecords = dailyLossData
            .filter(d => d.zone === selectedZone)
            .sort((a, b) => a.day - b.day);

        return zoneRecords.map(d => ({
            day: `Day ${d.day}`,
            dayNum: d.day,
            'Zone Bulk': d.l2TotalM3,
            'Individual Total': d.l3TotalM3,
            'Loss': Math.abs(d.lossM3)
        }));
    }, [dailyLossData, selectedZone]);

    // Get zone code for filtering meters
    const selectedZoneCode = useMemo(() => {
        return DAILY_ZONES.find(z => z.code === selectedZone)?.zoneCode || '';
    }, [selectedZone]);

    // Individual meters data for the table
    const meterTableData = useMemo<MeterDailyReading[]>(() => {
        // Filter consumption data by zone and get reading for selected day
        return dailyConsumption
            .filter(d => {
                // Match by zone code in the meterName or accountNumber patterns
                const zoneName = selectedZoneCode.toLowerCase();
                const meterZone = (d.meterName || '').toLowerCase();

                // Basic zone matching logic
                if (selectedZone === 'Zone FM') {
                    return meterZone.includes('fm') || meterZone.includes('b1') || meterZone.includes('b2') ||
                        meterZone.includes('b3') || meterZone.includes('b4') || meterZone.includes('b5') ||
                        meterZone.includes('b6') || meterZone.includes('b7') || meterZone.includes('b8') ||
                        meterZone.includes('cif');
                }
                if (selectedZone === 'Zone 3A') {
                    return (meterZone.includes('z3-') || meterZone.includes('d-44') ||
                        meterZone.includes('d-45') || meterZone.includes('d-46') ||
                        meterZone.includes('d-47') || meterZone.includes('d-51') ||
                        meterZone.includes('d-74') || meterZone.includes('d-75')) &&
                        !meterZone.includes('z3-3') && !meterZone.includes('z3-8') && !meterZone.includes('z3-12');
                }
                if (selectedZone === 'Zone 3B') {
                    return meterZone.includes('z3-3') || meterZone.includes('z3-8') || meterZone.includes('z3-12') ||
                        meterZone.includes('d-52') || meterZone.includes('d-53') || meterZone.includes('d-54');
                }
                if (selectedZone === 'Zone 5') {
                    return meterZone.includes('z5-');
                }
                if (selectedZone === 'Zone 08') {
                    return meterZone.includes('z8-');
                }
                if (selectedZone === 'Village Square') {
                    return meterZone.includes('coffee') || meterZone.includes('laundry') || meterZone.includes('village');
                }
                if (selectedZone === 'Sales Center') {
                    return meterZone.includes('sale') || meterZone.includes('caffe');
                }
                return false;
            })
            .map(d => ({
                accountNumber: d.accountNumber,
                meterName: d.meterName,
                level: d.label || 'L3',
                type: d.type || 'Residential',
                zone: selectedZone,
                reading: d.dailyReadings[selectedDay] || 0
            }));
    }, [dailyConsumption, selectedZone, selectedDay, selectedZoneCode]);

    // Filtered, sorted, and paginated meters
    const processedMeters = useMemo(() => {
        let result = [...meterTableData];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.meterName.toLowerCase().includes(term) ||
                m.accountNumber.toLowerCase().includes(term) ||
                m.type.toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (sortField) {
                case 'meterName': aVal = a.meterName; bVal = b.meterName; break;
                case 'accountNumber': aVal = a.accountNumber; bVal = b.accountNumber; break;
                case 'type': aVal = a.type; bVal = b.type; break;
                case 'reading': aVal = a.reading; bVal = b.reading; break;
                default: aVal = a.meterName; bVal = b.meterName;
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
            }
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });

        return result;
    }, [meterTableData, searchTerm, sortField, sortDirection]);

    const totalPages = Math.ceil(processedMeters.length / pageSize);
    const paginatedMeters = processedMeters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSelectedDay(1);
        setSelectedZone('Zone FM');
        setSelectedMonth(AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1]);
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
                <ChartSkeleton height="h-[350px]" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    // Error state
    if (hasError || dailyLossData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Daily Data Available</h3>
                <p className="text-muted-foreground max-w-md">
                    Daily water loss data for {currentMonth} is not yet available in the database.
                    Please ensure the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">water_loss_daily</code> table is populated.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Controls Card */}
            <Card className="glass-card">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col gap-5">
                        {/* Day Selector Row */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Select Day</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                                    disabled={selectedDay <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex-1 max-w-xs">
                                    <Slider
                                        value={[selectedDay]}
                                        onValueChange={(val) => setSelectedDay(val[0])}
                                        min={1}
                                        max={maxDay}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => setSelectedDay(Math.min(maxDay, selectedDay + 1))}
                                    disabled={selectedDay >= maxDay}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-bold text-primary min-w-[60px]">Day {selectedDay}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDay(1); }}
                                    className="px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {AVAILABLE_MONTHS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                                dataSource === 'supabase'
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                                {dataSource === 'supabase' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                {dataSource === 'supabase' ? 'Live Data' : 'Demo Data'}
                            </div>
                        </div>

                        {/* Zone Selector Row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Zone</span>
                            <div className="flex flex-wrap gap-2">
                                {DAILY_ZONES.map((zone) => {
                                    const isSelected = zone.code === selectedZone;
                                    return (
                                        <button
                                            key={zone.code}
                                            onClick={() => { setSelectedZone(zone.code); setCurrentPage(1); }}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                isSelected
                                                    ? "bg-primary text-white shadow-md"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            {zone.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <CSVUploadDialog
                                    month={currentMonth}
                                    year={currentYear}
                                    onUploadComplete={handleUploadComplete}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Zone Heading */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {selectedZone} Analysis for Day {selectedDay}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-secondary font-medium">Zone Bulk</span> = L2 only •
                    <span className="text-primary font-medium"> L3/L4 total</span> = L3 + L4 (metered) •
                    <span className="text-red-500 font-medium"> Difference</span> = L2 - (L3 + L4)
                </p>
            </div>

            {/* Progress Rings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <Card className="glass-card">
                    <CardContent className="p-6 flex justify-center">
                        <LiquidProgressRing
                            value={zoneAnalysis.bulkMeterReading}
                            max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                            label="Zone Bulk Meter Total"
                            sublabel="Total water entering zone (L2)"
                            color={BRAND.accent}
                            size={160}
                            showPercentage={false}
                            elementId="gauge-daily-1"
                        />
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-6 flex justify-center">
                        <LiquidProgressRing
                            value={zoneAnalysis.individualTotal}
                            max={Math.max(zoneAnalysis.bulkMeterReading, zoneAnalysis.individualTotal) * 1.2 || 100}
                            label="Individual Meters Sum"
                            sublabel="Recorded by individual meters (L3+L4)"
                            color={BRAND.primary}
                            size={160}
                            showPercentage={false}
                            elementId="gauge-daily-2"
                        />
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-6 flex justify-center">
                        <LiquidProgressRing
                            value={Math.abs(zoneAnalysis.loss)}
                            max={zoneAnalysis.bulkMeterReading || 100}
                            label="Water Loss Distribution"
                            sublabel={`${zoneAnalysis.lossPercent.toFixed(1)}% • Leakage, meter loss, etc.`}
                            color={zoneAnalysis.loss > 0 ? BRAND.danger : BRAND.success}
                            size={160}
                            showPercentage={true}
                            elementId="gauge-daily-3"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Zone Consumption Trend Chart */}
            <Card className="glass-card">
                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">Zone Consumption Trend (Daily)</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Day-by-day comparison of L2 (Bulk) vs L3 + L4 totals for {selectedZone}</p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={zoneTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradZoneBulkDaily" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BRAND.accent} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={BRAND.accent} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradIndividualDaily" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: BRAND.muted }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: BRAND.muted }} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: BRAND.muted, fontSize: 11 } }} />
                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                <Legend iconType="circle" />
                                <Area type="monotone" name="Zone Bulk" dataKey="Zone Bulk" stroke={BRAND.accent} fill="url(#gradZoneBulkDaily)" strokeWidth={3} animationDuration={1500} />
                                <Area type="monotone" name="Individual Total" dataKey="Individual Total" stroke={BRAND.primary} fill="url(#gradIndividualDaily)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                <Line type="monotone" name="Loss" dataKey="Loss" stroke={BRAND.danger} strokeWidth={2} dot={false} strokeDasharray="5 5" animationDuration={1500} />
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
                            <CardTitle className="text-base sm:text-lg">Individual Meters - {selectedZone}</CardTitle>
                            <p className="text-xs sm:text-sm text-slate-500">All individual meters (L3 Villas + L4 Apartments) in this zone • Day {selectedDay} readings</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search meters..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort('meterName')}>
                                        <div className="flex items-center gap-2">
                                            Meter Name
                                            {sortField === 'meterName' && <ArrowUpDown className="h-3 w-3" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('accountNumber')}>
                                        <div className="flex items-center gap-2">
                                            Account #
                                            {sortField === 'accountNumber' && <ArrowUpDown className="h-3 w-3" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center">Level</TableHead>
                                    <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('type')}>
                                        <div className="flex items-center gap-2">
                                            Type
                                            {sortField === 'type' && <ArrowUpDown className="h-3 w-3" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[120px] text-right cursor-pointer" onClick={() => handleSort('reading')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Day {selectedDay} (m³)
                                            {sortField === 'reading' && <ArrowUpDown className="h-3 w-3" />}
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedMeters.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            {searchTerm ? 'No meters found matching your search.' : 'No individual meter data available for this zone.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedMeters.map((meter, idx) => {
                                        const levelColor = LEVEL_COLORS[meter.level] || LEVEL_COLORS['L3'];
                                        return (
                                            <TableRow key={`${meter.accountNumber}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-sm">{meter.meterName}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{meter.accountNumber}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", levelColor.bg, levelColor.text)}>
                                                        {meter.level}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{meter.type}</TableCell>
                                                <TableCell className="text-right font-mono text-sm font-medium">
                                                    {meter.reading > 0 ? meter.reading.toFixed(1) : '—'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, processedMeters.length)} of {processedMeters.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
