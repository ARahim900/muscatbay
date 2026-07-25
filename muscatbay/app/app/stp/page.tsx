"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getSTPOperations, STPOperation } from "@/lib/mock-data";
import { getSTPOperationsFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { STP_RATES } from "@/lib/config";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Droplets,
    Recycle,
    Truck,
    DollarSign,
    PiggyBank,
    TrendingUp,
    Gauge,
    Activity,
    Database,
    Search,
    Download,
    ChevronDown,
    AlertTriangle,
} from "lucide-react";
import { TablePagination, TableToolbar, StatusBadge, SortableTableHead, type BadgeColor, type PageSizeOption } from "@/components/shared/data-table";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableCell } from "@/components/ui/table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { format } from "date-fns";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useAppNotifications } from "@/components/providers/notification-provider";
import { useToast } from "@/components/ui/toast-provider";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { calcTrend } from "@/lib/trends";
import { STP_THRESHOLDS } from "@/lib/thresholds";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { PlantWatch } from "@/components/stp/plant-watch";
import {
    ChartViewToggle, STPVolumeChart, STPEconomicChart, STPTankerChart,
    type ChartView, type STPChartDataPoint,
} from "@/components/stp/stp-trend-charts";

// Use centralized config for rates
const { TANKER_FEE, TSE_SAVING_RATE } = STP_RATES;

// Sanitize STP rows at the source so no downstream `format(new Date(op.date))`
// (charts, log, Plant Watch, date-range picker) is fed a bad row:
//   1. Drop null/invalid dates — a NaN date would throw and white-screen.
//   2. Drop rows dated in the FUTURE. Operational readings can't come from the
//      future, so a stray future-dated row (e.g. a `2027-05-06` record the
//      Airtable→Supabase sync keeps re-introducing — see PROJECT_STATUS §4)
//      is a data error. Left in, it becomes the newest month and gets
//      auto-selected as the range endpoint, which surfaced as the "January
//      2027" empty-dropdown bug. A 2-day grace absorbs timezone skew so a
//      legitimately-today reading is never dropped; in-progress current-month
//      data (dated ≤ today) is always kept.
//   3. REPORT what was dropped. Silently discarding rows is how the sync's
//      bad records stayed invisible for months; the count is surfaced in the
//      page header so an operator knows the view is not the whole table.
const FUTURE_GRACE_MS = 2 * 24 * 60 * 60 * 1000;

interface SanitizedOps {
    rows: STPOperation[];
    /** Rows dropped because they are dated in the future beyond the grace window. */
    futureExcluded: number;
    /** Rows dropped because the date was null or unparseable. */
    invalidExcluded: number;
}

const withValidDates = (ops: STPOperation[]): SanitizedOps => {
    const cutoff = Date.now() + FUTURE_GRACE_MS;
    let futureExcluded = 0;
    let invalidExcluded = 0;
    const rows = ops.filter((op) => {
        if (op?.date == null) { invalidExcluded++; return false; }
        const t = new Date(op.date).getTime();
        if (Number.isNaN(t)) { invalidExcluded++; return false; }
        if (t > cutoff) { futureExcluded++; return false; }
        return true;
    });
    return { rows, futureExcluded, invalidExcluded };
};

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit)
const STP_CACHE_KEY = "stp:page";
interface StpPageCache {
    operations: STPOperation[];
    lastUpdated: Date;
}

export default function STPPage() {
    const [activeTab, setActiveTab] = useState("watch");
    // Seed from the session cache so revisits render instantly (silent refresh below)
    const [cached] = useState(() => getPageCache<StpPageCache>(STP_CACHE_KEY));
    const [allOperations, setAllOperations] = useState<STPOperation[]>(cached?.operations ?? []);
    const [loading, setLoading] = useState(!cached);
    const [isLiveData, setIsLiveData] = useState(Boolean(cached));
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
    // A Supabase failure used to fall through to mock data with nothing but a
    // "Demo Data" pill — an honest error beats a silent fiction.
    const [loadError, setLoadError] = useState<string | null>(null);
    // Rows the sanitizer dropped, surfaced instead of silently discarded.
    const [excluded, setExcluded] = useState<{ future: number; invalid: number }>({ future: 0, invalid: 0 });

    // Date range filter state
    const [startMonth, setStartMonth] = useState<string>('');
    const [endMonth, setEndMonth] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');

    // Daily Operations Log sorting and pagination state
    const [logSortField, setLogSortField] = useState<string>('date');
    const [logSortDirection, setLogSortDirection] = useState<'asc' | 'desc'>('desc');
    const [logCurrentPage, setLogCurrentPage] = useState(1);
    const [logPageSize, setLogPageSize] = useState<PageSizeOption>(25);
    const [logSearchTerm, setLogSearchTerm] = useState('');

    // Chart view mode state (Daily/Monthly toggle per chart)
    const [volumeChartView, setVolumeChartView] = useState<ChartView>('monthly');
    const [economicChartView, setEconomicChartView] = useState<ChartView>('monthly');
    const [tankerChartView, setTankerChartView] = useState<ChartView>('monthly');

    // Stable fetch function — used both on mount and by real-time handler
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const configured = isSupabaseConfigured();
        try {
            if (configured) {
                const supabaseData = await getSTPOperationsFromSupabase();
                if (supabaseData.length > 0) {
                    const sanitized = withValidDates(supabaseData);
                    setAllOperations(sanitized.rows);
                    setExcluded({ future: sanitized.futureExcluded, invalid: sanitized.invalidExcluded });
                    setIsLiveData(true);
                    setLoadError(null);
                    const now = new Date();
                    setLastUpdated(now);
                    setPageCache<StpPageCache>(STP_CACHE_KEY, { operations: sanitized.rows, lastUpdated: now });
                    if (!silent) setLoading(false);
                    return;
                }
                // Configured but empty: that is a real problem with the live
                // table, not a cue to quietly swap in demo numbers.
                if (!silent) {
                    setLoadError("Supabase returned no STP operations. Showing no data rather than demo figures — check the stp_operations table and the AITable sync.");
                    setIsLiveData(false);
                    setAllOperations([]);
                    setExcluded({ future: 0, invalid: 0 });
                }
                return;
            }
            // Supabase is not configured at all → demo data is the honest answer,
            // and the "Demo Data" pill already says so.
            if (!silent) {
                const result = withValidDates(await getSTPOperations());
                setAllOperations(result.rows);
                setExcluded({ future: result.futureExcluded, invalid: result.invalidExcluded });
                setIsLiveData(false);
                setLoadError(null);
            }
        } catch (e: unknown) {
            if (!silent) {
                const message = e instanceof Error ? e.message : "Unknown error";
                if (configured) {
                    setLoadError(`Could not load STP operations from Supabase: ${message}`);
                    setIsLiveData(false);
                    setAllOperations([]);
                    setExcluded({ future: 0, invalid: 0 });
                } else {
                    const result = withValidDates(await getSTPOperations());
                    setAllOperations(result.rows);
                    setExcluded({ future: result.futureExcluded, invalid: result.invalidExcluded });
                    setIsLiveData(false);
                }
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // ── Supabase real-time subscription for stp_operations table ──────────
    const { isLive } = useSupabaseRealtime({
        table: 'stp_operations',
        channelName: 'stp-operations-rt',
        onChanged: () => loadData(true),
        enabled: isLiveData,
    });

    // ── Notifications: alert when STP data changes exceed thresholds ────
    // useAppNotifications → browser push + notification history
    // useToast → in-app floating toast (visible immediately)
    const pushNotifications = useAppNotifications();
    const toast = useToast();

    // Stable refs for notification functions to avoid re-running the threshold effect
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const pushRef = useRef(pushNotifications);
    pushRef.current = pushNotifications;

    // Track which alerts have already been shown to avoid repeats on re-renders
    const alertedRef = useRef<string | null>(null);

    // Check latest data for threshold breaches when operations update
    useEffect(() => {
        if (allOperations.length === 0) return;
        const latest = allOperations[0]; // Most recent record

        // Unique key for this record so we don't alert the same data twice
        const alertKey = `${latest.date}-${latest.inlet_sewage}-${latest.tanker_trips}`;
        if (alertedRef.current === alertKey) return;
        alertedRef.current = alertKey;

        // Gates come from lib/thresholds.ts — the same file Plant Watch, the
        // heatmap and the findings register read, so a toast can never claim a
        // different story from the surface below it.
        if (latest.inlet_sewage > STP_THRESHOLDS.INLET_TOAST_M3) {
            const msg = `Inlet sewage is ${latest.inlet_sewage.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³ — exceeds the ${STP_THRESHOLDS.INLET_TOAST_M3.toLocaleString('en-US')} m³ threshold`;
            toastRef.current.warning("STP Alert: High Inlet", msg);
            pushRef.current.warning("STP Alert: High Inlet", msg);
        }

        // Alert if tanker trips are unusually high for a single day
        if (latest.tanker_trips > STP_THRESHOLDS.TANKER_TOAST_TRIPS) {
            const msg = `${latest.tanker_trips} tanker trips recorded today`;
            toastRef.current.info("STP: High Tanker Activity", msg);
            pushRef.current.info("STP: High Tanker Activity", msg);
        }
    }, [allOperations]);

    useEffect(() => {
        // Cache hit → already rendering last data; refresh silently in background.
        loadData(Boolean(cached));

        // Load saved filter preferences (selectedMonth is auto-derived from data range)
        const savedPrefs = loadFilterPreferences<{
            activeTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedYear?: string;
        }>('stp');
        if (savedPrefs) {
            // Guard against stale tab keys from the old layout ("dashboard"/"details").
            if (savedPrefs.activeTab === "watch" || savedPrefs.activeTab === "dashboard") setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedYear) setSelectedYear(savedPrefs.selectedYear);
        }
    }, [loadData, cached]);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('stp', {
            activeTab,
            startMonth,
            endMonth,
            selectedYear,
        });
    }, [activeTab, startMonth, endMonth, selectedYear]);

    // Get all unique months for the slider (in MMM-YY format for display, sorted chronologically)
    const allMonths = useMemo(() => {
        const monthsSet = new Set<string>();
        allOperations.forEach(op => {
            monthsSet.add(format(new Date(op.date), "MMM-yy"));
        });
        // Sort chronologically
        return Array.from(monthsSet).sort((a, b) => {
            const [aM, aY] = a.split('-');
            const [bM, bY] = b.split('-');
            const monthOrder: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            const yearDiff = parseInt('20' + aY) - parseInt('20' + bY);
            if (yearDiff !== 0) return yearDiff;
            return monthOrder[aM] - monthOrder[bM];
        });
    }, [allOperations]);


    // Extract available years from data
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

    // Read the current range through refs so the validation effect below does NOT
    // depend on startMonth/endMonth. An effect that depends on the very state it
    // sets re-fires on its own updates — the classic "Maximum update depth
    // exceeded" loop. The legitimate triggers are data-driven (allMonths) and
    // filter-driven (selectedYear), never the range values themselves.
    const startMonthRef = useRef(startMonth);
    startMonthRef.current = startMonth;
    const endMonthRef = useRef(endMonth);
    endMonthRef.current = endMonth;

    // Initialize start/end months when data loads, validate saved prefs against
    // the actual data, and auto-extend to the newest month when new data arrives.
    useEffect(() => {
        if (allMonths.length === 0) return;

        const start = startMonthRef.current;
        const end = endMonthRef.current;
        const startValid = start && allMonths.includes(start);
        const endValid = end && allMonths.includes(end);
        const latestMonth = allMonths[allMonths.length - 1];

        if (!startValid || !endValid) {
            // Missing or stale selection — snap to the full available range.
            if (start !== allMonths[0]) setStartMonth(allMonths[0]);
            if (end !== latestMonth) setEndMonth(latestMonth);
        } else if (!selectedYear && end !== latestMonth) {
            // No year filter active — extend to newest data when new months arrive.
            setEndMonth(latestMonth);
        }
    }, [allMonths, selectedYear]);

    // Calculate filtered operations based on start/end month selection
    const operations = useMemo(() => {
        if (allMonths.length === 0 || !startMonth || !endMonth) return allOperations;

        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        const rangeMonths = startIdx >= 0 && endIdx >= 0
            ? allMonths.slice(startIdx, endIdx + 1)
            : allMonths;

        return allOperations.filter(op => {
            const opMonth = format(new Date(op.date), "MMM-yy");
            return rangeMonths.includes(opMonth);
        });
    }, [allOperations, allMonths, startMonth, endMonth]);

    // Calculate previous period operations for trend comparison
    const prevOperations = useMemo(() => {
        if (allMonths.length === 0 || !startMonth || !endMonth) return [];
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        if (startIdx <= 0) return [];
        const rangeLen = endIdx - startIdx;
        const prevEndIdx = startIdx - 1;
        const prevStartIdx = Math.max(0, prevEndIdx - rangeLen);
        const prevMonths = allMonths.slice(prevStartIdx, prevEndIdx + 1);
        return allOperations.filter(op => {
            const opMonth = format(new Date(op.date), "MMM-yy");
            return prevMonths.includes(opMonth);
        });
    }, [allOperations, allMonths, startMonth, endMonth]);

    // Get selected date range display
    const selectedDateRange = useMemo(() => {
        if (!startMonth || !endMonth) return { start: "", end: "", startMonth: "", endMonth: "" };

        const formatMonthDisplay = (m: string) => {
            const [month, year] = m.split('-');
            const months: Record<string, string> = {
                'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
            };
            return `${months[month] || month} 20${year}`;
        };

        return {
            start: formatMonthDisplay(startMonth),
            end: formatMonthDisplay(endMonth),
            startMonth,
            endMonth
        };
    }, [startMonth, endMonth]);

    // Set default month for daily log once operations load, and update when filtered range changes
    useEffect(() => {
        if (operations.length > 0) {
            // Get available months from current filtered operations
            const months = new Set<string>();
            operations.forEach(op => months.add(format(new Date(op.date), "yyyy-MM")));
            const sortedMonths = Array.from(months).sort().reverse();

            // If current selectedMonth is not in the available range, reset to latest
            if (!selectedMonth || !sortedMonths.includes(selectedMonth)) {
                setSelectedMonth(sortedMonths[0] || "");
            }
        }
    }, [operations, selectedMonth]);

    // Calculate statistics from filtered operations
    const stats = useMemo(() => {
        const totalInlet = operations.reduce((sum, op) => sum + op.inlet_sewage, 0);
        const totalTSE = operations.reduce((sum, op) => sum + op.tse_for_irrigation, 0);
        const totalTrips = operations.reduce((sum, op) => sum + op.tanker_trips, 0);
        const generatedIncome = totalTrips * TANKER_FEE;
        const waterSavings = totalTSE * TSE_SAVING_RATE;
        const totalEconomicImpact = generatedIncome + waterSavings;
        const treatmentEfficiency = totalInlet > 0 ? (totalTSE / totalInlet) * 100 : 0;
        const dailyAverageInlet = operations.length > 0 ? totalInlet / operations.length : 0;

        // Previous period totals for trend comparison
        const prevInlet = prevOperations.reduce((sum, op) => sum + op.inlet_sewage, 0);
        const prevTSE = prevOperations.reduce((sum, op) => sum + op.tse_for_irrigation, 0);
        const prevTrips = prevOperations.reduce((sum, op) => sum + op.tanker_trips, 0);
        const prevIncome = prevTrips * TANKER_FEE;
        const prevSavings = prevTSE * TSE_SAVING_RATE;
        const prevEconomicImpact = prevIncome + prevSavings;
        const prevEfficiency = prevInlet > 0 ? (prevTSE / prevInlet) * 100 : 0;
        const prevDailyAvg = prevOperations.length > 0 ? prevInlet / prevOperations.length : 0;

        const hasPrev = prevOperations.length > 0;

        const inletTrend = hasPrev ? calcTrend(totalInlet, prevInlet) : null;
        const tseTrend = hasPrev ? calcTrend(totalTSE, prevTSE) : null;
        const tripsTrend = hasPrev ? calcTrend(totalTrips, prevTrips) : null;
        const incomeTrend = hasPrev ? calcTrend(generatedIncome, prevIncome) : null;
        const savingsTrend = hasPrev ? calcTrend(waterSavings, prevSavings) : null;
        const economicTrend = hasPrev ? calcTrend(totalEconomicImpact, prevEconomicImpact) : null;
        const efficiencyTrend = hasPrev ? calcTrend(treatmentEfficiency, prevEfficiency) : null;
        const dailyAvgTrend = hasPrev ? calcTrend(dailyAverageInlet, prevDailyAvg) : null;

        return [
            {
                label: "Inlet Sewage",
                value: totalInlet.toLocaleString('en-US', { maximumFractionDigits: 1 }),
                unit: "m³",
                subtitle: `Range: ${selectedDateRange.start} - ${selectedDateRange.end}`,
                icon: Droplets,
                variant: "primary" as const,
                ...(inletTrend && { trend: inletTrend.trend, trendValue: inletTrend.trendValue }),
            },
            {
                label: "TSE for Irrigation",
                value: totalTSE.toLocaleString('en-US', { maximumFractionDigits: 1 }),
                unit: "m³",
                subtitle: "Recycled Water Output",
                icon: Recycle,
                variant: "secondary" as const,
                ...(tseTrend && { trend: tseTrend.trend, trendValue: tseTrend.trendValue }),
            },
            {
                label: "Tanker Trips",
                value: `${totalTrips.toLocaleString('en-US', { maximumFractionDigits: 1 })}`,
                subtitle: `at ${TANKER_FEE} OMR / trip`,
                icon: Truck,
                variant: "warning" as const,
                ...(tripsTrend && { trend: tripsTrend.trend, trendValue: tripsTrend.trendValue }),
            },
            {
                label: "Generated Income",
                value: generatedIncome.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                unit: "OMR",
                subtitle: "from discharge fees",
                icon: DollarSign,
                variant: "success" as const,
                ...(incomeTrend && { trend: incomeTrend.trend, trendValue: incomeTrend.trendValue }),
            },
            {
                label: "Water Savings",
                value: waterSavings.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                unit: "OMR",
                subtitle: `${TSE_SAVING_RATE} OMR per m³`,
                icon: PiggyBank,
                variant: "primary" as const,
                ...(savingsTrend && { trend: savingsTrend.trend, trendValue: savingsTrend.trendValue }),
            },
            {
                label: "Total Economic Impact",
                value: totalEconomicImpact.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                unit: "OMR",
                subtitle: "Income + Savings",
                icon: TrendingUp,
                variant: "success" as const,
                ...(economicTrend && { trend: economicTrend.trend, trendValue: economicTrend.trendValue }),
            },
            {
                label: "Treatment Efficiency",
                value: treatmentEfficiency.toFixed(1),
                unit: "%",
                subtitle: "TSE Output to Inlet Ratio",
                icon: Gauge,
                variant: "secondary" as const,
                ...(efficiencyTrend && { trend: efficiencyTrend.trend, trendValue: efficiencyTrend.trendValue }),
            },
            {
                label: "Daily Average Inlet",
                value: Math.round(dailyAverageInlet).toLocaleString('en-US', { maximumFractionDigits: 1 }),
                unit: "m³",
                subtitle: "Average Daily Input",
                icon: Activity,
                variant: "primary" as const,
                ...(dailyAvgTrend && { trend: dailyAvgTrend.trend, trendValue: dailyAvgTrend.trendValue }),
            }
        ];
    }, [operations, prevOperations, selectedDateRange]);

    // Monthly chart data from filtered operations (sorted chronologically)
    const monthlyChartData = useMemo(() => {
        const monthly: Record<string, STPChartDataPoint> = {};

        operations.forEach(op => {
            const monthKey = format(new Date(op.date), "MMM-yy");
            const sortKey = format(new Date(op.date), "yyyy-MM");
            if (!monthly[monthKey]) {
                monthly[monthKey] = { month: monthKey, sortKey, inlet: 0, tse: 0, income: 0, savings: 0, trips: 0 };
            }
            monthly[monthKey].inlet += op.inlet_sewage;
            monthly[monthKey].tse += op.tse_for_irrigation;
            monthly[monthKey].income += (op.tanker_trips * TANKER_FEE);
            monthly[monthKey].savings += (op.tse_for_irrigation * TSE_SAVING_RATE);
            monthly[monthKey].trips += op.tanker_trips;
        });

        return Object.values(monthly).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [operations]);

    // Daily chart data from filtered operations, grouped by date (sorted chronologically)
    const dailyChartData = useMemo(() => {
        const daily: Record<string, STPChartDataPoint> = {};

        operations.forEach(op => {
            const dateKey = format(new Date(op.date), "yyyy-MM-dd");
            if (!daily[dateKey]) {
                daily[dateKey] = { month: format(new Date(op.date), "dd MMM"), sortKey: dateKey, inlet: 0, tse: 0, income: 0, savings: 0, trips: 0 };
            }
            daily[dateKey].inlet += op.inlet_sewage;
            daily[dateKey].tse += op.tse_for_irrigation;
            daily[dateKey].income += op.tanker_trips * TANKER_FEE;
            daily[dateKey].savings += op.tse_for_irrigation * TSE_SAVING_RATE;
            daily[dateKey].trips += op.tanker_trips;
        });

        return Object.values(daily).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [operations]);

    // Get available months for daily log dropdown (from filtered data)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        operations.forEach(op => {
            months.add(format(new Date(op.date), "yyyy-MM"));
        });
        return Array.from(months).sort().reverse();
    }, [operations]);

    // Daily operations for selected month with sorting
    const dailyOperations = useMemo(() => {
        if (!selectedMonth) return [];
        let filtered = operations.filter(op => {
            const opMonth = format(new Date(op.date), "yyyy-MM");
            return opMonth === selectedMonth;
        });

        // Search filter
        if (logSearchTerm) {
            const term = logSearchTerm.toLowerCase();
            filtered = filtered.filter(op => {
                const dateStr = format(new Date(op.date), "dd/MM/yyyy");
                return dateStr.includes(term) ||
                    op.inlet_sewage.toString().includes(term) ||
                    op.tse_for_irrigation.toString().includes(term) ||
                    op.tanker_trips.toString().includes(term);
            });
        }

        // Sort based on logSortField and logSortDirection
        filtered.sort((a, b) => {
            let aVal: number | string = 0;
            let bVal: number | string = 0;
            const aEfficiency = a.inlet_sewage > 0 ? (a.tse_for_irrigation / a.inlet_sewage) * 100 : 0;
            const bEfficiency = b.inlet_sewage > 0 ? (b.tse_for_irrigation / b.inlet_sewage) * 100 : 0;
            const aIncome = a.tanker_trips * TANKER_FEE;
            const bIncome = b.tanker_trips * TANKER_FEE;
            const aSavings = a.tse_for_irrigation * TSE_SAVING_RATE;
            const bSavings = b.tse_for_irrigation * TSE_SAVING_RATE;

            switch (logSortField) {
                case 'date': aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
                case 'inlet': aVal = a.inlet_sewage; bVal = b.inlet_sewage; break;
                case 'tse': aVal = a.tse_for_irrigation; bVal = b.tse_for_irrigation; break;
                case 'efficiency': aVal = aEfficiency; bVal = bEfficiency; break;
                case 'trips': aVal = a.tanker_trips; bVal = b.tanker_trips; break;
                case 'income': aVal = aIncome; bVal = bIncome; break;
                case 'savings': aVal = aSavings; bVal = bSavings; break;
                case 'total': aVal = aIncome + aSavings; bVal = bIncome + bSavings; break;
                default: aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime();
            }
            return logSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });

        return filtered;
    }, [operations, selectedMonth, logSearchTerm, logSortField, logSortDirection]);

    // Paginated daily operations
    const logEffectivePageSize = logPageSize === 'All' ? dailyOperations.length : logPageSize;
    const logTotalPages = Math.ceil(dailyOperations.length / (logEffectivePageSize || 1));
    const logStartIndex = (logCurrentPage - 1) * logEffectivePageSize;

    const paginatedDailyOperations = useMemo(() => {
        return dailyOperations.slice(logStartIndex, logStartIndex + logEffectivePageSize);
    }, [dailyOperations, logStartIndex, logEffectivePageSize]);

    // Month totals — computed from ALL daily operations (not paginated) for the selected month
    const monthTotals = useMemo(() => {
        if (dailyOperations.length === 0) return null;
        const totalInlet = dailyOperations.reduce((sum, op) => sum + op.inlet_sewage, 0);
        const totalTSE = dailyOperations.reduce((sum, op) => sum + op.tse_for_irrigation, 0);
        const totalTrips = dailyOperations.reduce((sum, op) => sum + op.tanker_trips, 0);
        const avgEfficiency = totalInlet > 0 ? (totalTSE / totalInlet) * 100 : 0;
        const totalIncome = totalTrips * TANKER_FEE;
        const totalSavings = totalTSE * TSE_SAVING_RATE;
        const totalImpact = totalIncome + totalSavings;
        return { totalInlet, totalTSE, totalTrips, avgEfficiency, totalIncome, totalSavings, totalImpact };
    }, [dailyOperations]);

    // Handle sort for daily log
    const handleLogSort = (field: string) => {
        if (logSortField === field) {
            setLogSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setLogSortField(field);
            setLogSortDirection('desc');
        }
        setLogCurrentPage(1);
    };

    // Export daily ops to CSV
    const handleLogExportCSV = () => {
        const data = dailyOperations.map(op => {
            const efficiency = op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : 0;
            const income = op.tanker_trips * TANKER_FEE;
            const savings = op.tse_for_irrigation * TSE_SAVING_RATE;
            return {
                Date: format(new Date(op.date), "dd/MM/yyyy"),
                'Inlet (m³)': op.inlet_sewage,
                'TSE Output (m³)': op.tse_for_irrigation,
                'Efficiency %': Number(efficiency.toFixed(1)),
                'Tanker Trips': op.tanker_trips,
                'Income (OMR)': Number(income.toFixed(1)),
                'Savings (OMR)': Number(savings.toFixed(1)),
                'Total Impact (OMR)': Number((income + savings).toFixed(1)),
            };
        });
        exportToCSV(data, `stp-daily-ops-${selectedMonth}-${getDateForFilename()}`);
    };

    // Range change handler for DateRangePicker
    const handleRangeChange = useCallback((start: string, end: string) => {
        if (start !== startMonth) setStartMonth(start);
        if (end !== endMonth) setEndMonth(end);
    }, [startMonth, endMonth]);

    // Reset date range to full
    const handleResetRange = () => {
        setSelectedYear('');
        if (allMonths.length > 0) {
            setStartMonth(allMonths[0]);
            setEndMonth(allMonths[allMonths.length - 1]);
        }
    };

    // The newest reading actually in the data — NOT the browser fetch time.
    // "Last sync 14:32" says nothing about whether the log is three days stale.
    const latestDataDate = useMemo(() => {
        let newest: number | null = null;
        for (const op of allOperations) {
            const t = new Date(op.date).getTime();
            if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
        }
        return newest === null ? null : new Date(newest);
    }, [allOperations]);

    // Heatmap drill-through: a cell in Plant Watch opens that exact day in the
    // Daily Operations Log (right tab, right month, row pre-filtered).
    const handleInspectDay = useCallback((day: { iso: string; ym: string; dayLabel: string; date: Date }) => {
        setActiveTab('dashboard');
        setSelectedMonth(day.ym);
        setLogSearchTerm(format(day.date, 'dd/MM/yyyy'));
        setLogCurrentPage(1);
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
                {/* Filter skeleton */}
                <div className="p-6 rounded-xl border border-border/60 bg-card/50">
                    <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
                {/* Stats skeleton */}
                <StatsGridSkeleton />
                {/* Chart skeleton */}
                <ChartSkeleton height="h-[350px]" />
                <div className="grid gap-6 md:grid-cols-2">
                    <ChartSkeleton height="h-[350px]" />
                    <ChartSkeleton height="h-[350px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="STP Plant"
                    description="Water Treatment Management"
                />
                <PageStatusBar
                    isConnected={isLiveData}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    latestDataDate={latestDataDate}
                    error={loadError}
                >
                    <span className="text-[10px] text-muted-foreground">{allOperations.length} daily records</span>
                </PageStatusBar>
            </div>

            {/* Rows the sanitizer removed. Dropping them is correct (a reading
                cannot come from the future); doing it silently is not. */}
            {(excluded.future > 0 || excluded.invalid > 0) && (
                <div role="status" className="flex flex-wrap items-start gap-2 rounded-[10.5px] border border-border bg-mb-warning-light/60 px-4 py-3 text-xs text-mb-warning-text dark:bg-mb-warning-light">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                        <strong className="font-semibold">
                            {excluded.future + excluded.invalid} row{excluded.future + excluded.invalid === 1 ? "" : "s"} excluded from this view.
                        </strong>{" "}
                        {excluded.future > 0 && `${excluded.future} dated in the future (beyond a 2-day timezone grace) — a reading cannot come from the future, so these are sync errors in stp_operations. `}
                        {excluded.invalid > 0 && `${excluded.invalid} had a missing or unparseable date. `}
                        Every figure below is computed without them.
                    </span>
                </div>
            )}

            {/* Shared period filter — drives BOTH Plant Watch and Operations & Trends,
                so an operator never has to change tabs to re-scope the range. */}
            {allMonths.length > 0 && (
                <Card className="card-elevated">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col gap-4">
                            {/* Year Selector Row */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
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
                                <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                    {filteredMonthsByYear.length} Months Available
                                </Badge>
                            </div>

                            {/* Date Range Picker */}
                            <DateRangePicker
                                startMonth={startMonth || (filteredMonthsByYear[0] ?? allMonths[0])}
                                endMonth={endMonth || (filteredMonthsByYear[filteredMonthsByYear.length - 1] ?? allMonths[allMonths.length - 1])}
                                availableMonths={filteredMonthsByYear}
                                onRangeChange={handleRangeChange}
                                onReset={handleResetRange}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs — inspection-first: Plant Watch leads, analytics/records follow */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="secondary"
                tabs={[
                    { key: "watch", label: "Plant Watch", icon: Gauge },
                    { key: "dashboard", label: "Operations & Trends", icon: Activity },
                ]}
            />

            {/* Plant Watch — process-health cards, day heatmap, exceptions & actions */}
            {activeTab === "watch" && (
                <div id="panel-watch" role="tabpanel" aria-labelledby="tab-watch" tabIndex={0} className="motion-safe:animate-in motion-safe:fade-in duration-200">
                    <PlantWatch operations={operations} onInspectDay={handleInspectDay} />
                </div>
            )}

            {activeTab === "dashboard" && (
                <div id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Unified Stats Grid */}
                    <SectionBoundary title="Operations KPIs">
                        <StatsGrid stats={stats} />
                    </SectionBoundary>

                    {/* Water Treatment Volumes Chart */}
                    <SectionBoundary title="Water treatment volumes">
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Water Treatment Volumes (m³)</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedDateRange.start && selectedDateRange.end
                                            ? `${selectedDateRange.start} \u2013 ${selectedDateRange.end} \u00B7 ${volumeChartView === 'daily' ? `${dailyChartData.length} days` : `${monthlyChartData.length} months`}`
                                            : "Sewage Inlet vs TSE Output comparison"}
                                    </p>
                                </div>
                                <ChartViewToggle value={volumeChartView} onChange={setVolumeChartView} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <STPVolumeChart data={volumeChartView === 'daily' ? dailyChartData : monthlyChartData} view={volumeChartView} />
                        </CardContent>
                    </Card>
                    </SectionBoundary>

                    {/* Two Charts Side by Side */}
                    <SectionBoundary title="Economic impact & tanker operations">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                        {/* Economic Impact */}
                        <Card className="card-elevated h-full">
                            <CardHeader className="card-elevated-header">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-[var(--mb-success-text)]" />
                                            Economic Impact (OMR)
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedDateRange.start && selectedDateRange.end
                                                ? `${selectedDateRange.start} \u2013 ${selectedDateRange.end}`
                                                : "Income & Savings breakdown"}
                                        </p>
                                    </div>
                                    <ChartViewToggle value={economicChartView} onChange={setEconomicChartView} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <STPEconomicChart data={economicChartView === 'daily' ? dailyChartData : monthlyChartData} view={economicChartView} />
                            </CardContent>
                        </Card>

                        {/* Tanker Operations */}
                        <Card className="card-elevated h-full">
                            <CardHeader className="card-elevated-header">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-[var(--mb-warning-text)]" />
                                            Tanker Operations
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedDateRange.start && selectedDateRange.end
                                                ? `${selectedDateRange.start} \u2013 ${selectedDateRange.end}`
                                                : "Tanker trip trends"}
                                        </p>
                                    </div>
                                    <ChartViewToggle value={tankerChartView} onChange={setTankerChartView} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <STPTankerChart data={tankerChartView === 'daily' ? dailyChartData : monthlyChartData} view={tankerChartView} />
                            </CardContent>
                        </Card>
                    </div>
                    </SectionBoundary>

                    {/* Daily Operations Log */}
                    <SectionBoundary title="Daily operations log">
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <TableToolbar className="flex-wrap">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Daily Operations Log</h2>
                                <p className="text-sm text-muted-foreground">Detailed daily STP operation records</p>
                            </div>

                            <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md sm:ml-auto">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    aria-label="Search operations"
                                    placeholder="Search operations..."
                                    value={logSearchTerm}
                                    onChange={(e) => { setLogSearchTerm(e.target.value); setLogCurrentPage(1); }}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                />
                            </div>

                            <Select value={selectedMonth} onValueChange={(value) => { if (value) { setSelectedMonth(value); setLogCurrentPage(1); } }}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {availableMonths.map(month => (
                                        <SelectItem key={month} value={month}>
                                            {format(new Date(`${month}-01`), "MMMM yyyy")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <button
                                onClick={handleLogExportCSV}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export CSV</span>
                            </button>

                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                <span className="font-semibold text-foreground">{dailyOperations.length}</span> records
                            </div>
                        </TableToolbar>

                        {/* Mobile card view */}
                        <div className="md:hidden space-y-3">
                            {paginatedDailyOperations.map((op) => {
                                const efficiency = op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : 0;
                                const income = op.tanker_trips * TANKER_FEE;
                                const savings = op.tse_for_irrigation * TSE_SAVING_RATE;
                                const totalImpact = income + savings;
                                const efficiencyBadgeColor: BadgeColor = efficiency >= STP_THRESHOLDS.RECOVERY_GOOD ? 'green' : efficiency >= STP_THRESHOLDS.RECOVERY_WATCH ? 'amber' : 'red';

                                return (
                                    <div key={op.id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{format(new Date(op.date), "dd/MM/yyyy")}</span>
                                            <StatusBadge label={`${efficiency.toFixed(1)}%`} color={efficiencyBadgeColor} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground">Inlet</span>
                                                <p className="font-mono font-medium text-primary">{op.inlet_sewage.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground">TSE Output</span>
                                                <p className="font-mono font-medium text-mb-info-text">{op.tse_for_irrigation.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground">Tanker Trips</span>
                                                <p className="font-mono font-medium text-[var(--mb-warning-text)]">{op.tanker_trips}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground">Total Impact</span>
                                                <p className="font-mono font-semibold text-[var(--mb-success-text)]">{totalImpact.toFixed(1)} OMR</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {dailyOperations.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Droplets className="w-7 h-7 mx-auto text-muted-foreground/70 dark:text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">No STP data for this month</p>
                                    <p className="text-xs text-muted-foreground">Select a different month to view operations data.</p>
                                </div>
                            )}
                            {/* Mobile monthly totals card — tokens only. The old version
                                composed a raw hex with string alpha suffixes
                                (`${STP_COLOR}50`), which cannot follow the theme. */}
                            {monthTotals && (
                                <div className="space-y-3 rounded-xl border border-border bg-muted/60 p-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        <Activity className="mr-1.5 inline h-3.5 w-3.5 text-module-stp" aria-hidden="true" />
                                        Monthly Total — {dailyOperations.length} day{dailyOperations.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Inlet (m³)</p>
                                            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monthTotals.totalInlet.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TSE Output (m³)</p>
                                            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monthTotals.totalTSE.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tanker Trips</p>
                                            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monthTotals.totalTrips}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Impact (OMR)</p>
                                            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monthTotals.totalImpact.toFixed(1)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block">
                            <Table data-density="compact">
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead field="date" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort}>Date</SortableTableHead>
                                        <SortableTableHead field="inlet" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Inlet (m³)</SortableTableHead>
                                        <SortableTableHead field="tse" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">TSE Output (m³)</SortableTableHead>
                                        <SortableTableHead field="efficiency" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Efficiency %</SortableTableHead>
                                        <SortableTableHead field="trips" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Tanker Trips</SortableTableHead>
                                        <SortableTableHead field="income" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Income (OMR)</SortableTableHead>
                                        <SortableTableHead field="savings" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Savings (OMR)</SortableTableHead>
                                        <SortableTableHead field="total" currentSortField={logSortField} currentSortDirection={logSortDirection} onSort={handleLogSort} align="right" className="text-right">Total Impact (OMR)</SortableTableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedDailyOperations.map((op) => {
                                        const efficiency = op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : 0;
                                        const income = op.tanker_trips * TANKER_FEE;
                                        const savings = op.tse_for_irrigation * TSE_SAVING_RATE;
                                        const totalImpact = income + savings;
                                        const efficiencyBadgeColor: BadgeColor = efficiency >= STP_THRESHOLDS.RECOVERY_GOOD ? 'green' : efficiency >= STP_THRESHOLDS.RECOVERY_WATCH ? 'amber' : 'red';

                                        return (
                                            <TableRow key={op.id}>
                                                <TableCell className="font-semibold">{format(new Date(op.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="num text-primary">{op.inlet_sewage.toLocaleString('en-US', { maximumFractionDigits: 1 })}</TableCell>
                                                <TableCell className="num text-mb-info-text">{op.tse_for_irrigation.toLocaleString('en-US', { maximumFractionDigits: 1 })}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end">
                                                        <StatusBadge label={`${efficiency.toFixed(1)}%`} color={efficiencyBadgeColor} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="num text-mb-warning-text">{op.tanker_trips}</TableCell>
                                                <TableCell className="num text-mb-success-text">{income.toFixed(1)}</TableCell>
                                                <TableCell className="num text-primary">{savings.toFixed(1)}</TableCell>
                                                <TableCell className="num text-mb-success-text">{totalImpact.toFixed(1)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {dailyOperations.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Droplets className="w-7 h-7 text-muted-foreground/70 dark:text-muted-foreground" />
                                                    <p className="text-sm font-medium">No STP data for this month</p>
                                                    <p className="text-xs text-muted-foreground">Select a different month to view operations data.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>

                                {/* Totals footer row — tokens only (was a raw hex + alpha
                                    suffix that could not adapt to dark mode). */}
                                {monthTotals && (() => {
                                    const { RECOVERY_GOOD, RECOVERY_WATCH } = STP_THRESHOLDS;
                                    const effColor: BadgeColor = monthTotals.avgEfficiency >= RECOVERY_GOOD ? 'green' : monthTotals.avgEfficiency >= RECOVERY_WATCH ? 'amber' : 'red';
                                    const cell = "px-4 sm:px-6 py-4 align-middle text-sm font-semibold text-right tabular-nums text-foreground";
                                    return (
                                        <TableFooter>
                                            <tr className="border-t-2 border-border bg-muted/80 dark:bg-muted/50">
                                                <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-semibold text-foreground sm:px-6">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Activity className="h-3.5 w-3.5 shrink-0 text-module-stp" aria-hidden="true" />
                                                        Monthly Total ({dailyOperations.length} day{dailyOperations.length !== 1 ? 's' : ''})
                                                    </span>
                                                </td>
                                                <td className={cell}>{monthTotals.totalInlet.toLocaleString('en-US', { maximumFractionDigits: 1 })}</td>
                                                <td className={cell}>{monthTotals.totalTSE.toLocaleString('en-US', { maximumFractionDigits: 1 })}</td>
                                                <td className="px-4 sm:px-6 py-4 align-middle text-sm text-right">
                                                    <div className="flex justify-end">
                                                        <StatusBadge label={`${monthTotals.avgEfficiency.toFixed(1)}%`} color={effColor} />
                                                    </div>
                                                </td>
                                                <td className={cell}>{monthTotals.totalTrips}</td>
                                                <td className={cell}>{monthTotals.totalIncome.toFixed(1)}</td>
                                                <td className={cell}>{monthTotals.totalSavings.toFixed(1)}</td>
                                                <td className={`${cell} bg-muted/60 dark:bg-muted/30 text-primary dark:text-foreground`}>{monthTotals.totalImpact.toFixed(1)}</td>
                                            </tr>
                                        </TableFooter>
                                    );
                                })()}
                            </Table>
                        </div>

                        {/* Pagination */}
                        {dailyOperations.length > 0 && (
                            <TablePagination
                                currentPage={logCurrentPage}
                                totalPages={logTotalPages}
                                totalItems={dailyOperations.length}
                                pageSize={logPageSize}
                                startIndex={logStartIndex}
                                endIndex={Math.min(logStartIndex + logEffectivePageSize, dailyOperations.length)}
                                onPageChange={setLogCurrentPage}
                                onPageSizeChange={(size) => { setLogPageSize(size); setLogCurrentPage(1); }}
                            />
                        )}
                    </div>
                    </SectionBoundary>
                    {/* Full operations database (Airtable) — folded in from the old
                        standalone "Details Data" tab so the section stays at two tabs. */}
                    <details className="group rounded-[10.5px] border border-border bg-card">
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                            <Database className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">STP Operations Database</p>
                                <p className="text-xs text-muted-foreground">Full detailed logs via Airtable — click to expand</p>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="border-t border-border">
                            <iframe
                                src="https://aitable.ai/share/shripyzrlnlQ91WRSyCLF"
                                className="h-[70vh] w-full"
                                style={{ border: 'none' }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allow="fullscreen"
                                title="STP Operations Database"
                            />
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
