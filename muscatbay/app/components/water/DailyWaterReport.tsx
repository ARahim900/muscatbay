"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getDynamicMonths, findLatestMonthWithData } from "@/lib/water-data";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import { DAILY_WATER_CONSUMPTION_SELECT_COLUMNS, type SupabaseDailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    ChevronLeft, ChevronRight, CalendarDays,
    Clock, Loader2, RefreshCw, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Subcomponents extracted into ./daily-report/ for maintainability.
//     These are the ORIGINAL inline implementations (verbatim) — distinct from
//     the parallel enhanced versions (zone-panel.tsx, dc-panel.tsx,
//     zone-analytics.tsx) which use a different palette and toggleable legend.
import {
    type ReportData, type ReportStatus,
    processReport,
} from "./daily-report/inline-shared";
import { ZoneAnalyticsPanel } from "./daily-report/inline-zone-analytics";
import { ZoneL3Table } from "./daily-report/inline-zone-l3-table";
import { DCAnalyticsPanel, DCDailyTable } from "./daily-report/inline-dc-panel";
import { LoadingState, ErrorState, EmptyState } from "./daily-report/inline-states";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Return yesterday's day-of-month if `month` matches yesterday's calendar month, else 1. */
function getDefaultDay(month: string): number {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = `${MONTH_ABBREVS[yesterday.getMonth()]}-${String(yesterday.getFullYear()).slice(2)}`;
    return month === expected ? yesterday.getDate() : 1;
}

/** Return the month string (e.g. "Mar-26") for yesterday. */
function getDefaultMonth(): string {
    const months = getDynamicMonths();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${MONTH_ABBREVS[yesterday.getMonth()]}-${String(yesterday.getFullYear()).slice(2)}`;
    return months.includes(key) ? key : months[months.length - 1];
}

/** Extract unique years from dynamic months (e.g. ["24","25","26"]). */
function getAvailableYears(): string[] {
    return [...new Set(getDynamicMonths().map(m => m.split('-')[1]))];
}

/** Get months available for a given 2-digit year. */
function getMonthsForYear(year: string): string[] {
    return getDynamicMonths().filter(m => m.endsWith(`-${year}`));
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyWaterReport() {
    // Safe initial state (matches SSR output — last available month, day 1).
    // The real default ("yesterday" from the client's local clock) is applied
    // in a client-only useEffect below, to avoid SSR timezone drift where the
    // server's UTC clock could produce a different "yesterday" than the user's.
    const initialMonths = getDynamicMonths();
    const [selectedMonth, setSelectedMonth] = useState<string>(
        initialMonths[initialMonths.length - 1],
    );
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [defaultsApplied, setDefaultsApplied] = useState(false);
    const [status, setStatus] = useState<ReportStatus>('loading');
    const [monthData, setMonthData] = useState<SupabaseDailyWaterConsumption[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [activeView, setActiveView] = useState<string>(ZONE_BULK_CONFIG[0].zoneName);

    // ── Cheap existence probe: does a month have any rows? (HEAD count, no data)
    const monthHasData = useCallback(async (month: string): Promise<boolean> => {
        const client = getSupabaseClient();
        if (!client) return false;
        const { count, error } = await client
            .from('water_daily_consumption')
            .select('id', { count: 'exact', head: true })
            .eq('month', month);
        if (error) throw new Error(error.message);
        return (count ?? 0) > 0;
    }, []);

    // ── Resolve the default month on client mount ──────────────────────────────
    // `getDynamicMonths()` extends to the current calendar month, so on the first
    // days of a new month "yesterday" points at a month with no rows yet → a
    // scary "Failed to Load" error. Instead, default to the most recent month
    // that actually has data (falling back to the "yesterday" heuristic only if
    // the probe errors). Client-only so `new Date()` uses the user's local time.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            let m: string;
            try {
                const latest = await findLatestMonthWithData(getDynamicMonths(), monthHasData);
                m = latest ?? getDefaultMonth();
            } catch {
                // Probe failed (network/DB) — fall back to the calendar default and
                // let the normal fetch below surface the real error to the user.
                m = getDefaultMonth();
            }
            if (cancelled) return;
            setSelectedMonth(m);
            setSelectedDay(getDefaultDay(m));
            setDefaultsApplied(true);
        })();
        return () => { cancelled = true; };
    }, [monthHasData]);

    // ── Build report from cached month rows for any day (no network call) ──────
    const computeReport = useCallback((rows: SupabaseDailyWaterConsumption[], day: number) => {
        const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
        const readings: Record<string, number | null> = {};
        for (const row of rows) {
            const val = row[dayCol];
            readings[row.account_number] = val != null ? Number(val) : null;
        }
        return processReport(readings);
    }, []);

    // ── Fetch all rows for a month from Supabase ──────────────────────────────
    const fetchMonth = useCallback(async (month: string, silent = false) => {
        if (!silent) {
            setStatus('loading');
            setErrorMsg('');
        }
        try {
            const client = getSupabaseClient();
            if (!client) throw new Error('Supabase is not configured.');

            const { data, error } = await client
                .from('water_daily_consumption')
                .select(DAILY_WATER_CONSUMPTION_SELECT_COLUMNS)
                .eq('month', month);

            if (error) throw new Error(error.message);

            if (!data || data.length === 0) {
                if (!silent) {
                    // Not a failure — the month simply hasn't been uploaded yet.
                    // Clear cached rows/report so the recompute effect can't
                    // resurrect a previous month's data under the empty state.
                    setMonthData([]);
                    setReportData(null);
                    setErrorMsg('');
                    setStatus('empty');
                }
                return;
            }

            setMonthData(data as unknown as SupabaseDailyWaterConsumption[]);
            setLastFetched(new Date());
            if (!silent) setStatus('success');
        } catch (err) {
            if (!silent) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setStatus('error');
            }
        }
    }, []);

    // ── Recompute report whenever cached data OR selected day changes ─────────
    useEffect(() => {
        if (monthData.length === 0) return;
        setReportData(computeReport(monthData, selectedDay));
        setStatus('success');
    }, [monthData, selectedDay, computeReport]);

    // ── Stable slider handler — inline arrow would recreate every render and
    //    cause Radix Slider to call onValueChange in a loop (infinite updates)
    const handleSliderChange = useCallback((v: number[]) => {
        setSelectedDay(v[0]);
    }, []); // setSelectedDay is a stable useState dispatcher — no deps needed

    // ── Auto-fetch when month changes ─────────────────────────────────────────
    // Guarded by `defaultsApplied` so we only fetch once the client-side
    // "yesterday" default has been applied — avoiding a wasted fetch for the
    // SSR placeholder month.
    useEffect(() => {
        if (!defaultsApplied) return;
        setReportData(null);
        fetchMonth(selectedMonth);
    }, [selectedMonth, fetchMonth, defaultsApplied]);

    // ── Supabase real-time subscription ───────────────────────────────────────
    const { isLive } = useSupabaseRealtime({
        table: 'water_daily_consumption',
        channelName: `water-daily-rt-${selectedMonth}`,
        filter: `month=eq.${selectedMonth}`,
        onChanged: () => fetchMonth(selectedMonth, true),
    });

    // ── Controls bar ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 motion-safe:animate-in fade-in duration-200">
            <Card className="card-elevated">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    {/*
                     * Mobile layout: two stacked rows
                     *   row 1 → year/month + refresh + live badge
                     *   row 2 → full-width day slider (with chevrons + label)
                     * sm+ layout: single inline row (via `sm:contents` + `sm:order-*`)
                     *   year/month → slider (flex-1) → refresh → live badge
                     */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">

                        {/* Mobile top-row group (dissolves on sm+) */}
                        <div className="flex flex-wrap items-center gap-2 sm:contents">

                            {/* Year + Month selector */}
                            <div className="flex items-center gap-2 sm:order-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                                <select
                                    aria-label="Year"
                                    value={selectedMonth.split('-')[1]}
                                    onChange={e => {
                                        const yr = e.target.value;
                                        const months = getMonthsForYear(yr);
                                        const currentAbbrev = selectedMonth.split('-')[0];
                                        const match = months.find(m => m.startsWith(currentAbbrev));
                                        const next = match ?? months[months.length - 1];
                                        setSelectedMonth(next);
                                        setSelectedDay(getDefaultDay(next));
                                    }}
                                    disabled={status === 'loading'}
                                    className="px-2 py-1.5 text-sm rounded-md border border-border dark:border-border bg-white/50 dark:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                >
                                    {[...getAvailableYears()].reverse().map(yr => (
                                        <option key={yr} value={yr}>20{yr}</option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Month"
                                    value={selectedMonth}
                                    onChange={e => { const m = e.target.value; setSelectedMonth(m); setSelectedDay(getDefaultDay(m)); }}
                                    disabled={status === 'loading'}
                                    className="px-2 py-1.5 text-sm rounded-md border border-border dark:border-border bg-white/50 dark:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                >
                                    {getMonthsForYear(selectedMonth.split('-')[1]).map(m => (
                                        <option key={m} value={m}>{m.split('-')[0]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Refresh + live badge — right-aligned on mobile, after slider on sm+ */}
                            <div className="flex items-center gap-2 flex-wrap ml-auto sm:ml-0 sm:order-3">
                                <Button
                                    variant="outline" size="icon"
                                    className="h-10 w-10 shrink-0"
                                    onClick={() => fetchMonth(selectedMonth)}
                                    disabled={status === 'loading'}
                                    title="Refresh"
                                >
                                    {status === 'loading'
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <RefreshCw className="h-4 w-4" />
                                    }
                                </Button>

                                {/* Real-time status */}
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                                    isLive
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                                )}>
                                    <Radio className={cn("h-3 w-3", isLive && "motion-safe:animate-pulse")} />
                                    {isLive ? "Live" : "Offline"}
                                </span>

                                {/* Loading indicator */}
                                {status === 'loading' && (
                                    <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                                    </span>
                                )}

                                {/* Last fetched time */}
                                {lastFetched && status !== 'loading' && (
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground dark:text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        Updated {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Day selector — own row on mobile (w-full), flex-1 inline on sm+ */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:flex-1 sm:min-w-[220px] sm:order-2 pt-1 sm:pt-0 border-t border-border/60 dark:border-border/60 sm:border-t-0">
                            <Button
                                variant="outline" size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                                disabled={selectedDay <= 1 || status === 'loading'}
                                aria-label="Previous day"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 min-w-0 sm:max-w-[200px]">
                                <Slider
                                    value={[selectedDay]}
                                    onValueChange={handleSliderChange}
                                    min={1} max={31} step={1}
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <Button
                                variant="outline" size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => setSelectedDay(d => Math.min(31, d + 1))}
                                disabled={selectedDay >= 31 || status === 'loading'}
                                aria-label="Next day"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-base font-medium text-primary min-w-[56px] tabular-nums text-right">
                                Day {selectedDay}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Content ─────────────────────────────────────────────────── */}
            {status === 'loading' && !reportData && <LoadingState />}
            {status === 'error' && <ErrorState message={errorMsg} onRetry={() => fetchMonth(selectedMonth)} />}
            {status === 'empty' && <EmptyState month={selectedMonth} onRetry={() => fetchMonth(selectedMonth)} />}

            {reportData && (
                <>
                    {/* ── Zone / DC Selector ─────────────────────────────── */}
                    <Card className="card-elevated">
                        <CardContent className="p-4 sm:p-5">
                            {/*
                             * Mobile: label on its own line, 2-col grid of equal-width chips
                             *         with generous tap targets.
                             * sm+   : label inline with wrap-flex pills (matches original).
                             */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                                <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground sm:mr-1">
                                    Select Zone
                                </span>
                                <div className="grid grid-cols-2 gap-2 sm:contents">
                                    {ZONE_BULK_CONFIG.map(z => {
                                        const isActive = z.zoneName === activeView;
                                        return (
                                            <button
                                                key={z.zoneName}
                                                onClick={() => setActiveView(z.zoneName)}
                                                className={cn(
                                                    "w-full sm:w-auto px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-design border text-center whitespace-nowrap",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm dark:bg-secondary dark:text-primary-foreground dark:border-secondary"
                                                        : "bg-white text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground/70 dark:border-border hover:bg-muted dark:hover:bg-muted"
                                                )}
                                            >
                                                {z.zoneName}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setActiveView('dc')}
                                        className={cn(
                                            "w-full sm:w-auto col-span-2 sm:col-span-1 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-design border text-center whitespace-nowrap",
                                            activeView === 'dc'
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm dark:bg-secondary dark:text-primary-foreground dark:border-secondary"
                                                : "bg-white text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground/70 dark:border-border hover:bg-muted dark:hover:bg-muted"
                                        )}
                                    >
                                        Direct Connection
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Content based on selection ─────────────────────── */}
                    {activeView === 'dc' ? (
                        <>
                            <DCAnalyticsPanel
                                reportData={reportData}
                                monthData={monthData}
                                selectedDay={selectedDay}
                                month={selectedMonth}
                            />
                            <DCDailyTable monthData={monthData} />
                        </>
                    ) : (
                        <>
                            <ZoneAnalyticsPanel
                                reportData={reportData}
                                monthData={monthData}
                                selectedDay={selectedDay}
                                month={selectedMonth}
                                activeZoneName={activeView}
                            />
                            <ZoneL3Table
                                key={activeView}
                                zoneRow={reportData.zoneRows.find(r => r.zoneName === activeView)!}
                                zoneConfig={ZONE_BULK_CONFIG.find(z => z.zoneName === activeView)!}
                                monthData={monthData}
                                buildingRows={reportData.buildingRows}
                            />
                        </>
                    )}

                </>
            )}
        </div>
    );
}
