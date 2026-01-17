"use client";

import { useEffect, useState, useMemo } from "react";
import { getSTPOperations, STPOperation } from "@/lib/mock-data";
import { getSTPOperationsFromSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { STP_RATES } from "@/lib/config";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    Wifi,
    WifiOff,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { format } from "date-fns";
import { saveFilterPreferences, loadFilterPreferences } from "@/lib/filter-preferences";
import { DateRangePicker } from "@/components/water/date-range-picker";

// Use centralized config for rates
const { TANKER_FEE, TSE_SAVING_RATE } = STP_RATES;

export default function STPPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [allOperations, setAllOperations] = useState<STPOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("");

    // Date range filter state with year selector (matching Electricity section)
    const [selectedYear, setSelectedYear] = useState<string>('All');
    const [startMonth, setStartMonth] = useState<string>('');
    const [endMonth, setEndMonth] = useState<string>('');

    // Daily Operations Log sorting and pagination state
    const [logSortField, setLogSortField] = useState<string>('date');
    const [logSortDirection, setLogSortDirection] = useState<'asc' | 'desc'>('desc');
    const [logCurrentPage, setLogCurrentPage] = useState(1);
    const logPageSize = 15;

    useEffect(() => {
        async function loadData() {
            try {
                if (isSupabaseConfigured()) {
                    const supabaseData = await getSTPOperationsFromSupabase();
                    if (supabaseData.length > 0) {
                        setAllOperations(supabaseData);
                        setIsLiveData(true);
                        setLoading(false);
                        return;
                    }
                }
                const result = await getSTPOperations();
                setAllOperations(result);
                setIsLiveData(false);
            } catch (e) {
                // Silent fallback to mock data
                const result = await getSTPOperations();
                setAllOperations(result);
                setIsLiveData(false);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Load saved filter preferences
        const savedPrefs = loadFilterPreferences<{
            activeTab?: string;
            selectedYear?: string;
            startMonth?: string;
            endMonth?: string;
            selectedMonth?: string;
        }>('stp');
        if (savedPrefs) {
            if (savedPrefs.activeTab) setActiveTab(savedPrefs.activeTab);
            if (savedPrefs.selectedYear) setSelectedYear(savedPrefs.selectedYear);
            if (savedPrefs.startMonth) setStartMonth(savedPrefs.startMonth);
            if (savedPrefs.endMonth) setEndMonth(savedPrefs.endMonth);
            if (savedPrefs.selectedMonth) setSelectedMonth(savedPrefs.selectedMonth);
        }
    }, []);

    // Save filter preferences when they change
    useEffect(() => {
        saveFilterPreferences('stp', {
            activeTab,
            selectedYear,
            startMonth,
            endMonth,
            selectedMonth
        });
    }, [activeTab, selectedYear, startMonth, endMonth, selectedMonth]);

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

    // Get available years from data
    const availableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        allOperations.forEach(op => {
            yearsSet.add(format(new Date(op.date), "yyyy"));
        });
        return ['All', ...Array.from(yearsSet).sort()];
    }, [allOperations]);

    // Filter months by selected year
    const filteredMonthsByYear = useMemo(() => {
        if (selectedYear === 'All') return allMonths;
        return allMonths.filter(m => {
            const [, y] = m.split('-');
            return '20' + y === selectedYear;
        });
    }, [allMonths, selectedYear]);

    // Initialize start and end months when data loads
    useEffect(() => {
        if (allMonths.length > 0 && !startMonth && !endMonth) {
            setStartMonth(allMonths[0]);
            setEndMonth(allMonths[allMonths.length - 1]);
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

    // Set default month for daily log once operations load
    useEffect(() => {
        if (operations.length > 0 && !selectedMonth) {
            const latestDate = operations[operations.length - 1]?.date;
            if (latestDate) {
                setSelectedMonth(format(new Date(latestDate), "yyyy-MM"));
            }
        }
    }, [operations, selectedMonth]);

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

    // Calculate statistics from filtered operations with trends
    const stats = useMemo(() => {
        const totalInlet = operations.reduce((sum, op) => sum + op.inlet_sewage, 0);
        const totalTSE = operations.reduce((sum, op) => sum + op.tse_for_irrigation, 0);
        const totalTrips = operations.reduce((sum, op) => sum + op.tanker_trips, 0);
        const generatedIncome = totalTrips * TANKER_FEE;
        const waterSavings = totalTSE * TSE_SAVING_RATE;
        const totalEconomicImpact = generatedIncome + waterSavings;
        const treatmentEfficiency = totalInlet > 0 ? (totalTSE / totalInlet) * 100 : 0;
        const dailyAverageInlet = operations.length > 0 ? totalInlet / operations.length : 0;

        // Calculate previous period data for trends
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);
        const rangeLength = endIdx >= startIdx ? endIdx - startIdx + 1 : 1;
        const prevEndIdx = startIdx > 0 ? startIdx - 1 : -1;
        const prevStartIdx = prevEndIdx >= 0 ? Math.max(0, prevEndIdx - rangeLength + 1) : -1;

        let prevInlet = 0, prevTSE = 0, prevTrips = 0, prevOperationsCount = 0;
        if (prevStartIdx >= 0 && prevEndIdx >= 0 && allMonths.length > 0) {
            const prevRangeMonths = allMonths.slice(prevStartIdx, prevEndIdx + 1);
            const prevOps = allOperations.filter(op => {
                const opMonth = format(new Date(op.date), "MMM-yy");
                return prevRangeMonths.includes(opMonth);
            });
            prevInlet = prevOps.reduce((sum, op) => sum + op.inlet_sewage, 0);
            prevTSE = prevOps.reduce((sum, op) => sum + op.tse_for_irrigation, 0);
            prevTrips = prevOps.reduce((sum, op) => sum + op.tanker_trips, 0);
            prevOperationsCount = prevOps.length;
        }

        const prevIncome = prevTrips * TANKER_FEE;
        const prevSavings = prevTSE * TSE_SAVING_RATE;
        const prevEconomicImpact = prevIncome + prevSavings;
        const prevEfficiency = prevInlet > 0 ? (prevTSE / prevInlet) * 100 : 0;
        const prevDailyAvg = prevOperationsCount > 0 ? prevInlet / prevOperationsCount : 0;

        const inletTrend = calcTrend(totalInlet, prevInlet);
        const tseTrend = calcTrend(totalTSE, prevTSE);
        const tripsTrend = calcTrend(totalTrips, prevTrips);
        const incomeTrend = calcTrend(generatedIncome, prevIncome);
        const savingsTrend = calcTrend(waterSavings, prevSavings);
        const economicTrend = calcTrend(totalEconomicImpact, prevEconomicImpact);
        const efficiencyTrend = calcTrend(treatmentEfficiency, prevEfficiency);
        const dailyAvgTrend = calcTrend(dailyAverageInlet, prevDailyAvg);

        return [
            {
                label: "Inlet Sewage",
                value: `${totalInlet.toLocaleString('en-US')} m³`,
                subtitle: `Range: ${selectedDateRange.start} - ${selectedDateRange.end}`,
                icon: Droplets,
                variant: "primary" as const,
                trend: inletTrend.trend,
                trendValue: inletTrend.trendValue
            },
            {
                label: "TSE for Irrigation",
                value: `${totalTSE.toLocaleString('en-US')} m³`,
                subtitle: "Recycled Water Output",
                icon: Recycle,
                variant: "secondary" as const,
                trend: tseTrend.trend,
                trendValue: tseTrend.trendValue
            },
            {
                label: "Tanker Trips",
                value: `${totalTrips.toLocaleString('en-US')}`,
                subtitle: `at ${TANKER_FEE} OMR / trip`,
                icon: Truck,
                variant: "warning" as const,
                trend: tripsTrend.trend,
                trendValue: tripsTrend.trendValue
            },
            {
                label: "Generated Income",
                value: `${generatedIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: "from discharge fees",
                icon: DollarSign,
                variant: "success" as const,
                trend: incomeTrend.trend,
                trendValue: incomeTrend.trendValue
            },
            {
                label: "Water Savings",
                value: `${waterSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: `${TSE_SAVING_RATE} OMR per m³`,
                icon: PiggyBank,
                variant: "primary" as const,
                trend: savingsTrend.trend,
                trendValue: savingsTrend.trendValue
            },
            {
                label: "Total Economic Impact",
                value: `${totalEconomicImpact.toLocaleString('en-US', { minimumFractionDigits: 2 })} OMR`,
                subtitle: "Income + Savings",
                icon: TrendingUp,
                variant: "success" as const,
                trend: economicTrend.trend,
                trendValue: economicTrend.trendValue
            },
            {
                label: "Treatment Efficiency",
                value: `${treatmentEfficiency.toFixed(1)}%`,
                subtitle: "TSE Output to Inlet Ratio",
                icon: Gauge,
                variant: "secondary" as const,
                trend: efficiencyTrend.trend,
                trendValue: efficiencyTrend.trendValue
            },
            {
                label: "Daily Average Inlet",
                value: `${Math.round(dailyAverageInlet).toLocaleString('en-US')} m³`,
                subtitle: "Average Daily Input",
                icon: Activity,
                variant: "primary" as const,
                trend: dailyAvgTrend.trend,
                trendValue: dailyAvgTrend.trendValue
            }
        ];
    }, [operations, selectedDateRange, allMonths, allOperations, startMonth, endMonth]);

    // Monthly chart data from filtered operations
    const monthlyChartData = useMemo(() => {
        const monthly: Record<string, { month: string; inlet: number; tse: number; income: number; savings: number; trips: number }> = {};

        operations.forEach(op => {
            const monthKey = format(new Date(op.date), "MMM-yy");
            if (!monthly[monthKey]) {
                monthly[monthKey] = { month: monthKey, inlet: 0, tse: 0, income: 0, savings: 0, trips: 0 };
            }
            monthly[monthKey].inlet += op.inlet_sewage;
            monthly[monthKey].tse += op.tse_for_irrigation;
            monthly[monthKey].income += (op.tanker_trips * TANKER_FEE);
            monthly[monthKey].savings += (op.tse_for_irrigation * TSE_SAVING_RATE);
            monthly[monthKey].trips += op.tanker_trips;
        });

        return Object.values(monthly);
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
    }, [operations, selectedMonth, logSortField, logSortDirection]);

    // Paginated daily operations
    const paginatedDailyOperations = useMemo(() => {
        const startIndex = (logCurrentPage - 1) * logPageSize;
        return dailyOperations.slice(startIndex, startIndex + logPageSize);
    }, [dailyOperations, logCurrentPage, logPageSize]);

    const logTotalPages = Math.ceil(dailyOperations.length / logPageSize);

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

    // Range change handler for DateRangePicker
    const handleRangeChange = (start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    };

    // Reset date range to full
    const handleResetRange = () => {
        if (filteredMonthsByYear.length > 0) {
            setStartMonth(filteredMonthsByYear[0]);
            setEndMonth(filteredMonthsByYear[filteredMonthsByYear.length - 1]);
        } else if (allMonths.length > 0) {
            setStartMonth(allMonths[0]);
            setEndMonth(allMonths[allMonths.length - 1]);
        }
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
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-white" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                        {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isLiveData ? "Live Data Connected" : "Demo Mode"}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "dashboard"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                >
                    <Activity className="w-4 h-4 inline-block mr-2" />
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveTab("details")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "details"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                >
                    <Database className="w-4 h-4 inline-block mr-2" />
                    Details Data
                </button>
            </div>

            {activeTab === "dashboard" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Date Range Filter Card with Year Selector */}
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
                                                        className={`rounded-full px-4 ${selectedYear === year ? "bg-[#4E4456] hover:bg-[#4E4456]/90 text-white" : "border-slate-200 dark:border-slate-700"}`}
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

                    {/* Unified Stats Grid */}
                    <StatsGrid stats={stats} />

                    {/* Monthly Water Treatment Volumes Chart */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <CardTitle className="text-lg">Monthly Water Treatment Volumes (m³)</CardTitle>
                            <p className="text-sm text-muted-foreground">Sewage Inlet vs TSE Output comparison</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradInlet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4E4456" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#4E4456" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradTSE" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                                        <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                        <Legend iconType="circle" />
                                        <Area type="monotone" dataKey="inlet" name="Sewage Inlet" stroke="#4E4456" fill="url(#gradInlet)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                        <Area type="monotone" dataKey="tse" name="TSE Output" stroke="#81D8D0" fill="url(#gradTSE)" strokeWidth={3} animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Two Charts Side by Side */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Monthly Economic Impact */}
                        <Card className="glass-card h-full">
                            <CardHeader className="glass-card-header">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-mb-success" />
                                    Monthly Economic Impact (OMR)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: 'OMR', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Bar dataKey="income" name="Income" fill="#5BA88B" radius={[6, 6, 0, 0]} animationDuration={1500} />
                                            <Bar dataKey="savings" name="Savings" fill="#4E4456" radius={[6, 6, 0, 0]} animationDuration={1500} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Monthly Tanker Operations */}
                        <Card className="glass-card h-full">
                            <CardHeader className="glass-card-header">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-mb-warning" />
                                    Monthly Tanker Operations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: 'trips', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                            <Line
                                                type="monotone"
                                                dataKey="trips"
                                                name="Tanker Trips"
                                                stroke="#E8A838"
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: "#E8A838", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Operations Log */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <CardTitle className="text-lg">Daily Operations Log</CardTitle>
                                    <p className="text-sm text-muted-foreground">Detailed daily STP operation records</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Select Month for Daily View</span>
                                    <Select value={selectedMonth} onValueChange={(value) => value && setSelectedMonth(value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMonths.map(month => (
                                                <SelectItem key={month} value={month}>
                                                    {format(new Date(`${month}-01`), "MMMM yyyy")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-mb-primary/10 bg-mb-primary/5">
                                            <th className="text-left p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('date')}>
                                                <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('inlet')}>
                                                <div className="flex items-center justify-end gap-1">Inlet (m³) <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('tse')}>
                                                <div className="flex items-center justify-end gap-1">TSE Output (m³) <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('efficiency')}>
                                                <div className="flex items-center justify-end gap-1">Efficiency % <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('trips')}>
                                                <div className="flex items-center justify-end gap-1">Tanker Trips <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('income')}>
                                                <div className="flex items-center justify-end gap-1">Income (OMR) <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('savings')}>
                                                <div className="flex items-center justify-end gap-1">Savings (OMR) <ArrowUpDown className="w-3 h-3" /></div>
                                            </th>
                                            <th className="text-right p-3 font-medium text-mb-primary cursor-pointer hover:bg-mb-primary/10" onClick={() => handleLogSort('total')}>
                                                <div className="flex items-center justify-end gap-1">Total Impact (OMR) <ArrowUpDown className="w-3 h-3" /></div>
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
                                                <tr key={op.id} className={`border-b border-mb-primary/5 hover:bg-mb-primary/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-mb-primary/5'}`}>
                                                    <td className="p-3 text-muted-foreground">{format(new Date(op.date), "dd/MM/yyyy")}</td>
                                                    <td className="p-3 text-right text-mb-primary font-medium">{op.inlet_sewage.toLocaleString()}</td>
                                                    <td className="p-3 text-right text-mb-secondary-active font-medium">{op.tse_for_irrigation.toLocaleString()}</td>
                                                    <td className={`p-3 text-right font-medium ${efficiencyColor}`}>{efficiency.toFixed(1)}%</td>
                                                    <td className="p-3 text-right text-mb-warning">{op.tanker_trips}</td>
                                                    <td className="p-3 text-right text-mb-success">{income.toFixed(2)}</td>
                                                    <td className="p-3 text-right text-mb-primary">{savings.toFixed(2)}</td>
                                                    <td className="p-3 text-right font-semibold text-mb-success">{totalImpact.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {dailyOperations.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No data available for the selected month
                                </div>
                            )}
                            {/* Pagination Controls */}
                            {dailyOperations.length > 0 && logTotalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 px-2">
                                    <span className="text-sm text-muted-foreground">
                                        Showing {(logCurrentPage - 1) * logPageSize + 1} - {Math.min(logCurrentPage * logPageSize, dailyOperations.length)} of {dailyOperations.length}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLogCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={logCurrentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            Page {logCurrentPage} of {logTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLogCurrentPage(prev => Math.min(logTotalPages, prev + 1))}
                                            disabled={logCurrentPage === logTotalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "details" && (
                <Card className="h-[800px] animate-in fade-in duration-500">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Database className="w-6 h-6 text-primary" />
                            <div>
                                <CardTitle>STP Operations Database</CardTitle>
                                <p className="text-sm text-muted-foreground">Detailed logs via Airtable</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-full p-0 overflow-hidden">
                        <iframe
                            src="https://aitable.ai/share/shrdXgjQnQar66QJXXADh"
                            className="w-full h-full border-none"
                            title="STP Operations Database"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
