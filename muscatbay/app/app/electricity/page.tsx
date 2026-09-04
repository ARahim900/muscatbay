"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getElectricityMeters, MeterReading } from "@/lib/mock-data";
import { getElectricityMetersFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { ELECTRICITY_RATES } from "@/lib/config";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { PeriodFilterPanel } from "@/components/shared/period-filter-panel";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Zap, DollarSign, MapPin, TrendingUp, Database, Search, Download, X, Filter, Gauge } from "lucide-react";
import { MultiSelectDropdown, TablePagination, ActiveFilterPills, TableToolbar, StatusBadge, SortableTableHead, type BadgeColor, type PageSizeOption } from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { calcTrend } from "@/lib/trends";

// ─── Extracted subcomponents (pure relocation, no behavior changes) ─────────
import { CHART_COLORS, meterColors } from "@/components/electricity/electricity-shared";
import { ElectricityLoadingSkeleton } from "@/components/electricity/electricity-loading";
import { LoadWatch } from "@/components/electricity/load-watch";
import { StatsGridSkeleton, Skeleton } from "@/components/shared/skeleton";
import dynamic from "next/dynamic";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
    AnomalyLegend, ReadingValue, describeReading, readingBaseline,
} from "@/components/electricity/reading-cell";

// ─── Recharts is loaded on demand ──────────────────────────────────────────
// These two views are the route's only Recharts consumers — Load Watch, the
// default tab, is cards, a heatmap and a table, so nothing on first paint needs
// the charting library. Neither can render before the Supabase fetch resolves
// (the page shows ElectricityLoadingSkeleton until then), so the chunk arrives
// alongside the data rather than blocking first-load JS. Fallback heights match
// the real blocks so hydration doesn't shift the page.
const ElectricityOverviewCharts = dynamic(
    () => import("@/components/electricity/electricity-overview-charts").then((m) => ({ default: m.ElectricityOverviewCharts })),
    {
        loading: () => (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-5" role="status" aria-busy="true" aria-label="Loading consumption trends">
                <Skeleton className="h-[440px] w-full rounded-[10.5px] lg:col-span-3" />
                <Skeleton className="h-[440px] w-full rounded-[10.5px] lg:col-span-2" />
            </div>
        ),
        ssr: false,
    },
);
const ElectricityAnalysisView = dynamic(
    () => import("@/components/electricity/electricity-analysis-view").then((m) => ({ default: m.ElectricityAnalysisView })),
    {
        loading: () => (
            <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading meter analysis">
                {/* stats grid · monthly trend card · meters-by-consumption card */}
                <StatsGridSkeleton />
                <Skeleton className="h-[500px] w-full rounded-[10.5px]" />
                <Skeleton className="h-[600px] w-full rounded-[10.5px]" />
            </div>
        ),
        ssr: false,
    },
);

// Use centralized config for rates
const ratePerKWh = ELECTRICITY_RATES.RATE_PER_KWH;

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit)
const ELECTRICITY_CACHE_KEY = "electricity:page";
interface ElectricityPageCache {
    meters: MeterReading[];
    lastUpdated: Date;
}

// Map "Mon-YY" → numeric ordinal (year * 12 + month) for chronological compare.
// Used so the Jan-Dec slider can point at months that have no data without
// breaking range filters that previously used array `indexOf`.
const MONTH_INDEX: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const monthOrdinal = (code: string): number => {
    const [m, y] = code.split('-');
    return (parseInt('20' + y, 10) || 0) * 12 + (MONTH_INDEX[m] || 0);
};
const monthsInRange = (allMonths: string[], start: string, end: string): string[] => {
    if (!start || !end) return allMonths;
    const lo = monthOrdinal(start);
    const hi = monthOrdinal(end);
    if (!lo || !hi) return allMonths;
    return allMonths.filter(m => {
        const ord = monthOrdinal(m);
        return ord >= lo && ord <= hi;
    });
};

export default function ElectricityPage() {
    const [activeTab, setActiveTab] = useState("watch");
    // Session cache — revisits render the last data instantly and refresh
    // silently in the background instead of re-showing the page skeleton.
    const [cached] = useState(() => getPageCache<ElectricityPageCache>(ELECTRICITY_CACHE_KEY));
    const [meters, setMeters] = useState<MeterReading[]>(cached?.meters ?? []);
    const [loading, setLoading] = useState(!cached);
    const [dataSource, setDataSource] = useState<"supabase" | "mock">(cached ? "supabase" : "mock");
    const [debugError, setDebugError] = useState<string | null>(null);
    const getMeterTypeColor = (type: string): BadgeColor => {
        const t = type.toLowerCase();
        if (t.includes('main') || t.includes('incomer') || t.includes('bulk')) return 'blue';
        if (t.includes('common') || t.includes('shared') || t.includes('service')) return 'cyan';
        if (t.includes('sub')) return 'purple';
        if (t.includes('emergency') || t.includes('fire')) return 'red';
        if (t.includes('feeder') || t.includes('distribution')) return 'amber';
        return 'slate';
    };

    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
    const [analysisType, setAnalysisType] = useState<string>("All");
    const [selectedMeter, setSelectedMeter] = useState<string>("All");
    const [dateRangeIndex, setDateRangeIndex] = useState<[number, number]>([0, 100]);
    // Date range state for Overview tab
    const [startMonth, setStartMonth] = useState<string>("");
    const [endMonth, setEndMonth] = useState<string>("");

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
    // Tracks the latest data month seen — used to detect when new months genuinely arrive
    const latestDataMonthRef = useRef<string>('');

    // Stable fetch function — used both on mount and by real-time handler
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const configured = isSupabaseConfigured();
        try {
            if (!configured) {
                // Supabase is not wired up at all → demo data is the honest
                // answer, and the status bar's "mock" state already says so.
                if (!silent) {
                    setMeters(await getElectricityMeters());
                    setDataSource("mock");
                    setDebugError(null);
                }
                return;
            }

            const supabaseData = await getElectricityMetersFromSupabase();
            if (supabaseData && supabaseData.length > 0) {
                setMeters(supabaseData);
                setDataSource("supabase");
                setDebugError(null);
                const now = new Date();
                setLastUpdated(now);
                setPageCache<ElectricityPageCache>(ELECTRICITY_CACHE_KEY, {
                    meters: supabaseData,
                    lastUpdated: now,
                });
            } else if (!silent) {
                // Configured but empty: a real problem with the live table, not
                // a cue to quietly swap in demo meters.
                setMeters([]);
                setDataSource("supabase");
                setDebugError(
                    "Supabase returned no electricity meters. Showing no data rather than demo figures — " +
                    "check the electricity_meters / electricity_readings tables."
                );
            }
        } catch (e: unknown) {
            if (!silent) {
                const message = e instanceof Error ? e.message : "Unknown error";
                console.warn("Supabase load error:", message);
                setMeters([]);
                setDataSource("supabase");
                setDebugError(`Could not load electricity meters from Supabase: ${message}`);
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
        // Cache hit → the page already renders last data; refresh silently.
        loadData(Boolean(cached));

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
            // Guard against stale tab keys from the old layout ("overview"/"analysis"/"database").
            if (savedPrefs.activeTab === "watch" || savedPrefs.activeTab === "data") setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.selectedYear) {
                setSelectedYear(savedPrefs.selectedYear);
                // Only restore the saved end month when a year filter is active
                if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            }
            // Without a year filter, always default to the latest available month
            if (savedPrefs.analysisType) {
                prefApplyingRef.current = true;
                setAnalysisType(savedPrefs.analysisType);
            }
            if (savedPrefs.selectedMeter) setSelectedMeter(savedPrefs.selectedMeter);
            if (savedPrefs.dateRangeIndex) setDateRangeIndex(savedPrefs.dateRangeIndex);
        }
    }, [loadData, cached]);

    // Save filter preferences when they change
    useEffect(() => {
        if (!startMonth || !endMonth) return; // skip saving during initialization
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

    // Initialize start/end months when data loads. The slider is locked to a single
    // year (Jan-Dec), so we only need the YEARS to be valid — the months themselves
    // may legitimately point at positions without data (those just render empty on
    // the axis). Validating by data presence here would yank the slider back every
    // time the user drags onto a no-data month.
    useEffect(() => {
        if (allMonths.length === 0) return;
        const latestMonth = allMonths[allMonths.length - 1];
        const latestYear = latestMonth.split('-')[1];
        const dataYears = new Set(allMonths.map(m => m.split('-')[1]));
        const startYear = startMonth?.split('-')[1];
        const endYear = endMonth?.split('-')[1];
        const yearsKnown = startYear && endYear && dataYears.has(startYear) && dataYears.has(endYear);
        const yearsMatch = startYear && endYear && startYear === endYear;

        if (!startMonth || !endMonth || !yearsKnown || !yearsMatch) {
            // Default to the latest year's full Jan-Dec axis on first load or
            // when restored state spans multiple years / unknown years.
            const monthsForLatest = allMonths.filter(m => m.split('-')[1] === latestYear);
            if (monthsForLatest.length > 0) {
                setStartMonth(monthsForLatest[0]);
                setEndMonth(monthsForLatest[monthsForLatest.length - 1]);
            }
        } else if (latestMonth !== latestDataMonthRef.current && endYear === latestYear && endMonth !== latestMonth) {
            // The slider is on the latest year but a newer month has arrived since
            // the prefs were saved (or since last poll) — advance end to include it.
            // Runs on first mount (ref empty) and on real-time updates that bring in
            // a new latest month, so the UI never gets pinned to a stale endpoint.
            setEndMonth(latestMonth);
        }

        latestDataMonthRef.current = latestMonth;
    }, [allMonths, startMonth, endMonth, selectedYear]);

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
        const rangeMonths = monthsInRange(allMonths, startMonth, endMonth);
        const totalMonths = rangeMonths.length > 0 ? rangeMonths : allMonths.slice(-6);
        const rangeTotalOf = (m: MeterReading) => totalMonths.reduce((s, month) => s + (m.readings[month] || 0), 0);
        result.sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (dbSortField) {
                case 'label': aVal = a.name; bVal = b.name; break;
                case 'account': aVal = a.account_number; bVal = b.account_number; break;
                case 'type': aVal = a.type; bVal = b.type; break;
                // Cost is the range total × a flat tariff, so both columns share one ordering.
                case 'total':
                case 'cost': aVal = rangeTotalOf(a); bVal = rangeTotalOf(b); break;
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
    }, [meters, dbSearchTerm, dbSelectedTypes, allMeterTypes, dbSortField, dbSortDirection, allMonths, startMonth, endMonth]);

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
        // Export mirrors the on-screen table: the months in the selected range,
        // each meter's range total, and the derived cost.
        const rangeMonths = monthsInRange(allMonths, startMonth, endMonth);
        const months = rangeMonths.length > 0 ? rangeMonths : allMonths.slice(-6);
        const data = dbFilteredMeters.map(m => {
            const total = months.reduce((s, month) => s + (m.readings[month] || 0), 0);
            const row: Record<string, string | number> = {
                Name: m.name,
                'Account #': m.account_number,
                Type: m.type,
            };
            // The API deliberately keeps NULL ("closed / not in service") absent
            // from the readings map so it stays distinguishable from a genuine
            // 0 kWh (functions/api/electricity.ts). Coercing to 0 here destroyed
            // that distinction in every exported file, so an empty month is
            // exported as an empty cell.
            months.forEach(month => {
                const v = m.readings[month];
                row[month] = v === undefined || v === null ? '' : v;
            });
            row['Total (kWh)'] = Number(total.toFixed(1));
            row['Cost (OMR)'] = Number((total * ratePerKWh).toFixed(1));
            return row;
        });
        exportToCSV(data, `electricity-meters-${getDateForFilename()}`);
    };

    const dbHasActiveFilters = dbSearchTerm || (dbSelectedTypes.length > 0 && dbSelectedTypes.length < allMeterTypes.length);

    // Monthly data filtered by selected range (for Overview chart)
    const filteredMonthlyData = useMemo(() => {
        const rangeMonths = monthsInRange(allMonths, startMonth, endMonth);
        return rangeMonths.map(month => {
            const total = meters.reduce((sum, m) => sum + (m.readings[month] || 0), 0);
            return { month, consumption: total };
        });
    }, [meters, allMonths, startMonth, endMonth]);

    // --- Consumption By Type (for Overview) - filtered by range ---
    const consumptionByType = useMemo(() => {
        const rangeMonths = monthsInRange(allMonths, startMonth, endMonth);

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

    // Newest month that actually carries a reading — NOT the browser fetch time.
    // "Last sync 14:32" tells an operator nothing about whether the readings are
    // three months old.
    const latestDataDate = useMemo(() => {
        for (let i = allMonths.length - 1; i >= 0; i--) {
            const month = allMonths[i];
            if (meters.some(m => typeof m.readings[month] === 'number')) {
                const [mon, yr] = month.split('-');
                return new Date(parseInt('20' + yr, 10), (MONTH_INDEX[mon] || 1) - 1, 1);
            }
        }
        return null;
    }, [allMonths, meters]);

    // Heatmap drill-through: selecting a category × month cell in Load Watch
    // scopes the range to that month, filters to that category and opens the
    // Meters & Data tab — previously the heatmap was a dead end.
    const handleInspectCell = useCallback((type: string, month: string) => {
        const year = '20' + month.split('-')[1];
        setSelectedYear(year);
        setStartMonth(month);
        setEndMonth(month);
        setAnalysisType(type);
        setSelectedMeter('All');
        setDbSelectedTypes([type]);
        setDbCurrentPage(1);
        setActiveTab('data');
    }, []);

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
        if (monthsToUse.length === 0) return { stats: [], chartData: [], dateRangeLabel: "", perMeterChartData: [], selectedMonths: [] as string[], typeAverage: 0, comparisonData: [], selectedMeterName: null };

        // Use startMonth/endMonth from DateRangePicker. The slider can point at
        // months without data (Jan-Dec axis), so filter chronologically.
        const selectedMonths = monthsInRange(monthsToUse, startMonth, endMonth);

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

        // Accumulate per-meter totals for the KPI cards and the trend aggregate.
        // The detailed per-meter rows now live in the unified table below and the
        // ranking is drawn by the comparison chart, so we only need running
        // totals here — not a materialised row array.
        filteredMeters.forEach(meter => {
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
        });

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
                id: meter.id,
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
                label: "CONSUMPTION",
                value: (totalConsumption / 1000).toFixed(1),
                unit: "MWh",
                subtitle: selectedMeterName || "in selected period",
                icon: Zap,
                variant: "primary" as const,
                trend: consumptionTrend.trend,
                trendValue: consumptionTrend.trendValue,
                invertTrend: true,  // Less consumption = saving = green ✓
            },
            {
                label: "TOTAL COST",
                value: totalCost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                unit: "OMR",
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
                label: "TOP CONSUMER",
                value: highestConsumer.name,
                subtitle: `${(highestConsumer.val / 1000).toFixed(1)} MWh`,
                icon: TrendingUp,
                variant: "danger" as const,
                trend: 'neutral' as const,
                trendValue: '—'
            }
        ];

        // Fall back to slider values when the chosen range contains no data months
        const startMonthStr = selectedMonths[0] || startMonth;
        const endMonthStr = selectedMonths[selectedMonths.length - 1] || endMonth;

        return {
            stats,
            chartData,
            perMeterChartData,
            selectedMonths,
            typeAverage,
            comparisonData,
            dateRangeLabel: `${startMonthStr} - ${endMonthStr}`,
            selectedMeterName
        };

    }, [meters, allMonths, filteredMonthsByYear, selectedYear, analysisType, selectedMeter, startMonth, endMonth]);

    if (loading) {
        return <ElectricityLoadingSkeleton />;
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Electricity"
                    description="Track power consumption and costs across all meters"
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    latestDataDate={latestDataDate}
                    error={debugError ? `Error: ${debugError}` : null}
                />
            </div>

            {/* Inspection-first: Load Watch leads; analysis + database consolidate into one tab */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                ariaLabel="Electricity sections"
                tabs={[
                    { key: "watch", label: "Load Watch", icon: Gauge },
                    { key: "data", label: "Meters & Data", icon: Database },
                ]}
            />

            {/* Period controls stay directly below the section tabs. */}
            {allMonths.length > 0 && (
                <PeriodFilterPanel
                    periodLabel={analysisData.dateRangeLabel.replace(" - ", " – ")}
                    metaLabel={`${analysisData.selectedMonths.length} months`}
                >
                        <div className="flex flex-col gap-4">
                            {/* Year Selector Row */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
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
                                            className={`rounded-full px-4 ${selectedYear === "" ? "bg-secondary text-secondary-foreground" : "border-border"}`}
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
                                                className={`rounded-full px-4 ${selectedYear === year ? "bg-secondary text-secondary-foreground" : "border-border"}`}
                                            >
                                                {year}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Meters & Data tab: Type and Meter selectors inline */}
                                {activeTab === 'data' ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Type selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                            <select
                                                value={analysisType}
                                                onChange={(e) => setAnalysisType(e.target.value)}
                                                aria-label="Filter by meter type"
                                                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40"
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
                                                    aria-label={`Select individual ${analysisType} meter`}
                                                    className="px-2.5 py-1.5 rounded-lg border border-secondary/40 bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 w-full max-w-full sm:max-w-[280px]"
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
                </PeriodFilterPanel>
            )}

            {/* Load Watch — inspection-first: category cards, load heatmap and exceptions. */}
            {activeTab === 'watch' && (
                <div id="panel-watch" role="tabpanel" aria-labelledby="tab-watch" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    <LoadWatch
                        meters={meters}
                        allMonths={allMonths}
                        startMonth={startMonth || allMonths[0]}
                        endMonth={endMonth || allMonths[allMonths.length - 1]}
                        onInspectType={(type) => { setAnalysisType(type); setSelectedMeter("All"); setActiveTab('data'); }}
                        onInspectCell={handleInspectCell}
                    />
                    <SectionBoundary title="Consumption trends">
                        <ElectricityOverviewCharts
                            filteredMonthlyData={filteredMonthlyData}
                            consumptionByType={consumptionByType}
                        />
                    </SectionBoundary>
                </div>
            )}

            {activeTab === 'data' && (
                <SectionBoundary title="Meter analysis">
                    <ElectricityAnalysisView
                        analysisData={analysisData}
                        analysisType={analysisType}
                        selectedMeter={selectedMeter}
                        metersOfSelectedType={metersOfSelectedType}
                    />
                </SectionBoundary>
            )}

            {activeTab === 'data' && (() => {
                // Month columns follow the shared date-range selector (falling back
                // to the last 6 months when the range resolves to nothing), so this
                // single table serves both the period breakdown and the anomaly scan.
                const rangeMonths = monthsInRange(allMonths, startMonth, endMonth);
                const displayMonths = rangeMonths.length > 0 ? rangeMonths : allMonths.slice(-6);
                const grandRangeTotal = dbFilteredMeters.reduce(
                    (s, m) => s + displayMonths.reduce((a, month) => a + (m.readings[month] || 0), 0),
                    0,
                );

                // Anomaly classification now lives in components/electricity/reading-cell,
                // driven by lib/thresholds — the table can no longer disagree with
                // Load Watch, and every flagged cell carries an icon + label + title
                // rather than colour alone.
                const baselineOf = (meter: MeterReading) => readingBaseline(meter.readings);

                return (
                    <SectionBoundary title="Meter consumption & anomalies">
                    {/* Labelled region, not a second tabpanel: the "data" tab controls the analysis view above. */}
                    <div role="region" aria-label="Meter consumption and anomalies" className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-200">
                        {/* Toolbar — title + subtitle live inside it, matching the STP
                            Daily Operations Log reference. This single table replaces the
                            former "Monthly Breakdown" plus the separate anomaly table. */}
                        <TableToolbar className="flex-wrap">
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-foreground">Meter Consumption &amp; Anomalies</h3>
                                <p className="text-sm text-muted-foreground">
                                    Per-meter usage for {displayMonths[0]}{displayMonths.length > 1 ? ` – ${displayMonths[displayMonths.length - 1]}` : ''} — cells are flagged where a reading breaks from that meter&apos;s own baseline.
                                </p>
                            </div>

                            <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md sm:ml-auto">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    aria-label="Search meters"
                                    placeholder="Search meters..."
                                    value={dbSearchTerm}
                                    onChange={(e) => { setDbSearchTerm(e.target.value); setDbCurrentPage(1); }}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                />
                            </div>

                            <MultiSelectDropdown
                                label="Type"
                                options={allMeterTypes}
                                selected={dbSelectedTypes}
                                onChange={(s) => { setDbSelectedTypes(s); setDbCurrentPage(1); }}
                                getOptionColor={getMeterTypeColor}
                            />

                            {dbHasActiveFilters && (
                                <button
                                    onClick={() => { setDbSearchTerm(''); setDbSelectedTypes([...allMeterTypes]); setDbCurrentPage(1); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}

                            <button
                                onClick={handleDbExportCSV}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export CSV</span>
                            </button>

                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                <span className="font-semibold text-foreground">{dbFilteredMeters.length}</span>
                                {dbFilteredMeters.length !== meters.length && (
                                    <span> of {meters.length}</span>
                                )} meters
                            </div>
                        </TableToolbar>

                        {/* Anomaly legend — wraps on narrow screens (the old one was a
                            single non-wrapping flex row that overflowed on mobile) and
                            prints the live gate values from lib/thresholds. */}
                        <AnomalyLegend />

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
                                onRemove: () => { setDbSelectedTypes([...allMeterTypes]); setDbCurrentPage(1); }
                            }] : []),
                        ]} />

                        {/* Mobile card view — the desktop table is 3 fixed + N month
                            columns and only scrolled horizontally on phones, which is
                            unusable in the field. STP already shipped an md:hidden card
                            list; this is its electricity equivalent. */}
                        <div className="space-y-3 md:hidden">
                            {dbPaginatedMeters.map((meter) => {
                                const { baseline, samples } = baselineOf(meter);
                                const rangeTotal = displayMonths.reduce((a, month) => a + (meter.readings[month] || 0), 0);
                                return (
                                    <div key={meter.id} className="space-y-3 rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="min-w-0 text-sm font-semibold text-foreground">{meter.name}</p>
                                            <StatusBadge label={meter.type} color={getMeterTypeColor(meter.type)} />
                                        </div>
                                        <p className="meter text-[11px] text-muted-foreground">{meter.account_number}</p>

                                        <ul className="grid list-none grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                            {displayMonths.map(month => {
                                                const val = meter.readings[month];
                                                const d = describeReading(val, month, baseline, samples);
                                                return (
                                                    <li key={month} className="flex items-center justify-between gap-2" title={d.title}>
                                                        <span className="text-muted-foreground">{month}</span>
                                                        <span className={`rounded px-1 font-mono ${d.className}`}>
                                                            <ReadingValue value={val} descriptor={d} />
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                                            <span className="text-muted-foreground">Total · Cost</span>
                                            <span className="font-mono font-semibold text-foreground">
                                                {rangeTotal.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh
                                                <span className="text-mb-success-text"> · {(rangeTotal * ratePerKWh).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {dbFilteredMeters.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Gauge className="mx-auto mb-2 h-7 w-7 text-muted-foreground/70" aria-hidden="true" />
                                    <p className="text-sm font-medium">No meters found matching your filters.</p>
                                </div>
                            )}
                            {dbFilteredMeters.length > 1 && (
                                <div className="rounded-[10.5px] border border-border bg-muted-bg/60 p-4">
                                    <p className="text-sm font-semibold text-foreground"><Gauge className="mr-1.5 inline h-3.5 w-3.5 text-module-electricity" aria-hidden="true" />Total · {dbFilteredMeters.length} meters</p>
                                    <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                                        {grandRangeTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh ·{' '}
                                        {(grandRangeTotal * ratePerKWh).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Table (desktop) */}
                        <div className="hidden md:block">
                        <Table data-density="compact">
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead field="label" currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort} className="col-sticky min-w-[200px]">Name</SortableTableHead>
                                    <SortableTableHead field="account" currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort}>Account #</SortableTableHead>
                                    <SortableTableHead field="type" currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort}>Type</SortableTableHead>
                                    {displayMonths.map(month => (
                                        <SortableTableHead key={month} field={month} currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort} align="right" className="text-right min-w-[90px]">{month}</SortableTableHead>
                                    ))}
                                    <SortableTableHead field="total" currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort} align="right" className="num min-w-[100px]">Total (kWh)</SortableTableHead>
                                    <SortableTableHead field="cost" currentSortField={dbSortField} currentSortDirection={dbSortDirection} onSort={handleDbSort} align="right" className="num min-w-[90px]">Cost (OMR)</SortableTableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dbPaginatedMeters.map((meter) => {
                                    // Total + cost reflect the selected range (matching the KPI cards),
                                    // not the meter's full history.
                                    const rangeTotal = displayMonths.reduce((a, month) => a + (meter.readings[month] || 0), 0);
                                    const { baseline, samples } = baselineOf(meter);
                                    return (
                                        <TableRow key={meter.id}>
                                            <TableCell className="col-sticky strong">{meter.name}</TableCell>
                                            <TableCell className="meter">{meter.account_number}</TableCell>
                                            <TableCell>
                                                <StatusBadge label={meter.type} color={getMeterTypeColor(meter.type)} />
                                            </TableCell>
                                            {displayMonths.map(month => {
                                                // NOTE: `meter.readings[month]` is read raw — `|| 0` would
                                                // collapse a missing month into 0 and a negative reading
                                                // into "—", which is exactly what hid the documented
                                                // Bank Muscat Sep-24 = −2 kWh from this table.
                                                const val = meter.readings[month];
                                                const d = describeReading(val, month, baseline, samples);
                                                return (
                                                    <TableCell key={month} className={`num ${d.className}`} title={d.title}>
                                                        <ReadingValue value={val} descriptor={d} />
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="num">{rangeTotal.toLocaleString('en-US', { maximumFractionDigits: 1 })}</TableCell>
                                            <TableCell className="num text-mb-success-text">{(rangeTotal * ratePerKWh).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {dbFilteredMeters.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5 + displayMonths.length} className="py-12 text-center text-muted-foreground">
                                            No meters found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {dbFilteredMeters.length > 1 && (
                                    <TableRow className="bg-muted-bg/80 dark:bg-muted-bg/60">
                                        <TableCell className="col-sticky strong">Total · {dbFilteredMeters.length} meters</TableCell>
                                        <TableCell />
                                        <TableCell />
                                        {displayMonths.map(month => {
                                            const monthTotal = dbFilteredMeters.reduce((s, m) => s + (m.readings[month] || 0), 0);
                                            return (
                                                <TableCell key={`total-${month}`} className="num">
                                                    {monthTotal !== 0 ? monthTotal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="num">{grandRangeTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className="num text-mb-success-text">{(grandRangeTotal * ratePerKWh).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
                    </SectionBoundary>
                );
            })()}
        </div >
    );
}
