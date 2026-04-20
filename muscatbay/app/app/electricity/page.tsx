"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getElectricityMeters, MeterReading } from "@/lib/mock-data";
import { getElectricityMetersFromSupabase } from "@/lib/supabase";
import { ELECTRICITY_RATES } from "@/lib/config";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, DollarSign, MapPin, TrendingUp, BarChart3, Database, Search, Download, X, Filter, LineChart } from "lucide-react";
import { MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption } from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend, ReferenceLine, LineChart as RechartsLineChart, Line } from "recharts";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

// Use centralized config for rates
const ratePerKWh = ELECTRICITY_RATES.RATE_PER_KWH;

const CHART_COLORS = {
    primary: 'var(--chart-elec-primary)',
    secondary: 'var(--chart-elec-secondary)',
    accent: 'var(--chart-elec-accent)',
    success: 'var(--chart-success)',
    loss: 'var(--chart-loss)',
    brand: 'var(--chart-brand)',
    amber: 'var(--chart-amber)',
    gray: 'var(--chart-gray)',
} as const;

// Color palette for per-meter lines (module-level to avoid recreating on each render)
const meterColors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.secondary,
    CHART_COLORS.loss,
    CHART_COLORS.gray,
    'var(--chart-1)',        // blue
    'var(--chart-3)',        // amber variant
    'var(--chart-4)',        // emerald variant
    'var(--chart-5)',        // violet — extended palette
    'var(--chart-teal)',     // cyan — extended palette
];

export default function ElectricityPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<"supabase" | "mock">("mock");
    const [debugError, setDebugError] = useState<string | null>(null);
    const [readingsCount, setReadingsCount] = useState<number>(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [analysisType, setAnalysisType] = useState<string>("All");
    const [selectedMeter, setSelectedMeter] = useState<string>("All");
    const [dateRangeIndex, setDateRangeIndex] = useState<[number, number]>([0, 100]);
    // Date range state for Overview tab
    const [startMonth, setStartMonth] = useState<string>("Apr-24");
    const [endMonth, setEndMonth] = useState<string>("Dec-25");

    // Database table sorting and pagination state
    const [dbSortField, setDbSortField] = useState<string>('label');
    const [dbSortDirection, setDbSortDirection] = useState<'asc' | 'desc'>('asc');
    const [dbCurrentPage, setDbCurrentPage] = useState(1);
    const [dbPageSize, setDbPageSize] = useState<PageSizeOption>(25);
    const [dbSearchTerm, setDbSearchTerm] = useState('');
    const [dbSelectedTypes, setDbSelectedTypes] = useState<string[]>([]);
    // Year filter state
    const [selectedYear, setSelectedYear] = useState<string>("");

    // Track one-time initialization of filter defaults
    const typesInitializedRef = useRef(false);
    const meterValidatedRef = useRef(false);

    // PDF export
    const reportRef = useRef<HTMLDivElement>(null);

    // Stable fetch function — used both on mount and by real-time handler
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const supabaseData = await getElectricityMetersFromSupabase();
            if (supabaseData && supabaseData.length > 0) {
                setMeters(supabaseData);
                setDataSource("supabase");
                setLastUpdated(new Date());
                const totalReadings = supabaseData.reduce((sum, m) => sum + Object.keys(m.readings).length, 0);
                if (!silent) setReadingsCount(totalReadings);
            } else if (!silent) {
                throw new Error("Supabase returned empty data");
            }
        } catch (e: unknown) {
            if (!silent) {
                const message = e instanceof Error ? e.message : "Unknown error";
                console.warn("Supabase load error:", message);
                setDebugError(message);
                try {
                    const mockData = await getElectricityMeters();
                    setMeters(mockData);
                    setDataSource("mock");
                } catch (mockError) {
                    // console.error("Failed to load mock data as well", mockError);
                }
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // ── Supabase real-time subscription for electricity_meters table ────
    const { isLive } = useSupabaseRealtime({
        table: 'electricity_meters',
        channelName: 'electricity-meters-rt',
        onChanged: () => loadData(true),
        enabled: dataSource === 'supabase',
    });

    useEffect(() => {
        loadData();

        // Load saved filter preferences
        const savedPrefs = loadFilterPreferences<{
            activeTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedYear?: string;
            analysisType?: string;
            selectedMeter?: string;
            dateRangeIndex?: [number, number];
        }>('electricity');
        if (savedPrefs) {
            if (savedPrefs.activeTab) setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedYear) setSelectedYear(savedPrefs.selectedYear);
            if (savedPrefs.analysisType) {
                prefApplyingRef.current = true;
                setAnalysisType(savedPrefs.analysisType);
            }
            if (savedPrefs.selectedMeter) setSelectedMeter(savedPrefs.selectedMeter);
            if (savedPrefs.dateRangeIndex) setDateRangeIndex(savedPrefs.dateRangeIndex);
        }
    }, [loadData]);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('electricity', {
            activeTab,
            startMonth,
            endMonth,
            selectedYear,
            analysisType,
            selectedMeter,
            dateRangeIndex
        });
    }, [activeTab, startMonth, endMonth, selectedYear, analysisType, selectedMeter, dateRangeIndex]);

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
        return Array.from(yearsSet).sort();
    }, [allMonths]);

    // Filter months by selected year
    const filteredMonthsByYear = useMemo(() => {
        if (!selectedYear) return allMonths;
        return allMonths.filter(month => {
            const year = '20' + month.split('-')[1];
            return year === selectedYear;
        });
    }, [allMonths, selectedYear]);

    // Unique types for multi-select filter
    const allMeterTypes = useMemo(() => {
        const types = new Set(meters.map(m => m.type));
        return Array.from(types).sort();
    }, [meters]);

    // Initialize selected types once when data first arrives
    useEffect(() => {
        if (!typesInitializedRef.current && allMeterTypes.length > 0) {
            setDbSelectedTypes([...allMeterTypes]);
            typesInitializedRef.current = true;
        }
    }, [allMeterTypes]);

    // Validate selectedMeter once meters are loaded (handles legacy name-based values)
    useEffect(() => {
        if (!meterValidatedRef.current && meters.length > 0 && selectedMeter !== "All") {
            const isValidId = meters.some(m => m.id === selectedMeter);
            if (!isValidId) {
                setSelectedMeter("All");
            }
            meterValidatedRef.current = true;
        }
    }, [meters, selectedMeter]);

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

        // Type filter
        if (dbSelectedTypes.length > 0 && dbSelectedTypes.length < allMeterTypes.length) {
            result = result.filter(m => dbSelectedTypes.includes(m.type));
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
    }, [meters, dbSearchTerm, dbSelectedTypes, allMeterTypes, dbSortField, dbSortDirection, allMonths]);

    const dbEffectivePageSize = dbPageSize === 'All' ? dbFilteredMeters.length : dbPageSize;
    const dbTotalPages = Math.ceil(dbFilteredMeters.length / (dbEffectivePageSize || 1));
    const dbStartIndex = (dbCurrentPage - 1) * dbEffectivePageSize;
    const dbPaginatedMeters = dbFilteredMeters.slice(dbStartIndex, dbStartIndex + dbEffectivePageSize);

    const handleDbSort = useCallback((field: string) => {
        setDbSortField(prev => {
            if (prev === field) {
                setDbSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            } else {
                setDbSortDirection('asc');
            }
            return prev === field ? prev : field;
        });
        setDbCurrentPage(1);
    }, []);

    const handleDbExportCSV = () => {
        const data = dbFilteredMeters.map(m => ({
            Name: m.name,
            'Account #': m.account_number,
            Type: m.type,
            'Total (kWh)': Object.values(m.readings).reduce((a, b) => a + b, 0),
        }));
        exportToCSV(data, `electricity-meters-${getDateForFilename()}`);
    };

    const dbHasActiveFilters = dbSearchTerm || (dbSelectedTypes.length > 0 && dbSelectedTypes.length < allMeterTypes.length);

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
                trendValue: consumptionTrend.trendValue,
                invertTrend: true,  // Less consumption = saving = green ✓
            },
            {
                label: "TOTAL COST",
                value: `${totalCost.toLocaleString('en-US', { maximumFractionDigits: 1 })} OMR`,
                subtitle: `@ ${ratePerKWh} OMR/kWh`,
                icon: DollarSign,
                variant: "success" as const,
                trend: costTrend.trend,
                trendValue: costTrend.trendValue,
                invertTrend: true,  // Lower cost = saving = green ✓
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
                subtitle: `${Math.round(highest.val).toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
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
            color: [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.secondary, CHART_COLORS.gray, CHART_COLORS.loss][i % 5]
        })).sort((a, b) => b.value - a.value);
    }, [meters, allMonths, startMonth, endMonth]);

    // Range change handlers for DateRangePicker
    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    const handleResetRange = () => {
        setSelectedYear('');
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

    // 2b. Meters belonging to selected type (for sub-filter dropdown)
    const metersOfSelectedType = useMemo(() => {
        if (analysisType === "All") return [];
        return meters.filter(m => m.type === analysisType).sort((a, b) => a.name.localeCompare(b.name));
    }, [meters, analysisType]);

    // Reset selectedMeter when analysisType changes (but not when preferences are being applied)
    const prevAnalysisType = useRef<string | null>(null);
    const prefApplyingRef = useRef(false);
    useEffect(() => {
        // Skip the reset while preferences are being applied
        if (prefApplyingRef.current) {
            prefApplyingRef.current = false;
            prevAnalysisType.current = analysisType;
            return;
        }
        if (prevAnalysisType.current !== null && prevAnalysisType.current !== analysisType) {
            setSelectedMeter("All");
        }
        prevAnalysisType.current = analysisType;
    }, [analysisType]);

    // 3. Filtered Data Provider
    const analysisData = useMemo(() => {
        // Always use allMonths as fallback — filteredMonthsByYear may be empty during initial render
        const monthsToUse = (selectedYear && filteredMonthsByYear.length > 0) ? filteredMonthsByYear : allMonths;
        if (monthsToUse.length === 0) return { stats: [], chartData: [], tableData: [], dateRangeLabel: "", topConsumers: [], perMeterChartData: [], selectedMonths: [] as string[], typeAverage: 0, comparisonData: [], selectedMeterName: null };

        // Use startMonth/endMonth from DateRangePicker
        const startIdx = Math.max(0, monthsToUse.indexOf(startMonth));
        const endIdx = monthsToUse.indexOf(endMonth);
        const selectedMonths = monthsToUse.slice(startIdx, (endIdx >= 0 ? endIdx : monthsToUse.length - 1) + 1);

        // Filter Meters by Type
        const typeFilteredMeters = analysisType === "All"
            ? meters
            : meters.filter(m => m.type === analysisType);

        // Further filter by selectedMeter (using ID for uniqueness)
        const filteredMeters = selectedMeter !== "All"
            ? typeFilteredMeters.filter(m => m.id === selectedMeter)
            : typeFilteredMeters;

        // Aggregate Data
        let totalConsumption = 0;
        let totalCost = 0;
        let highestConsumer = { name: "N/A", val: 0 };
        const chartMap: Record<string, number> = {};

        // Initialize chart map for selected months
        selectedMonths.forEach(m => chartMap[m] = 0);

        const tableRows = filteredMeters.map(meter => {
            let meterConsumption = 0;
            const monthlyReadings: Record<string, number> = {};
            selectedMonths.forEach(month => {
                const val = meter.readings[month] || 0;
                meterConsumption += val;
                chartMap[month] = (chartMap[month] || 0) + val;
                monthlyReadings[month] = val;
            });
            totalConsumption += meterConsumption;

            if (meterConsumption > highestConsumer.val) {
                highestConsumer = { name: meter.name, val: meterConsumption };
            }

            return {
                ...meter,
                rangeConsumption: meterConsumption,
                rangeCost: meterConsumption * ratePerKWh,
                monthlyReadings
            };
        }).sort((a, b) => b.rangeConsumption - a.rangeConsumption);

        totalCost = totalConsumption * ratePerKWh;

        // Aggregate chart data
        const chartData = selectedMonths.map(month => ({
            month,
            consumption: chartMap[month],
        }));

        // Per-meter chart data for multi-line chart (type aggregate view with ≤10 meters)
        const perMeterChartData = selectedMonths.map(month => {
            const point: Record<string, string | number> = { month };
            typeFilteredMeters.forEach(meter => {
                point[meter.name] = meter.readings[month] || 0;
            });
            return point;
        });

        // Comparison data: each meter's total in the type, with avg reference
        const typeTotal = typeFilteredMeters.reduce((sum, meter) => {
            return sum + selectedMonths.reduce((s, month) => s + (meter.readings[month] || 0), 0);
        }, 0);
        const typeAverage = typeFilteredMeters.length > 0 ? typeTotal / typeFilteredMeters.length : 0;

        const comparisonData = typeFilteredMeters.map((meter, idx) => {
            const total = selectedMonths.reduce((s, month) => s + (meter.readings[month] || 0), 0);
            return {
                name: meter.name.length > 25 ? meter.name.substring(0, 25) + '...' : meter.name,
                fullName: meter.name,
                consumption: total,
                cost: total * ratePerKWh,
                color: meterColors[idx % meterColors.length],
                isAboveAvg: total > typeAverage
            };
        }).sort((a, b) => b.consumption - a.consumption);

        // Get selected meter name for display (when filtering by ID)
        const selectedMeterName = selectedMeter !== "All"
            ? filteredMeters[0]?.name || selectedMeter
            : null;

        // Calculate previous period for trend comparison
        const startIdxInAll = allMonths.indexOf(selectedMonths[0]);
        const endIdxInAll = allMonths.indexOf(selectedMonths[selectedMonths.length - 1]);
        const prevEndIdx = startIdxInAll > 0 ? startIdxInAll - 1 : -1;
        const prevStartIdx = prevEndIdx >= 0 ? Math.max(0, prevEndIdx - (endIdxInAll - startIdxInAll)) : -1;

        let prevConsumption = 0;
        if (prevStartIdx >= 0 && prevEndIdx >= 0) {
            const prevMonths = allMonths.slice(prevStartIdx, prevEndIdx + 1);
            prevConsumption = filteredMeters.reduce((sum, meter) => {
                return sum + prevMonths.reduce((mSum, month) => mSum + (meter.readings[month] || 0), 0);
            }, 0);
        }
        const prevCost = prevConsumption * ratePerKWh;
        const hasPrev = prevStartIdx >= 0 && prevEndIdx >= 0;

        const consumptionTrend = hasPrev ? calcTrend(totalConsumption, prevConsumption) : { trend: 'neutral' as const, trendValue: '—' };
        const costTrend = hasPrev ? calcTrend(totalCost, prevCost) : { trend: 'neutral' as const, trendValue: '—' };

        // Stats Cards Data
        const stats = [
            {
                label: "TOTAL CONSUMPTION",
                value: `${(totalConsumption / 1000).toFixed(1)} MWh`,
                subtitle: selectedMeterName || "in selected period",
                icon: Zap,
                variant: "primary" as const,
                trend: consumptionTrend.trend,
                trendValue: consumptionTrend.trendValue,
                invertTrend: true,  // Less consumption = saving = green ✓
            },
            {
                label: "TOTAL COST",
                value: `${totalCost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR`,
                subtitle: `at ${ratePerKWh} OMR/kWh`,
                icon: DollarSign,
                variant: "success" as const,
                trend: costTrend.trend,
                trendValue: costTrend.trendValue,
                invertTrend: true,  // Lower cost = saving = green ✓
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
            color: idx === 0 ? CHART_COLORS.primary : idx === 1 ? CHART_COLORS.accent : idx === 2 ? CHART_COLORS.secondary : CHART_COLORS.gray
        }));

        return {
            stats,
            chartData,
            tableData: tableRows,
            topConsumers,
            perMeterChartData,
            selectedMonths,
            typeAverage,
            comparisonData,
            dateRangeLabel: `${startMonthStr} - ${endMonthStr}`,
            selectedMeterName
        };

    }, [meters, allMonths, filteredMonthsByYear, selectedYear, analysisType, selectedMeter, startMonth, endMonth]);

    const handleReset = () => {
        setDateRangeIndex([0, 100]);
        setAnalysisType("All");
        setSelectedMeter("All");
        setSelectedYear("");
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
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
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    error={debugError ? `Error: ${debugError}` : null}
                >

                    {dataSource === 'supabase' && <span className="text-[10px] text-muted-foreground">{readingsCount} readings</span>}
                </PageStatusBar>
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

            {/* Unified Date/Filter Control Card — shared by Overview and Analysis tabs */}
            {activeTab !== 'database' && allMonths.length > 0 && (
                <Card className="card-elevated">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col gap-4">
                            {/* Year Selector Row */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by Year:</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={selectedYear === "" ? "default" : "outline"}
                                            size="sm"
                                            aria-label="Filter by all years"
                                            aria-pressed={selectedYear === ""}
                                            onClick={() => {
                                                setSelectedYear("");
                                                if (allMonths.length > 0) {
                                                    setStartMonth(allMonths[0]);
                                                    setEndMonth(allMonths[allMonths.length - 1]);
                                                }
                                            }}
                                            className={`rounded-full px-4 ${selectedYear === "" ? "bg-secondary text-white" : "border-slate-200 dark:border-slate-700"}`}
                                        >
                                            All
                                        </Button>
                                        {availableYears.map((year) => (
                                            <Button
                                                key={year}
                                                variant={selectedYear === year ? "default" : "outline"}
                                                size="sm"
                                                aria-label={`Filter by year ${year}`}
                                                aria-pressed={selectedYear === year}
                                                onClick={() => {
                                                    setSelectedYear(year);
                                                    const yearMonths = allMonths.filter(m => '20' + m.split('-')[1] === year);
                                                    if (yearMonths.length > 0) {
                                                        setStartMonth(yearMonths[0]);
                                                        setEndMonth(yearMonths[yearMonths.length - 1]);
                                                    }
                                                }}
                                                className={`rounded-full px-4 ${selectedYear === year ? "bg-secondary text-white" : "border-slate-200 dark:border-slate-700"}`}
                                            >
                                                {year}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Analysis tab: Type and Meter selectors inline */}
                                {activeTab === 'analysis' ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Type selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Type:</span>
                                            <select
                                                value={analysisType}
                                                onChange={(e) => setAnalysisType(e.target.value)}
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                                            >
                                                <option value="All">All ({meters.length})</option>
                                                {meterTypes.map((t) => (
                                                    <option key={t.type} value={t.type}>{t.type} ({t.count})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Meter selector (appears when a specific type is selected) */}
                                        {analysisType !== "All" && metersOfSelectedType.length > 0 && (
                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/30">
                                                <Filter className="w-3.5 h-3.5 text-secondary" />
                                                <span className="text-xs font-medium text-secondary">Meter:</span>
                                                <select
                                                    value={selectedMeter}
                                                    onChange={(e) => setSelectedMeter(e.target.value)}
                                                    className="px-2.5 py-1.5 rounded-lg border border-secondary/40 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/40 max-w-[280px]"
                                                >
                                                    <option value="All">All {analysisType} ({metersOfSelectedType.length})</option>
                                                    {metersOfSelectedType.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.name} ({m.account_number})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <Badge variant="outline" className="px-2.5 py-1 text-xs font-normal">
                                            {selectedYear ? filteredMonthsByYear.length : allMonths.length} Months
                                        </Badge>
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                        {selectedYear ? filteredMonthsByYear.length : allMonths.length} Months Available
                                    </Badge>
                                )}
                            </div>

                            {/* Date Range Picker */}
                            <DateRangePicker
                                startMonth={startMonth || allMonths[0]}
                                endMonth={endMonth || allMonths[allMonths.length - 1]}
                                availableMonths={allMonths}
                                onRangeChange={handleRangeChange}
                                onReset={handleResetRange}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'overview' && (
                <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">

                    <StatsGrid stats={stats} />

                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-5">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Monthly Consumption Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div role="img" aria-label="Monthly electricity consumption trend: area chart showing kilowatt-hour usage over selected date range" className="h-[220px] sm:h-[260px] md:h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} />
                                            <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Area type="natural" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.primary} fill="url(#elecGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={600} />
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
                                <div role="img" aria-label="Electricity consumption by type: horizontal bar chart breaking down kilowatt-hour usage across meter categories" className="h-[220px] sm:h-[260px] md:h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={consumptionByType} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="type" width={100} className="text-xs" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)" }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={600}>
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
                <div id="panel-analysis" role="tabpanel" aria-labelledby="tab-analysis" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Filtered Stats Grid */}
                    <StatsGrid stats={analysisData.stats} />

                    {/* Monthly Trend Chart */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <LineChart className="w-5 h-5 text-amber-500" />
                                    {selectedMeter !== "All"
                                        ? `Monthly Trend — ${analysisData.selectedMeterName}`
                                        : analysisType !== "All" && metersOfSelectedType.length <= 10
                                            ? `Per-Meter Breakdown — ${analysisType}`
                                            : `Monthly Trend — ${analysisType === "All" ? "All Types" : analysisType}`
                                    }
                                </CardTitle>
                                {analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10 && (
                                    <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                        {metersOfSelectedType.length} meters
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div role="img" aria-label={`Electricity consumption trend for ${analysisType === 'All' ? 'all meter types' : analysisType}: chart showing kilowatt-hour usage over time per meter or aggregate`} className="h-[280px] sm:h-[340px] md:h-[380px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* Multi-line chart for type aggregate with ≤10 meters */}
                                    {analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10 ? (
                                        <RechartsLineChart data={analysisData.perMeterChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="card-elevated px-4 py-3 border border-white/50 shadow-xl !rounded-xl !bg-white dark:!bg-slate-900 max-w-[280px]">
                                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                                                                {[...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)).map((entry) => (
                                                                    <div key={entry.name} className="flex items-center gap-2 text-xs mb-0.5">
                                                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                                                        <span className="text-slate-500 dark:text-slate-400 truncate">{entry.name}:</span>
                                                                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200 ml-auto">
                                                                            {(entry.value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                                            {metersOfSelectedType.map((meter, idx) => (
                                                <Line
                                                    key={meter.id}
                                                    type="monotone"
                                                    dataKey={meter.name}
                                                    stroke={meterColors[idx % meterColors.length]}
                                                    strokeWidth={2.5}
                                                    dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                                                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                                    animationDuration={600}
                                                />
                                            ))}
                                        </RechartsLineChart>
                                    ) : (
                                        /* Single aggregate area chart */
                                        <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="anlGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Area type="monotone" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.secondary} fill="url(#anlGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={600} />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison & Top Consumers Charts Row */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Top Consumers Bar Chart */}
                        <Card className="card-elevated">
                            <CardHeader className="card-elevated-header">
                                <CardTitle className="text-lg">Top 10 {analysisType === "All" ? "Overall" : analysisType} Consumers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div role="img" aria-label={`Top 10 electricity consumers bar chart for ${analysisType === 'All' ? 'all types' : analysisType}, ranked by kilowatt-hour consumption`} className="h-[300px] sm:h-[350px] md:h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analysisData.topConsumers}
                                            layout="vertical"
                                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.06)" />
                                            <XAxis
                                                type="number"
                                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={150}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="card-elevated px-4 py-3 border border-white/50 shadow-xl !rounded-xl !bg-white dark:!bg-slate-900">
                                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{data.fullName}</p>
                                                                <div className="flex items-center gap-2 text-xs mb-1">
                                                                    <div className="w-2 h-2 rounded-full bg-mb-warning" />
                                                                    <span className="text-slate-500 dark:text-slate-400">Consumption:</span>
                                                                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                                                                        {data.consumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <div className="w-2 h-2 rounded-full bg-mb-success" />
                                                                    <span className="text-slate-500 dark:text-slate-400">Cost:</span>
                                                                    <span className="font-mono font-medium text-mb-success">
                                                                        {data.cost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR
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
                                                animationDuration={600}
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

                        {/* Per-Meter Comparison vs Average (only when a specific type is selected) */}
                        {analysisType !== "All" && analysisData.comparisonData.length > 1 && (
                            <Card className="card-elevated">
                                <CardHeader className="card-elevated-header">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Meter vs Average — {analysisType}</CardTitle>
                                        <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                            Avg: {(analysisData.typeAverage / 1000).toFixed(1)} MWh
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div role="img" aria-label={`Meter vs type average bar chart for ${analysisType}: comparing each meter's consumption against the group average`} className="h-[300px] sm:h-[350px] md:h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={analysisData.comparisonData}
                                                layout="vertical"
                                                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.06)" />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={160}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                                />
                                                <ReferenceLine
                                                    x={analysisData.typeAverage}
                                                    stroke={CHART_COLORS.amber}
                                                    strokeWidth={2}
                                                    strokeDasharray="6 4"
                                                    label={{ value: 'Avg', position: 'top', fill: CHART_COLORS.amber, fontSize: 11, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            const diff = data.consumption - analysisData.typeAverage;
                                                            const pct = analysisData.typeAverage > 0 ? ((diff / analysisData.typeAverage) * 100).toFixed(1) : '0';
                                                            return (
                                                                <div className="card-elevated px-4 py-3 border border-white/50 shadow-xl !rounded-xl !bg-white dark:!bg-slate-900">
                                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{data.fullName}</p>
                                                                    <div className="flex items-center gap-2 text-xs mb-1">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                                                        <span className="text-slate-500">Total:</span>
                                                                        <span className="font-mono font-medium">{data.consumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <div className="w-2 h-2 rounded-full bg-mb-warning" />
                                                                        <span className="text-slate-500">vs Avg:</span>
                                                                        <span className={`font-mono font-medium ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                            {diff > 0 ? '+' : ''}{pct}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                    cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                                                />
                                                <Bar dataKey="consumption" radius={[0, 8, 8, 0]} barSize={24} animationDuration={600}>
                                                    {analysisData.comparisonData.map((entry, index) => (
                                                        <Cell key={`comp-${index}`} fill={entry.isAboveAvg ? CHART_COLORS.loss : CHART_COLORS.success} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Monthly Breakdown Table */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                                <div className="text-xs text-muted-foreground">
                                    Showing {analysisData.tableData.length} of {meters.length} meters · {analysisData.selectedMonths.length} months
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-[calc(100vh-20rem)] sm:max-h-[600px] rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/80">
                                            <th className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-20 min-w-[180px]">Name</th>
                                            <th className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 min-w-[100px]">Account #</th>
                                            {analysisData.selectedMonths.map(month => (
                                                <th key={month} className="text-right py-4 px-3 font-semibold uppercase tracking-wide text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700 min-w-[75px] whitespace-nowrap">{month}</th>
                                            ))}
                                            <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 border-l border-slate-200 dark:border-slate-700 min-w-[90px]">Total (kWh)</th>
                                            <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 min-w-[90px]">Cost (OMR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysisData.tableData.map((meter) => (
                                            <tr key={meter.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                                <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10">{meter.name}</td>
                                                <td className="py-4 px-5 font-semibold text-slate-500 dark:text-slate-400 font-mono text-sm">{meter.account_number}</td>
                                                {analysisData.selectedMonths.map(month => {
                                                    const val = meter.monthlyReadings?.[month] || 0;
                                                    return (
                                                        <td key={month} className="py-4 px-3 text-right font-mono font-semibold text-sm text-slate-700 dark:text-slate-300">
                                                            {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-4 px-5 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800">
                                                    {meter.rangeConsumption.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                                </td>
                                                <td className="py-4 px-5 text-right font-mono text-sm font-semibold text-mb-success dark:text-mb-success-hover">
                                                    {meter.rangeCost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals row */}
                                        {analysisData.tableData.length > 1 && (
                                            <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-semibold">
                                                <td className="py-4 px-5 text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50/80 dark:bg-slate-800/60 z-10">Total</td>
                                                <td className="py-4 px-5"></td>
                                                {analysisData.selectedMonths.map(month => {
                                                    const monthTotal = analysisData.tableData.reduce((sum, m) => sum + (m.monthlyReadings?.[month] || 0), 0);
                                                    return (
                                                        <td key={`total-${month}`} className="py-4 px-3 text-right font-mono text-sm text-slate-800 dark:text-slate-200">
                                                            {monthTotal > 0 ? monthTotal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-4 px-5 text-right font-mono text-sm text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">
                                                    {analysisData.tableData.reduce((s, m) => s + m.rangeConsumption, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="py-4 px-5 text-right font-mono text-sm text-mb-success dark:text-mb-success-hover">
                                                    {analysisData.tableData.reduce((s, m) => s + m.rangeCost, 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
            }

            {activeTab === 'database' && (() => {
                // Show last 6 months by default for anomaly detection
                const displayMonths = allMonths.slice(-6);

                // Helper to detect anomalies: compares value to meter's average across all months
                const getAnomalyClass = (value: number, meter: typeof meters[0]) => {
                    const allVals = Object.values(meter.readings).filter(v => v > 0);
                    if (allVals.length < 3 || value === 0) return '';
                    const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
                    if (avg === 0) return '';
                    const ratio = value / avg;
                    if (ratio > 2) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold';
                    if (ratio > 1.5) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-semibold';
                    if (ratio < 0.3) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold';
                    return '';
                };

                return (
                    <div id="panel-database" role="tabpanel" aria-labelledby="tab-database" tabIndex={0} className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-200">
                        {/* Toolbar */}
                        <TableToolbar>
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    aria-label="Search meters"
                                    placeholder="Search meters..."
                                    value={dbSearchTerm}
                                    onChange={(e) => { setDbSearchTerm(e.target.value); setDbCurrentPage(1); }}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                />
                            </div>

                            <MultiSelectDropdown
                                label="Type"
                                options={allMeterTypes}
                                selected={dbSelectedTypes}
                                onChange={(s) => { setDbSelectedTypes(s); setDbCurrentPage(1); }}
                            />

                            {dbHasActiveFilters && (
                                <button
                                    onClick={() => { setDbSearchTerm(''); setDbSelectedTypes([...allMeterTypes]); setDbCurrentPage(1); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}

                            <button
                                onClick={handleDbExportCSV}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export CSV</span>
                            </button>

                            <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{dbFilteredMeters.length}</span>
                                {dbFilteredMeters.length !== meters.length && (
                                    <span> of {meters.length}</span>
                                )} meters
                            </div>
                        </TableToolbar>

                        {/* Anomaly Legend */}
                        <div className="flex items-center gap-4 px-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Anomaly Detection:</span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800" />
                                &gt;2× average (High)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" />
                                &gt;1.5× average (Elevated)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" />
                                &lt;0.3× average (Low)
                            </span>
                        </div>

                        {/* Active Filter Pills */}
                        <ActiveFilterPills pills={[
                            ...(dbSearchTerm ? [{
                                key: 'search',
                                label: `Search: "${dbSearchTerm}"`,
                                onRemove: () => { setDbSearchTerm(''); setDbCurrentPage(1); }
                            }] : []),
                            ...(dbSelectedTypes.length > 0 && dbSelectedTypes.length < allMeterTypes.length ? [{
                                key: 'types',
                                label: `${dbSelectedTypes.length} type${dbSelectedTypes.length !== 1 ? 's' : ''}`,
                                colorClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
                                onRemove: () => { setDbSelectedTypes([...allMeterTypes]); setDbCurrentPage(1); }
                            }] : []),
                        ]} />

                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80">
                                        <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-20 min-w-[200px]" onClick={() => handleDbSort('label')}>
                                            <div className="flex items-center gap-1.5">Name <SortIcon field="label" currentSortField={dbSortField} currentSortDirection={dbSortDirection} /></div>
                                        </th>
                                        <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleDbSort('account')}>
                                            <div className="flex items-center gap-1.5">Account # <SortIcon field="account" currentSortField={dbSortField} currentSortDirection={dbSortDirection} /></div>
                                        </th>
                                        <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleDbSort('type')}>
                                            <div className="flex items-center gap-1.5">Type <SortIcon field="type" currentSortField={dbSortField} currentSortDirection={dbSortDirection} /></div>
                                        </th>
                                        {displayMonths.map(month => (
                                            <th key={month} className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[90px] whitespace-nowrap" onClick={() => handleDbSort(month)}>
                                                <div className="flex items-center justify-end gap-1.5">{month} <SortIcon field={month} currentSortField={dbSortField} currentSortDirection={dbSortDirection} /></div>
                                            </th>
                                        ))}
                                        <th className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 border-l border-slate-200 dark:border-slate-700 min-w-[100px]">Total (kWh)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dbPaginatedMeters.map((meter) => {
                                        const sum = Object.values(meter.readings).reduce((a, b) => a + b, 0);
                                        return (
                                            <tr key={meter.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                                <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10">{meter.name}</td>
                                                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 font-mono text-sm">{meter.account_number}</td>
                                                <td className="py-4 px-5">
                                                    <StatusBadge label={meter.type} color="blue" />
                                                </td>
                                                {displayMonths.map(month => {
                                                    const val = meter.readings[month] || 0;
                                                    const anomaly = getAnomalyClass(val, meter);
                                                    return (
                                                        <td key={month} className={`py-4 px-5 text-right font-mono font-semibold text-sm ${anomaly || 'text-slate-700 dark:text-slate-300'}`}>
                                                            {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-4 px-5 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800">{sum.toLocaleString('en-US', { maximumFractionDigits: 1 })}</td>
                                            </tr>
                                        );
                                    })}
                                    {dbFilteredMeters.length === 0 && (
                                        <tr>
                                            <td colSpan={4 + displayMonths.length} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                No meters found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {dbFilteredMeters.length > 0 && (
                            <TablePagination
                                currentPage={dbCurrentPage}
                                totalPages={dbTotalPages}
                                totalItems={dbFilteredMeters.length}
                                pageSize={dbPageSize}
                                startIndex={dbStartIndex}
                                endIndex={Math.min(dbStartIndex + dbEffectivePageSize, dbFilteredMeters.length)}
                                onPageChange={setDbCurrentPage}
                                onPageSizeChange={(size) => { setDbPageSize(size); setDbCurrentPage(1); }}
                            />
                        )}
                    </div>
                );
            })()}
        </div >
    );
}
