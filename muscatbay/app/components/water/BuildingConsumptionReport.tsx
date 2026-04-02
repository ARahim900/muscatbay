"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getDynamicMonths } from "@/lib/water-data";
import {
    BUILDING_CONFIG, BUILDING_CHILD_METERS,
    type BuildingConfig, type ChildMeterInfo,
} from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    CalendarDays, Building2, Search, ArrowUpDown, Clock, Loader2,
    RefreshCw, WifiOff, Radio, Home, Users, Filter, TrendingDown,
    BarChart3, Droplets, Activity, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDefaultMonth(): string {
    const months = getDynamicMonths();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${MONTH_ABBREVS[yesterday.getMonth()]}-${String(yesterday.getFullYear()).slice(2)}`;
    return months.includes(key) ? key : months[months.length - 1];
}

function getAvailableYears(): string[] {
    return [...new Set(getDynamicMonths().map(m => m.split('-')[1]))];
}

function getMonthsForYear(year: string): string[] {
    return getDynamicMonths().filter(m => m.endsWith(`-${year}`));
}

function getDefaultDay(month: string): number {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = `${MONTH_ABBREVS[yesterday.getMonth()]}-${String(yesterday.getFullYear()).slice(2)}`;
    return month === expected ? yesterday.getDate() : 1;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChildMeterReading {
    label: string;
    account: string;
    type: 'Apartment' | 'Common';
    value: number | null;
}

interface BuildingRow {
    buildingName: string;
    zone: '3A' | '3B';
    bulkAccount: string;
    l3Bulk: number | null;
    l4Sum: number;
    commonSum: number;
    aptSum: number;
    diff: number | null;
    diffPercent: number | null;
    hasNonZeroDiff: boolean;
    childMeters: ChildMeterReading[];
}

type ReportStatus = 'loading' | 'success' | 'error';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const r2 = (v: number) => Math.round(v * 100) / 100;

function n(v: number | null, fallback = '—'): string {
    if (v === null) return fallback;
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diffCell(diff: number | null): string {
    if (diff === null) return '—';
    if (diff === 0) return '0.00';
    const formatted = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (diff > 0 ? '+' : '-') + formatted;
}

function processBuildingData(readings: Record<string, number | null>): BuildingRow[] {
    const get = (acc: string): number | null =>
        acc in readings ? readings[acc] : null;

    return BUILDING_CONFIG.map(b => {
        const l3Bulk = get(b.bulkAccount);
        const childInfo = BUILDING_CHILD_METERS[b.buildingName] ?? [];

        const childMeters: ChildMeterReading[] = childInfo.map(cm => ({
            label: cm.label,
            account: cm.account,
            type: cm.type,
            value: get(cm.account),
        }));

        const commonMeters = childMeters.filter(c => c.type === 'Common');
        const aptMeters = childMeters.filter(c => c.type === 'Apartment');

        const commonSum = r2(commonMeters.reduce((s, c) => s + (c.value ?? 0), 0));
        const aptSum = r2(aptMeters.reduce((s, c) => s + (c.value ?? 0), 0));
        const l4Sum = r2(commonSum + aptSum);
        const diff = l3Bulk !== null ? r2(l3Bulk - l4Sum) : null;
        const diffPercent = l3Bulk !== null && l3Bulk > 0 ? r2((diff! / l3Bulk) * 100) : null;

        return {
            buildingName: b.buildingName,
            zone: b.zone,
            bulkAccount: b.bulkAccount,
            l3Bulk: l3Bulk !== null ? r2(l3Bulk) : null,
            l4Sum,
            commonSum,
            aptSum,
            diff,
            diffPercent,
            hasNonZeroDiff: diff !== null && Math.abs(diff) >= 0.01,
            childMeters,
        };
    });
}

// ─── Styled primitives ──────────────────────────────────────────────────────

const thBase = "h-11 px-4 text-left align-middle font-semibold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap";
const tdBase = "px-4 py-3 align-middle text-[13px] text-slate-700 dark:text-slate-300";

type SortDir = 'asc' | 'desc' | null;
interface SortState { key: string; dir: SortDir }

function nextSort(current: SortState, key: string): SortState {
    if (current.key !== key) return { key, dir: 'asc' };
    if (current.dir === 'asc') return { key, dir: 'desc' };
    return { key: '', dir: null };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active || !dir) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return dir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 text-secondary" />
        : <ChevronDown className="h-3.5 w-3.5 text-secondary" />;
}

function Th({
    children, sortKey, sort, onSort, className,
}: {
    children: React.ReactNode; sortKey?: string; sort?: SortState;
    onSort?: (s: SortState) => void; className?: string;
}) {
    const sortable = sortKey && sort && onSort;
    return (
        <th
            className={cn(thBase, sortable && "cursor-pointer select-none group hover:text-slate-600 dark:hover:text-slate-300 transition-colors", className)}
            onClick={sortable ? () => onSort(nextSort(sort, sortKey)) : undefined}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                {sortable && <SortIcon active={sort.key === sortKey} dir={sort.key === sortKey ? sort.dir : null} />}
            </span>
        </th>
    );
}

function StatusChip({ label, color }: { label: string; color: 'success' | 'danger' | 'warning' | 'default' | 'primary' }) {
    const styles = {
        success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        danger: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
        warning: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        default: 'bg-slate-100 text-slate-500 ring-slate-500/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20',
        primary: 'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    }[color];
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset", styles)}>
            {label}
        </span>
    );
}

function NullBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
            <AlertTriangle className="h-3 w-3" /> NULL
        </span>
    );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
// Follows StatsGrid pattern exactly — brand hex colors via inline style,
// neutral gray icon bg, design-system shadows & transitions.

/** Muscat Bay design-system hex values — exact palette */
const KPI_COLORS = {
    primary:  '#4e4456',   // --primary / --sidebar (dark purple)
    brand:    '#5f5168',   // --mb-primary (muted purple)
    accent:   '#00d2b3',   // --secondary / --accent (teal)
    success:  '#10b981',   // --chart-4 (green)
    warning:  '#e8a838',   // --chart-3 (amber)
    danger:   '#ef4444',   // --destructive (red)
    blue:     '#3b7ed2',   // --chart-1 (blue)
} as const;

type KpiVariant = keyof typeof KPI_COLORS;

function KpiCard({ label, value, sub, variant, icon }: {
    label: string; value: string; sub?: string;
    variant: KpiVariant;
    icon: React.ReactNode;
}) {
    const hex = KPI_COLORS[variant];

    return (
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 ease-out group/stat overflow-hidden relative">
            {/* Animated top border */}
            <div
                className="absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: hex }}
            />
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 uppercase tracking-wide truncate">
                        {label}
                    </p>
                    <h3
                        className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate"
                        style={{ color: hex }}
                    >
                        {value}
                    </h3>
                    {sub && (
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 truncate">{sub}</p>
                    )}
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-slate-800/80 group-hover/stat:scale-110 group-hover/stat:-rotate-3 group-hover/stat:shadow-sm transition-all duration-200 ease-out flex-shrink-0">
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function TablePagination({
    page, totalPages, totalItems, onPageChange, rowsPerPage, onRowsPerPageChange,
}: {
    page: number; totalPages: number; totalItems: number;
    onPageChange: (p: number) => void; rowsPerPage: number; onRowsPerPageChange: (n: number) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
            <span className="text-[12px] text-slate-400 dark:text-slate-500 tabular-nums">
                {totalItems} building{totalItems !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
                <button
                    className="h-8 px-3 text-[12px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all",
                            p === page
                                ? "bg-primary text-white shadow-sm dark:bg-secondary dark:text-slate-900"
                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className="h-8 px-3 text-[12px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
                Rows
                <select
                    value={rowsPerPage}
                    onChange={e => onRowsPerPageChange(Number(e.target.value))}
                    className="h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-transparent text-[12px] px-2 focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer"
                >
                    {[5, 10, 15, 21].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
        </div>
    );
}

// ─── Loading / Error states ──────────────────────────────────────────────────

function LoadingState() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="card-elevated overflow-hidden">
                    <div className="p-5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="h-9 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <WifiOff className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Failed to Load Data
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                {message}
            </p>
            <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
            </Button>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BuildingConsumptionReport() {
    const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
    const [selectedDay, setSelectedDay] = useState(() => getDefaultDay(getDefaultMonth()));
    const [status, setStatus] = useState<ReportStatus>('loading');
    const [monthData, setMonthData] = useState<SupabaseDailyWaterConsumption[]>([]);
    const [buildingRows, setBuildingRows] = useState<BuildingRow[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    // Table state
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState<'all' | '3A' | '3B'>('all');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(21);

    // ── Compute building rows from cached data ───────────────────────────────
    const computeRows = useCallback((rows: SupabaseDailyWaterConsumption[], day: number) => {
        const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
        const readings: Record<string, number | null> = {};
        for (const row of rows) {
            const val = row[dayCol];
            readings[row.account_number] = val != null ? Number(val) : null;
        }
        return processBuildingData(readings);
    }, []);

    // ── Fetch month data ─────────────────────────────────────────────────────
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
                .select('*')
                .eq('month', month);

            if (error) throw new Error(error.message);

            if (!data || data.length === 0) {
                if (!silent) {
                    setErrorMsg(`No data found for ${month}. This month may not have been loaded yet.`);
                    setStatus('error');
                }
                return;
            }

            setMonthData(data as SupabaseDailyWaterConsumption[]);
            setLastFetched(new Date());
            if (!silent) setStatus('success');
        } catch (err) {
            if (!silent) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setStatus('error');
            }
        }
    }, []);

    // ── Recompute when data or day changes ───────────────────────────────────
    useEffect(() => {
        if (monthData.length === 0) return;
        setBuildingRows(computeRows(monthData, selectedDay));
        setStatus('success');
    }, [monthData, selectedDay, computeRows]);

    const handleSliderChange = useCallback((v: number[]) => {
        setSelectedDay(v[0]);
    }, []);

    // ── Auto-fetch on month change ───────────────────────────────────────────
    useEffect(() => {
        setBuildingRows([]);
        fetchMonth(selectedMonth);
    }, [selectedMonth, fetchMonth]);

    // ── Real-time ────────────────────────────────────────────────────────────
    const { isLive } = useSupabaseRealtime({
        table: 'water_daily_consumption',
        channelName: `water-building-rt-${selectedMonth}`,
        filter: `month=eq.${selectedMonth}`,
        onChanged: () => fetchMonth(selectedMonth, true),
    });

    // ── Reset page on filter change ──────────────────────────────────────────
    useEffect(() => { setPage(1); }, [search, zoneFilter, sort]);

    // ── Filtered + sorted rows ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        let result = [...buildingRows];
        if (zoneFilter !== 'all') result = result.filter(r => r.zone === zoneFilter);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.buildingName.toLowerCase().includes(q) || r.bulkAccount.includes(q),
            );
        }
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'building') { va = a.buildingName; vb = b.buildingName; }
                else if (sort.key === 'bulk') { va = a.l3Bulk ?? -1; vb = b.l3Bulk ?? -1; }
                else if (sort.key === 'individual') { va = a.l4Sum; vb = b.l4Sum; }
                else if (sort.key === 'common') { va = a.commonSum; vb = b.commonSum; }
                else if (sort.key === 'apt') { va = a.aptSum; vb = b.aptSum; }
                else if (sort.key === 'diffPct') { va = a.diffPercent ?? 0; vb = b.diffPercent ?? 0; }
                else { va = a.diff ?? 0; vb = b.diff ?? 0; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [buildingRows, search, zoneFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginatedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // ── Summary KPIs ─────────────────────────────────────────────────────────
    const summary = useMemo(() => {
        const totalBulk = r2(buildingRows.reduce((s, r) => s + (r.l3Bulk ?? 0), 0));
        const totalIndividual = r2(buildingRows.reduce((s, r) => s + r.l4Sum, 0));
        const totalDiff = r2(totalBulk - totalIndividual);
        const totalDiffPct = totalBulk > 0 ? r2((totalDiff / totalBulk) * 100) : 0;
        const highLossCount = buildingRows.filter(r => r.diff !== null && Math.abs(r.diff) > 1).length;
        const nullCount = buildingRows.filter(r => r.l3Bulk === null).length;
        return { totalBulk, totalIndividual, totalDiff, totalDiffPct, highLossCount, nullCount };
    }, [buildingRows]);

    const z3ACount = buildingRows.filter(r => r.zone === '3A').length;
    const z3BCount = buildingRows.filter(r => r.zone === '3B').length;

    // ── Toggle helpers ───────────────────────────────────────────────────────
    const toggleBuilding = (name: string) => {
        setExpandedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };
    const expandAll = () => setExpandedBuildings(new Set(filtered.map(r => r.buildingName)));
    const collapseAll = () => setExpandedBuildings(new Set());

    // ── Render expanded child row ────────────────────────────────────────────
    function renderChildRow(row: BuildingRow) {
        const childCount = row.childMeters.length;
        return (
            <tr key={`${row.buildingName}-children`} className="bg-slate-50/40 dark:bg-slate-800/20">
                <td colSpan={9} className="py-0 px-0">
                    <div className="border-l-[3px] border-secondary/40 dark:border-secondary/30 ml-5 sm:ml-7">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                    <th className="text-left py-2 px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 w-[35%]">Meter</th>
                                    <th className="text-left py-2 px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Account</th>
                                    <th className="text-center py-2 px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Type</th>
                                    <th className="text-right py-2 px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Reading (m³)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {row.childMeters.map(cm => {
                                    const val = cm.value !== null ? r2(cm.value) : null;
                                    return (
                                        <tr
                                            key={cm.account}
                                            className={cn(
                                                "border-b border-slate-50 dark:border-slate-800/40 transition-colors hover:bg-white/60 dark:hover:bg-slate-800/30",
                                                cm.type === 'Common' && "bg-indigo-50/30 dark:bg-indigo-900/5",
                                            )}
                                        >
                                            <td className="py-2 px-4 text-[12px] font-medium text-slate-700 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1.5">
                                                    {cm.type === 'Common'
                                                        ? <Users className="h-3 w-3 text-indigo-500 shrink-0" />
                                                        : <Home className="h-3 w-3 text-slate-400 shrink-0" />
                                                    }
                                                    {cm.label}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 font-mono text-[11px] text-slate-400 dark:text-slate-500">{cm.account}</td>
                                            <td className="py-2 px-4 text-center">
                                                <StatusChip label={cm.type} color={cm.type === 'Common' ? 'primary' : 'default'} />
                                            </td>
                                            <td className="py-2 px-4 text-right font-mono text-[12px] font-medium tabular-nums text-slate-700 dark:text-slate-300">
                                                {val === null ? '—' : val === 0 ? <span className="text-slate-400">0.00</span> : n(val)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="border-t-2 border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                                    <td className="py-2 px-4 text-[12px] font-bold text-slate-600 dark:text-slate-300" colSpan={3}>
                                        Sum of {childCount} meters (Common: {n(row.commonSum)} + Apt: {n(row.aptSum)})
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-[12px] font-bold tabular-nums">{n(row.l4Sum)}</td>
                                </tr>
                                <tr className={cn(
                                    "border-t border-dashed border-slate-200 dark:border-slate-700",
                                    row.hasNonZeroDiff ? "bg-amber-50/50 dark:bg-amber-900/5" : "bg-emerald-50/30 dark:bg-emerald-900/5",
                                )}>
                                    <td className="py-2 px-4 text-[12px] font-bold" colSpan={3}>
                                        Bulk ({n(row.l3Bulk)}) − Individual ({n(row.l4Sum)}) = Difference
                                    </td>
                                    <td className={cn("py-2 px-4 text-right font-mono text-[12px] font-bold tabular-nums",
                                        row.hasNonZeroDiff ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
                                    )}>
                                        {row.diff !== null ? diffCell(row.diff) : '—'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* ── Controls bar ──────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Year + Month selector */}
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <select
                                value={selectedMonth.split('-')[1]}
                                onChange={e => {
                                    const yr = e.target.value;
                                    const months = getMonthsForYear(yr);
                                    const currentAbbrev = selectedMonth.split('-')[0];
                                    const match = months.find(m => m.startsWith(currentAbbrev));
                                    const next = match ?? months[months.length - 1];
                                    setSelectedMonth(next);
                                    setSelectedDay(1);
                                }}
                                disabled={status === 'loading'}
                                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            >
                                {[...getAvailableYears()].reverse().map(yr => (
                                    <option key={yr} value={yr}>20{yr}</option>
                                ))}
                            </select>
                            <select
                                value={selectedMonth}
                                onChange={e => { setSelectedMonth(e.target.value); setSelectedDay(1); }}
                                disabled={status === 'loading'}
                                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            >
                                {getMonthsForYear(selectedMonth.split('-')[1]).map(m => (
                                    <option key={m} value={m}>{m.split('-')[0]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Day selector */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 sm:min-w-[220px]">
                            <Button
                                variant="outline" size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                                disabled={selectedDay <= 1 || status === 'loading'}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 max-w-[200px]">
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
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-base font-bold text-primary min-w-[56px] tabular-nums">
                                Day {selectedDay}
                            </span>
                        </div>

                        {/* Refresh */}
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

                        {/* Live badge + last fetched */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                                isLive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                <Radio className={cn("h-3 w-3", isLive && "animate-pulse")} />
                                {isLive ? "Live" : "Offline"}
                            </span>

                            {status === 'loading' && (
                                <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                                </span>
                            )}

                            {lastFetched && status !== 'loading' && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    Updated {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── States ───────────────────────────────────────────────── */}
            {status === 'loading' && buildingRows.length === 0 && <LoadingState />}
            {status === 'error' && <ErrorState message={errorMsg} onRetry={() => fetchMonth(selectedMonth)} />}

            {buildingRows.length > 0 && (
                <>
                    {/* ── KPI Cards ────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                        <KpiCard
                            label="Buildings"
                            value={`${buildingRows.length}`}
                            sub={`Zone 3A: ${z3ACount} · Zone 3B: ${z3BCount}`}
                            variant="brand"
                            icon={<Building2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: KPI_COLORS.brand }} />}
                        />
                        <KpiCard
                            label="Total Bulk (L3)"
                            value={`${n(summary.totalBulk)} m³`}
                            sub="Sum of all building bulk meters"
                            variant="blue"
                            icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: KPI_COLORS.blue }} />}
                        />
                        <KpiCard
                            label="Total Individual (L4)"
                            value={`${n(summary.totalIndividual)} m³`}
                            sub="Common + Apartment meters"
                            variant="accent"
                            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: KPI_COLORS.accent }} />}
                        />
                        <KpiCard
                            label="Total Difference"
                            value={diffCell(summary.totalDiff)}
                            sub={`${summary.totalDiffPct}% of bulk`}
                            variant={Math.abs(summary.totalDiff) > 5 ? 'danger' : 'success'}
                            icon={<ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: Math.abs(summary.totalDiff) > 5 ? KPI_COLORS.danger : KPI_COLORS.success }} />}
                        />
                        <KpiCard
                            label="Flagged"
                            value={`${summary.highLossCount}`}
                            sub={`${summary.nullCount} NULL reading${summary.nullCount !== 1 ? 's' : ''}`}
                            variant={summary.highLossCount > 0 ? 'danger' : 'success'}
                            icon={<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: summary.highLossCount > 0 ? KPI_COLORS.danger : KPI_COLORS.success }} />}
                        />
                    </div>

                    {/* ── Buildings Table ───────────────────────────────────── */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl shadow-sm bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/10">
                                        <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] sm:text-[17px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                                            D-Building Consumption
                                        </h3>
                                        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                                            Bulk meter vs sum of individual meters (Common + Apartments) per building
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={expandAll} className="h-8 px-3 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        Expand All
                                    </button>
                                    <button onClick={collapseAll} className="h-8 px-3 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        Collapse All
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search building or account…"
                                        className="h-9 w-full sm:w-64 pl-9 pr-8 text-[13px] rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                                            <span className="text-[10px] leading-none font-bold">&times;</span>
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                    <select
                                        value={zoneFilter}
                                        onChange={e => setZoneFilter(e.target.value as typeof zoneFilter)}
                                        className="h-9 text-[13px] rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all appearance-none cursor-pointer pr-8 pl-9"
                                    >
                                        <option value="all">All Zones ({buildingRows.length})</option>
                                        <option value="3A">Zone 3A ({z3ACount})</option>
                                        <option value="3B">Zone 3B ({z3BCount})</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-t border-b border-slate-100 dark:border-slate-800">
                                        <Th sortKey="building" sort={sort} onSort={setSort} className="min-w-[130px]">Building</Th>
                                        <th className={cn(thBase)}>Bulk Acct</th>
                                        <th className={cn(thBase, "text-center")}>Zone</th>
                                        <Th sortKey="bulk" sort={sort} onSort={setSort} className="text-right">Bulk (m³)</Th>
                                        <Th sortKey="common" sort={sort} onSort={setSort} className="text-right">Common (m³)</Th>
                                        <Th sortKey="apt" sort={sort} onSort={setSort} className="text-right">Apt (m³)</Th>
                                        <Th sortKey="individual" sort={sort} onSort={setSort} className="text-right">Total Indv (m³)</Th>
                                        <Th sortKey="diff" sort={sort} onSort={setSort} className="text-right">Diff (m³)</Th>
                                        <Th sortKey="diffPct" sort={sort} onSort={setSort} className="text-right min-w-[80px]">Diff %</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                                No buildings found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedRows.flatMap(row => {
                                            const isExpanded = expandedBuildings.has(row.buildingName);
                                            const aptCount = row.childMeters.filter(c => c.type === 'Apartment').length;
                                            const rows = [];

                                            rows.push(
                                                <tr
                                                    key={row.buildingName}
                                                    className={cn(
                                                        "border-b border-slate-50 dark:border-slate-800/60 cursor-pointer select-none transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
                                                        isExpanded && "bg-violet-50/30 dark:bg-violet-900/10",
                                                    )}
                                                    onClick={() => toggleBuilding(row.buildingName)}
                                                >
                                                    <td className={cn(tdBase, "font-semibold")}>
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className={cn(
                                                                "flex items-center justify-center h-5 w-5 rounded-md transition-all duration-200",
                                                                isExpanded ? "bg-primary dark:bg-secondary" : "bg-slate-200 dark:bg-slate-700",
                                                            )}>
                                                                <ChevronDown className={cn(
                                                                    "h-3 w-3 transition-transform duration-200",
                                                                    isExpanded ? "rotate-0 text-white dark:text-slate-900" : "-rotate-90 text-slate-500 dark:text-slate-400",
                                                                )} />
                                                            </span>
                                                            {row.buildingName}
                                                            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                                                                {aptCount} apt{aptCount !== 1 ? 's' : ''}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{row.bulkAccount}</td>
                                                    <td className={cn(tdBase, "text-center")}>
                                                        <StatusChip label={`Zone ${row.zone}`} color={row.zone === '3A' ? 'primary' : 'default'} />
                                                    </td>
                                                    <td className={cn(tdBase, "text-right tabular-nums font-medium")}>
                                                        {row.l3Bulk === null ? <NullBadge /> : n(row.l3Bulk)}
                                                    </td>
                                                    <td className={cn(tdBase, "text-right tabular-nums text-indigo-600 dark:text-indigo-400")}>
                                                        {n(row.commonSum)}
                                                    </td>
                                                    <td className={cn(tdBase, "text-right tabular-nums")}>
                                                        {n(row.aptSum)}
                                                    </td>
                                                    <td className={cn(tdBase, "text-right tabular-nums font-medium")}>
                                                        {n(row.l4Sum)}
                                                    </td>
                                                    <td className={cn(tdBase, "text-right")}>
                                                        {row.diff !== null ? (
                                                            row.hasNonZeroDiff
                                                                ? <StatusChip label={diffCell(row.diff)} color={Math.abs(row.diff) > 1 ? 'danger' : 'warning'} />
                                                                : <StatusChip label={diffCell(row.diff)} color="success" />
                                                        ) : '—'}
                                                    </td>
                                                    <td className={cn(
                                                        tdBase, "text-right tabular-nums font-semibold",
                                                        row.diffPercent !== null && Math.abs(row.diffPercent) > 10 && "text-red-600 dark:text-red-400",
                                                        row.diffPercent !== null && Math.abs(row.diffPercent) <= 10 && "text-emerald-600 dark:text-emerald-400",
                                                    )}>
                                                        {row.diffPercent !== null ? `${row.diffPercent}%` : '—'}
                                                    </td>
                                                </tr>
                                            );

                                            if (isExpanded) {
                                                rows.push(renderChildRow(row));
                                            }

                                            return rows;
                                        })
                                    )}
                                    {/* Totals row */}
                                    {filtered.length > 0 && (
                                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                                            <td className={cn(tdBase, "font-bold")} colSpan={3}>
                                                Total ({filtered.length} buildings)
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>
                                                {n(r2(filtered.reduce((s, r) => s + (r.l3Bulk ?? 0), 0)))}
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold text-indigo-600 dark:text-indigo-400")}>
                                                {n(r2(filtered.reduce((s, r) => s + r.commonSum, 0)))}
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>
                                                {n(r2(filtered.reduce((s, r) => s + r.aptSum, 0)))}
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>
                                                {n(r2(filtered.reduce((s, r) => s + r.l4Sum, 0)))}
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold",
                                                (() => {
                                                    const totalBulk = filtered.reduce((s, r) => s + (r.l3Bulk ?? 0), 0);
                                                    const totalIndv = filtered.reduce((s, r) => s + r.l4Sum, 0);
                                                    const d = totalBulk - totalIndv;
                                                    return Math.abs(d) > 5 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400";
                                                })(),
                                            )}>
                                                {(() => {
                                                    const totalBulk = filtered.reduce((s, r) => s + (r.l3Bulk ?? 0), 0);
                                                    const totalIndv = filtered.reduce((s, r) => s + r.l4Sum, 0);
                                                    return diffCell(r2(totalBulk - totalIndv));
                                                })()}
                                            </td>
                                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>
                                                {(() => {
                                                    const totalBulk = filtered.reduce((s, r) => s + (r.l3Bulk ?? 0), 0);
                                                    const totalIndv = filtered.reduce((s, r) => s + r.l4Sum, 0);
                                                    const pct = totalBulk > 0 ? r2(((totalBulk - totalIndv) / totalBulk) * 100) : 0;
                                                    return `${pct}%`;
                                                })()}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-5 sm:px-6 pb-4">
                            <TablePagination
                                page={page}
                                totalPages={totalPages}
                                totalItems={filtered.length}
                                onPageChange={setPage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
