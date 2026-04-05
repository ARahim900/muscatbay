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
} from "lucide-react";
import { SortIcon, TablePagination, type PageSizeOption } from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { format } from "date-fns";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useAppNotifications } from "@/components/NotificationProvider";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

// Use centralized config for rates
const { TANKER_FEE, TSE_SAVING_RATE } = STP_RATES;

const CHART_COLORS = {
    primary: 'var(--chart-stp-primary)',
    secondary: 'var(--chart-stp-secondary)',
    accent: 'var(--chart-stp-accent)',
    success: 'var(--chart-success)',
    loss: 'var(--chart-loss)',
    brand: 'var(--chart-brand)',
    amber: 'var(--chart-amber)',
    gray: 'var(--chart-gray)',
} as const;

function ChartViewToggle({ value, onChange }: { value: 'daily' | 'monthly'; onChange: (v: 'daily' | 'monthly') => void }) {
    return (
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
                onClick={() => onChange('daily')}
                className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    value === 'daily'
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
            >
                Daily
            </button>
            <button
                onClick={() => onChange('monthly')}
                className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    value === 'monthly'
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
            >
                Monthly
            </button>
        </div>
    );
}

export default function STPPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [allOperations, setAllOperations] = useState<STPOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    const [volumeChartView, setVolumeChartView] = useState<'daily' | 'monthly'>('monthly');
    const [economicChartView, setEconomicChartView] = useState<'daily' | 'monthly'>('monthly');
    const [tankerChartView, setTankerChartView] = useState<'daily' | 'monthly'>('monthly');

    // Stable fetch function — used both on mount and by real-time handler
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            if (isSupabaseConfigured()) {
                const supabaseData = await getSTPOperationsFromSupabase();
                if (supabaseData.length > 0) {
                    setAllOperations(supabaseData);
                    setIsLiveData(true);
                    setLastUpdated(new Date());
                    if (!silent) setLoading(false);
                    return;
                }
            }
            if (!silent) {
                const result = await getSTPOperations();
                setAllOperations(result);
                setIsLiveData(false);
            }
        } catch (e) {
            if (!silent) {
                // Silent fallback to mock data
                const result = await getSTPOperations();
                setAllOperations(result);
                setIsLiveData(false);
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

        // Alert if inlet sewage exceeds 4800 m³ (high end of normal range)
        if (latest.inlet_sewage > 4800) {
            const msg = `Inlet sewage is ${latest.inlet_sewage.toLocaleString()} m³ — exceeds 4,800 m³ threshold`;
            toastRef.current.warning("STP Alert: High Inlet", msg);
            pushRef.current.warning("STP Alert: High Inlet", msg);
        }

        // Alert if tanker trips are unusually high (> 3 in a day)
        if (latest.tanker_trips > 3) {
            const msg = `${latest.tanker_trips} tanker trips recorded today`;
            toastRef.current.info("STP: High Tanker Activity", msg);
            pushRef.current.info("STP: High Tanker Activity", msg);
        }
    }, [allOperations]);

    useEffect(() => {
        loadData();

        // Load saved filter preferences (selectedMonth is auto-derived from data range)
        const savedPrefs = loadFilterPreferences<{
            activeTab?: string;
            startMonth?: string;
            endMonth?: string;
            selectedYear?: string;
        }>('stp');
        if (savedPrefs) {
            if (savedPrefs.activeTab) setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedYear) setSelectedYear(savedPrefs.selectedYear);
        }
    }, [loadData]);

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

    // Initialize start and end months when data loads, and validate saved prefs against actual data
    useEffect(() => {
        if (allMonths.length > 0) {
            const startValid = startMonth && allMonths.includes(startMonth);
            const endValid = endMonth && allMonths.includes(endMonth);
            const latestMonth = allMonths[allMonths.length - 1];

            if (!startValid || !endValid) {
                // If saved prefs are invalid, reset to full range
                setStartMonth(allMonths[0]);
                setEndMonth(latestMonth);
            }
        }
    }, [allMonths, startMonth, endMonth]);

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

        return [
            {
                label: "Inlet Sewage",
                value: `${totalInlet.toLocaleString('en-US')} m³`,
                subtitle: `Range: ${selectedDateRange.start} - ${selectedDateRange.end}`,
                icon: Droplets,
                variant: "primary" as const,
            },
            {
                label: "TSE for Irrigation",
                value: `${totalTSE.toLocaleString('en-US')} m³`,
                subtitle: "Recycled Water Output",
                icon: Recycle,
                variant: "secondary" as const,
            },
            {
                label: "Tanker Trips",
                value: `${totalTrips.toLocaleString('en-US')}`,
                subtitle: `at ${TANKER_FEE} OMR / trip`,
                icon: Truck,
                variant: "warning" as const,
            },
            {
                label: "Generated Income",
                value: `${generatedIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: "from discharge fees",
                icon: DollarSign,
                variant: "success" as const,
            },
            {
                label: "Water Savings",
                value: `${waterSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: `${TSE_SAVING_RATE} OMR per m³`,
                icon: PiggyBank,
                variant: "primary" as const,
            },
            {
                label: "Total Economic Impact",
                value: `${totalEconomicImpact.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: "Income + Savings",
                icon: TrendingUp,
                variant: "success" as const,
            },
            {
                label: "Treatment Efficiency",
                value: `${treatmentEfficiency.toFixed(1)}%`,
                subtitle: "TSE Output to Inlet Ratio",
                icon: Gauge,
                variant: "secondary" as const,
            },
            {
                label: "Daily Average Inlet",
                value: `${Math.round(dailyAverageInlet).toLocaleString('en-US')} m³`,
                subtitle: "Average Daily Input",
                icon: Activity,
                variant: "primary" as const,
            }
        ];
    }, [operations, selectedDateRange]);

    // Monthly chart data from filtered operations (sorted chronologically)
    const monthlyChartData = useMemo(() => {
        const monthly: Record<string, { month: string; sortKey: string; inlet: number; tse: number; income: number; savings: number; trips: number }> = {};

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
        const daily: Record<string, { month: string; sortKey: string; inlet: number; tse: number; income: number; savings: number; trips: number }> = {};

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
                'Income (OMR)': Number(income.toFixed(2)),
                'Savings (OMR)': Number(savings.toFixed(2)),
                'Total Impact (OMR)': Number((income + savings).toFixed(2)),
            };
        });
        exportToCSV(data, `stp-daily-ops-${selectedMonth}-${getDateForFilename()}`);
    };

    // Range change handler for DateRangePicker
    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    // Reset date range to full
    const handleResetRange = () => {
        setSelectedYear('');
        if (allMonths.length > 0) {
            setStartMonth(allMonths[0]);
            setEndMonth(allMonths[allMonths.length - 1]);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-200">
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
                <div className="p-6 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-800/50">
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
                >

                </PageStatusBar>
            </div>

            {/* Tabs */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="secondary"
                tabs={[
                    { key: "dashboard", label: "Dashboard", icon: Activity },
                    { key: "details", label: "Details Data", icon: Database },
                ]}
            />

            {activeTab === "dashboard" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Date Range Filter Card */}
                    {allMonths.length > 0 && (
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

                    {/* Unified Stats Grid */}
                    <StatsGrid stats={stats} />

                    {/* Water Treatment Volumes Chart */}
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
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={volumeChartView === 'daily' ? dailyChartData : monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradInlet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradTSE" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} interval={volumeChartView === 'daily' && dailyChartData.length > 15 ? Math.ceil(dailyChartData.length / 12) - 1 : 0} />
                                        <YAxis className="text-xs" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} axisLine={false} tickLine={false} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                        <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                        <Legend iconType="circle" />
                                        <Area type="monotone" dataKey="inlet" name="Sewage Inlet" stroke={CHART_COLORS.brand} fill="url(#gradInlet)" strokeWidth={volumeChartView === 'daily' ? 2 : 3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={800} />
                                        <Area type="monotone" dataKey="tse" name="TSE Output" stroke={CHART_COLORS.primary} fill="url(#gradTSE)" strokeWidth={volumeChartView === 'daily' ? 2 : 3} animationDuration={800} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Two Charts Side by Side */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                        {/* Economic Impact */}
                        <Card className="card-elevated h-full">
                            <CardHeader className="card-elevated-header">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-mb-success" />
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
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={economicChartView === 'daily' ? dailyChartData : monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} interval={economicChartView === 'daily' && dailyChartData.length > 15 ? Math.ceil(dailyChartData.length / 12) - 1 : 0} />
                                            <YAxis className="text-xs" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} label={{ value: 'OMR', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 10 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Bar dataKey="income" name="Income" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} animationDuration={800} />
                                            <Bar dataKey="savings" name="Savings" fill="var(--chart-inlet)" radius={[6, 6, 0, 0]} animationDuration={800} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tanker Operations */}
                        <Card className="card-elevated h-full">
                            <CardHeader className="card-elevated-header">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-mb-warning" />
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
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={tankerChartView === 'daily' ? dailyChartData : monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} interval={tankerChartView === 'daily' && dailyChartData.length > 15 ? Math.ceil(dailyChartData.length / 12) - 1 : 0} />
                                            <YAxis className="text-xs" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} label={{ value: 'trips', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 10 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Line
                                                type="monotone"
                                                dataKey="trips"
                                                name="Tanker Trips"
                                                stroke={CHART_COLORS.amber}
                                                strokeWidth={tankerChartView === 'daily' ? 2 : 3}
                                                dot={tankerChartView === 'daily' && dailyChartData.length > 30 ? false : { r: 5, fill: CHART_COLORS.amber, strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                                                animationDuration={800}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Operations Log */}
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Daily Operations Log</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Detailed daily STP operation records</p>
                            </div>

                            <div className="relative flex-1 min-w-[200px] max-w-md ml-auto">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search operations..."
                                    value={logSearchTerm}
                                    onChange={(e) => { setLogSearchTerm(e.target.value); setLogCurrentPage(1); }}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                />
                            </div>

                            <Select value={selectedMonth} onValueChange={(value) => { if (value) { setSelectedMonth(value); setLogCurrentPage(1); } }}>
                                <SelectTrigger className="w-[200px]">
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
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export CSV</span>
                            </button>

                            <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{dailyOperations.length}</span> records
                            </div>
                        </div>

                        {/* Mobile card view */}
                        <div className="md:hidden space-y-3">
                            {paginatedDailyOperations.map((op) => {
                                const efficiency = op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : 0;
                                const income = op.tanker_trips * TANKER_FEE;
                                const savings = op.tse_for_irrigation * TSE_SAVING_RATE;
                                const totalImpact = income + savings;
                                const efficiencyColor = efficiency >= 95 ? "text-mb-success" : efficiency >= 90 ? "text-mb-warning" : "text-mb-danger";

                                return (
                                    <div key={op.id} className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{format(new Date(op.date), "dd/MM/yyyy")}</span>
                                            <span className={`text-sm font-mono font-semibold ${efficiencyColor}`}>{efficiency.toFixed(1)}%</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="space-y-0.5">
                                                <span className="text-slate-400">Inlet</span>
                                                <p className="font-mono font-medium text-primary">{op.inlet_sewage.toLocaleString()} m³</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-slate-400">TSE Output</span>
                                                <p className="font-mono font-medium text-blue-600 dark:text-blue-400">{op.tse_for_irrigation.toLocaleString()} m³</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-slate-400">Tanker Trips</span>
                                                <p className="font-mono font-medium text-mb-warning">{op.tanker_trips}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-slate-400">Total Impact</span>
                                                <p className="font-mono font-semibold text-mb-success">{totalImpact.toFixed(2)} OMR</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {dailyOperations.length === 0 && (
                                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                                    <Droplets className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-medium">No STP data for this month</p>
                                    <p className="text-xs text-slate-400">Select a different month to view operations data.</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                        <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('date')}>
                                            <div className="flex items-center gap-1.5">Date <SortIcon field="date" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('inlet')}>
                                            <div className="flex items-center justify-end gap-1.5">Inlet (m³) <SortIcon field="inlet" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('tse')}>
                                            <div className="flex items-center justify-end gap-1.5">TSE Output (m³) <SortIcon field="tse" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('efficiency')}>
                                            <div className="flex items-center justify-end gap-1.5">Efficiency % <SortIcon field="efficiency" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('trips')}>
                                            <div className="flex items-center justify-end gap-1.5">Tanker Trips <SortIcon field="trips" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('income')}>
                                            <div className="flex items-center justify-end gap-1.5">Income (OMR) <SortIcon field="income" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('savings')}>
                                            <div className="flex items-center justify-end gap-1.5">Savings (OMR) <SortIcon field="savings" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleLogSort('total')}>
                                            <div className="flex items-center justify-end gap-1.5">Total Impact (OMR) <SortIcon field="total" currentSortField={logSortField} currentSortDirection={logSortDirection} /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDailyOperations.map((op, idx) => {
                                        const efficiency = op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : 0;
                                        const income = op.tanker_trips * TANKER_FEE;
                                        const savings = op.tse_for_irrigation * TSE_SAVING_RATE;
                                        const totalImpact = income + savings;
                                        const efficiencyColor = efficiency >= 95 ? "text-mb-success" : efficiency >= 90 ? "text-mb-warning" : "text-mb-danger";

                                        return (
                                            <tr key={op.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">{format(new Date(op.date), "dd/MM/yyyy")}</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs text-primary font-medium">{op.inlet_sewage.toLocaleString()}</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">{op.tse_for_irrigation.toLocaleString()}</td>
                                                <td className={`py-3.5 px-5 text-right font-mono text-xs font-medium ${efficiencyColor}`}>{efficiency.toFixed(1)}%</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs text-mb-warning">{op.tanker_trips}</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs text-mb-success">{income.toFixed(2)}</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs text-primary">{savings.toFixed(2)}</td>
                                                <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-mb-success">{totalImpact.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    {dailyOperations.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Droplets className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                                    <p className="text-sm font-medium">No STP data for this month</p>
                                                    <p className="text-xs text-slate-400">Select a different month to view operations data.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                </div>
            )}

            {activeTab === "details" && (
                <Card className="h-[calc(100vh-12rem)] min-h-[400px] max-h-[800px] flex flex-col animate-in fade-in duration-200">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Database className="w-6 h-6 text-primary" />
                            <div>
                                <CardTitle>STP Operations Database</CardTitle>
                                <p className="text-sm text-muted-foreground">Detailed logs via Airtable</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <iframe
                            src="https://aitable.ai/share/shripyzrlnlQ91WRSyCLF"
                            className="w-full h-full"
                            style={{ border: 'none' }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allow="fullscreen"
                            title="STP Operations Database"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
