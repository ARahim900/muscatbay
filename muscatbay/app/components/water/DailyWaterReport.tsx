"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getDynamicMonths } from "@/lib/water-data";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, NULL_AS_ZERO_ACCOUNTS,
    BUILDING_CHILD_METERS,
    type ZoneBulkConfig,
} from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays,
    Droplets, Building2, Zap, Activity, Search, ArrowUpDown,
    Clock, Loader2, RefreshCw, WifiOff, Radio, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import {
    AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer, ReferenceLine, Legend, Line,
} from "recharts";

// ─── Chart color constants (CSS variable-backed) ────────────────────────────

const CHART_COLORS = {
    loss: 'var(--chart-loss)',
    success: 'var(--chart-success)',
    teal: 'var(--chart-teal)',
    brand: 'var(--chart-brand)',
    amber: 'var(--chart-amber)',
    gray: 'var(--chart-gray)',
} as const;

// ─── Unified brand palette (Muscat Bay) ──────────────────────────────────────
// Applied to the Zone → L3 hierarchy view for visual consistency with the
// monthly dashboard and other sections of the app.

const PALETTE = {
    primary: '#4E4456', // dark purple — brand primary (bulk headers, emphasis)
    neutral: '#C6D8D3', // light sage — subtle row fills / nested backgrounds
    mint:    '#A4DCC6', // mint green — OK / in-balance / sum totals
    blue:    '#337FCA', // blue       — informational / secondary rollups
    amber:   '#F4C741', // amber      — mid-magnitude difference warnings
    red:     '#E05050', // red        — high-loss / out-of-tolerance
} as const;

// ─── Computed row types ───────────────────────────────────────────────────────

interface ZoneRow {
    zoneName: string;
    l2Account: string;
    l2Value: number | null;
    l3Sum: number;
    diff: number | null;
    isNullL2: boolean;
    isHighLoss: boolean;
}

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
    diff: number | null;
    hasNonZeroDiff: boolean;
    childMeters: ChildMeterReading[];
}

interface DCRow {
    meterName: string;
    account: string;
    isIrr: boolean;
    rawValue: number | null;
    /** The value displayed — 0 for null-as-zero, null for truly missing non-irr meters */
    displayValue: number | null;
    isNullFlag: boolean;
}

interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    dcTotal: number;
    grandTotal: number;
}

type ReportStatus = 'loading' | 'success' | 'error';

// ─── Data processing ──────────────────────────────────────────────────────────

/** Round to 2 decimal places */
const r2 = (v: number) => Math.round(v * 100) / 100;

function processReport(readings: Record<string, number | null>): ReportData {
    const get = (acc: string): number | null =>
        acc in readings ? readings[acc] : null;

    // TABLE 1 — Zone rows
    const zoneRows: ZoneRow[] = ZONE_BULK_CONFIG.map(z => {
        const l2Value = get(z.l2Account);
        const l3Sum = z.l3Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l2Value !== null ? r2(l2Value - l3Sum) : null;
        return {
            zoneName: z.zoneName,
            l2Account: z.l2Account,
            l2Value: l2Value !== null ? r2(l2Value) : null,
            l3Sum: r2(l3Sum),
            diff,
            isNullL2: l2Value === null,
            isHighLoss: diff !== null && Math.abs(diff) > 20,
        };
    });

    // TABLE 2 — Building rows (with child meter details)
    const buildingRows: BuildingRow[] = BUILDING_CONFIG.map(b => {
        const l3Bulk = get(b.bulkAccount);
        const l4Sum = b.l4Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l3Bulk !== null ? r2(l3Bulk - l4Sum) : null;

        // Map child meter details from BUILDING_CHILD_METERS
        const childInfo = BUILDING_CHILD_METERS[b.buildingName] ?? [];
        const childMeters: ChildMeterReading[] = childInfo.map(cm => ({
            label: cm.label,
            account: cm.account,
            type: cm.type,
            value: get(cm.account),
        }));

        return {
            buildingName: b.buildingName,
            zone: b.zone,
            bulkAccount: b.bulkAccount,
            l3Bulk: l3Bulk !== null ? r2(l3Bulk) : null,
            l4Sum: r2(l4Sum),
            diff,
            hasNonZeroDiff: diff !== null && Math.abs(diff) >= 0.01,
            childMeters,
        };
    });

    // TABLE 3 — DC rows
    const dcRows: DCRow[] = DC_METERS.map(dc => {
        const rawValue = get(dc.account);
        const isNullAsZero = dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account);
        const displayValue = rawValue !== null ? r2(rawValue)
            : isNullAsZero ? 0 : null;
        return {
            meterName: dc.meterName,
            account: dc.account,
            isIrr: dc.isIrr,
            rawValue,
            displayValue,
            isNullFlag: rawValue === null && !isNullAsZero,
        };
    });

    // SUMMARY
    const l2Total = r2(zoneRows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const dcTotal = r2(dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    return { zoneRows, buildingRows, dcRows, l2Total, dcTotal, grandTotal: r2(l2Total + dcTotal) };
}

// ─── Number formatter ─────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Unified KPI tile for the Zone hierarchy view ────────────────────────────
// Mirrors the `StatsGrid` card design used across the rest of the app: white
// elevated surface, color-matched hairline accent bar, soft icon chip, tabular
// numerals. Color is driven by the Muscat Bay brand palette.

function HierarchyStatCard({
    label, value, icon, color, valueColor,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    valueColor?: string;
}) {
    return (
        <div
            className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out group/stat"
        >
            <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            />
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">
                        {label}
                    </p>
                    <h3
                        className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100"
                        style={valueColor ? { color: valueColor } : undefined}
                    >
                        {value}
                    </h3>
                </div>
                <div
                    className="p-2 sm:p-3 rounded-lg motion-safe:group-hover/stat:scale-110 motion-safe:group-hover/stat:-rotate-3 transition-transform duration-200 ease-out flex-shrink-0"
                    style={{ backgroundColor: `${color}1A`, color }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Modern table primitives ─────────────────────────────────────────────────
// Uses raw HTML table elements styled inline to avoid shadcn's double-border wrapper.

const thBase = "h-14 px-5 text-left align-middle font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-5 py-4 align-middle text-sm font-semibold text-slate-700 dark:text-slate-300";

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

function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-full sm:w-64 pl-9 pr-8 text-[13px] rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all"
            />
            {value && (
                <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                    <span className="text-[10px] leading-none font-bold">&times;</span>
                </button>
            )}
        </div>
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

function TablePagination({
    page, totalPages, totalItems, onPageChange, rowsPerPage, onRowsPerPageChange,
}: {
    page: number; totalPages: number; totalItems: number;
    onPageChange: (p: number) => void; rowsPerPage: number; onRowsPerPageChange: (n: number) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
            <span className="text-[12px] text-slate-400 dark:text-slate-500 tabular-nums">
                {totalItems} result{totalItems !== 1 ? 's' : ''}
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
                                ? "bg-primary text-white shadow-sm dark:bg-secondary dark:text-white"
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

// ─── Zone Analytics Panel ─────────────────────────────────────────────────────

interface ZoneAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
    activeZoneName: string;
}

function ZoneAnalyticsPanel({ reportData, monthData, selectedDay, month, activeZoneName }: ZoneAnalyticsPanelProps) {

    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Active zone report row
    const zoneRow = reportData.zoneRows.find(r => r.zoneName === activeZoneName) ?? null;
    const l2Value = zoneRow?.l2Value ?? 0;
    const l3Sum = zoneRow?.l3Sum ?? 0;
    const diff = zoneRow?.diff ?? null;

    // Shared gauge scale (same as Zone Analysis page)
    const gaugeMax = Math.max(l2Value, l3Sum) * 1.2 || 100;
    const lossColor = diff !== null && diff > 0 ? CHART_COLORS.loss : CHART_COLORS.success;

    // 31-day trend for the active zone
    const trendData = useMemo(() => {
        const zc = ZONE_BULK_CONFIG.find(z => z.zoneName === activeZoneName) ?? ZONE_BULK_CONFIG[0];
        const results: { day: string; dayNum: number; 'L2 Bulk': number | null; 'ΣL3': number; Loss: number | null }[] = [];

        for (let day = 1; day <= 31; day++) {
            const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
            const getVal = (acc: string): number | null => {
                const row = accountMap.get(acc);
                const v = row?.[dayCol];
                return v != null ? Number(v) : null;
            };
            const l2 = getVal(zc.l2Account);
            const l3 = zc.l3Accounts.reduce((s, a) => s + (getVal(a) ?? 0), 0);
            if (l2 === null && l3 === 0) continue;
            results.push({
                day: `D${String(day).padStart(2, '0')}`,
                dayNum: day,
                'L2 Bulk': l2 !== null ? r2(l2) : null,
                'ΣL3': r2(l3),
                Loss: l2 !== null ? r2(Math.max(0, l2 - l3)) : null,
            });
        }
        return results;
    }, [accountMap, activeZoneName]);

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">

            {/* ── Zone heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {activeZoneName} Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-mb-secondary font-medium">L2 Bulk</span> = zone entry meter &bull;{" "}
                    <span className="text-mb-primary font-medium">ΣL3 Total</span> = sum of all L3 meters &bull;{" "}
                    <span style={{ color: CHART_COLORS.loss }} className="font-medium">Difference</span> = L2 &minus; ΣL3
                </p>
            </div>

            {/* ── 3 Gauge rings — bare grid, no individual card wrappers ───── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <LiquidProgressRing
                    value={l2Value}
                    max={gaugeMax}
                    label="L2 Bulk Meter"
                    sublabel="Total water entering zone"
                    color={CHART_COLORS.teal}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-gauge-1"
                />
                <LiquidProgressRing
                    value={l3Sum}
                    max={gaugeMax}
                    label="ΣL3 Meters Total"
                    sublabel="Recorded by L3 meters"
                    color={CHART_COLORS.brand}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-gauge-2"
                />
                <LiquidProgressRing
                    value={Math.abs(diff ?? 0)}
                    max={l2Value || 100}
                    label="Water Loss / Diff"
                    sublabel="Leakage, meter loss, etc."
                    color={lossColor}
                    size={160}
                    showPercentage={true}
                    elementId="daily-gauge-3"
                />
            </div>

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">
                        Zone Daily Consumption Trend
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Day-by-day comparison of L2 Bulk vs ΣL3 totals — {activeZoneName}, {month}
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
                            No trend data available for this zone
                        </div>
                    ) : (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradDailyBulk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradDailyL3" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        dy={10} interval={4}
                                    />
                                    <YAxis
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }}
                                    />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.brand}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: CHART_COLORS.brand, fontWeight: 600 }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="ΣL3 Total" dataKey="ΣL3"
                                        stroke={CHART_COLORS.brand} fill="url(#gradDailyL3)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={600}
                                    />
                                    <Line
                                        type="monotone" name="Loss" dataKey="Loss"
                                        stroke={CHART_COLORS.loss} strokeWidth={2}
                                        dot={false} strokeDasharray="5 5"
                                        animationDuration={600}
                                    />
                                    <Area
                                        type="monotone" name="L2 Bulk" dataKey="L2 Bulk"
                                        stroke={CHART_COLORS.teal} fill="url(#gradDailyBulk)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={600}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Zone L3 Meters Table — All-Days View ────────────────────────────────────

function ZoneL3Table({
    zoneRow,
    zoneConfig,
    monthData,
    buildingRows,
}: {
    zoneRow: ZoneRow;
    zoneConfig: ZoneBulkConfig;
    monthData: SupabaseDailyWaterConsumption[];
    buildingRows: BuildingRow[];
}) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    // Track which L3-building rows are currently expanded to reveal their L4 children
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const toggleBuilding = useCallback((bulkAccount: string) => {
        setExpandedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(bulkAccount)) next.delete(bulkAccount);
            else next.add(bulkAccount);
            return next;
        });
    }, []);

    // Build account map for quick lookups
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Map building bulk accounts to building info (only buildings in this zone)
    const buildingMap = useMemo(() => {
        const map = new Map<string, BuildingRow>();
        for (const b of buildingRows) {
            if (zoneConfig.l3Accounts.includes(b.bulkAccount)) {
                map.set(b.bulkAccount, b);
            }
        }
        return map;
    }, [buildingRows, zoneConfig]);

    // Determine latest day with data for any L3 account in this zone
    const latestDay = useMemo(() => {
        let maxDay = 0;
        for (const account of zoneConfig.l3Accounts) {
            const row = accountMap.get(account);
            if (!row) continue;
            for (let d = 31; d >= 1; d--) {
                if (d <= maxDay) break;
                const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                if (val != null) { maxDay = d; break; }
            }
        }
        return Math.max(maxDay, 1);
    }, [accountMap, zoneConfig]);

    const days = useMemo(() => Array.from({ length: latestDay }, (_, i) => i + 1), [latestDay]);

    // Build L3 meter list with all daily readings
    const l3Meters = useMemo(() => {
        return zoneConfig.l3Accounts.map(account => {
            const building = buildingMap.get(account) ?? null;
            const dbRow = accountMap.get(account);
            const isNullAsZero = NULL_AS_ZERO_ACCOUNTS.has(account);

            const dailyValues: (number | null)[] = [];
            let total = 0;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                const val = raw != null ? r2(Number(raw)) : isNullAsZero ? 0 : null;
                dailyValues.push(val);
                total += val ?? 0;
            }

            return {
                account,
                isNullAsZero,
                building,
                label: building ? building.buildingName : account,
                dailyValues,
                total: r2(total),
            };
        });
    }, [zoneConfig, accountMap, buildingMap, latestDay]);

    // Per-day ΣL3 totals for footer
    const dayTotals = useMemo(() => {
        return days.map((_, i) => r2(l3Meters.reduce((sum, m) => sum + (m.dailyValues[i] ?? 0), 0)));
    }, [days, l3Meters]);
    const grandTotal = r2(dayTotals.reduce((s, v) => s + v, 0));

    // L2 per-day values for tiles
    const l2DayTotals = useMemo(() => {
        const row = accountMap.get(zoneConfig.l2Account);
        return days.map(d => {
            if (!row) return null;
            const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
            return val != null ? r2(Number(val)) : null;
        });
    }, [accountMap, zoneConfig, days]);
    const l2GrandTotal = r2(l2DayTotals.reduce<number>((s, v) => s + (v ?? 0), 0));
    const diffGrandTotal = r2(l2GrandTotal - grandTotal);

    // Per-day difference: L2 bulk minus ΣL3 for each reporting day
    const diffByDay = useMemo(
        () => days.map((_, i) => r2((l2DayTotals[i] ?? 0) - dayTotals[i])),
        [days, l2DayTotals, dayTotals],
    );

    // ── Per-building L4 drill-down data ───────────────────────────────────────
    // For every L3 meter in this zone that is itself a building bulk, compute
    // the day-by-day readings for each of its L4 children, the ΣL4 totals,
    // and the building-level difference (L3 bulk − ΣL4). Memoised off `days`
    // and the account map so it recomputes only when the reporting window or
    // data changes.
    interface BuildingChildReading {
        account: string;
        label: string;
        type: 'Apartment' | 'Common';
        dailyValues: (number | null)[];
        total: number;
    }
    interface BuildingL4Detail {
        buildingName: string;
        bulkDailyValues: (number | null)[];
        bulkTotal: number;
        children: BuildingChildReading[];
        childDayTotals: number[];
        childGrandTotal: number;
        diffDayTotals: number[];
        diffGrandTotal: number;
    }
    const buildingL4Data = useMemo<Map<string, BuildingL4Detail>>(() => {
        const map = new Map<string, BuildingL4Detail>();
        for (const b of BUILDING_CONFIG) {
            if (!zoneConfig.l3Accounts.includes(b.bulkAccount)) continue;

            const bulkRow = accountMap.get(b.bulkAccount);
            const bulkDailyValues: (number | null)[] = days.map(d => {
                if (!bulkRow) return null;
                const v = bulkRow[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                return v != null ? r2(Number(v)) : null;
            });
            const bulkTotal = r2(bulkDailyValues.reduce<number>((s, v) => s + (v ?? 0), 0));

            const info = BUILDING_CHILD_METERS[b.buildingName] ?? [];
            const children: BuildingChildReading[] = b.l4Accounts.map(acc => {
                const meta = info.find(c => c.account === acc);
                const row = accountMap.get(acc);
                const dailyValues: (number | null)[] = days.map(d => {
                    if (!row) return null;
                    const v = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                    return v != null ? r2(Number(v)) : null;
                });
                const total = r2(dailyValues.reduce<number>((s, v) => s + (v ?? 0), 0));
                return {
                    account: acc,
                    label: meta?.label ?? acc,
                    type: meta?.type ?? 'Apartment',
                    dailyValues,
                    total,
                };
            });

            const childDayTotals = days.map((_, i) =>
                r2(children.reduce((s, c) => s + (c.dailyValues[i] ?? 0), 0)),
            );
            const childGrandTotal = r2(childDayTotals.reduce((s, v) => s + v, 0));

            const diffDayTotals = days.map((_, i) =>
                r2((bulkDailyValues[i] ?? 0) - childDayTotals[i]),
            );
            const diffGrandTotal = r2(bulkTotal - childGrandTotal);

            map.set(b.bulkAccount, {
                buildingName: b.buildingName,
                bulkDailyValues,
                bulkTotal,
                children,
                childDayTotals,
                childGrandTotal,
                diffDayTotals,
                diffGrandTotal,
            });
        }
        return map;
    }, [zoneConfig, accountMap, days]);

    // Filter & sort
    const filtered = useMemo(() => {
        let result = [...l3Meters];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m => m.label.toLowerCase().includes(q) || m.account.includes(q));
        }
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'label') { va = a.label; vb = b.label; }
                else if (sort.key === 'total') { va = a.total; vb = b.total; }
                else { va = a.account; vb = b.account; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [l3Meters, search, sort]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination to page 1 when search/sort change; storing page in state is needed because users can also change it via pagination controls.
    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const colCount = 3 + days.length + 1; // Meter, Account, Type, ...days, Total

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <div>
                    <CardTitle className="text-base sm:text-lg">{zoneRow.zoneName} — L3 Meters</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {l3Meters.length} meters — Day 1 to Day {latestDay}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-4">
                {/* Zone summary KPI cards — unified brand palette */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* L2 Bulk — primary purple */}
                    <HierarchyStatCard
                        label="L2 Bulk (m³)"
                        value={n(l2GrandTotal)}
                        icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.primary}
                    />
                    {/* ΣL3 — info blue */}
                    <HierarchyStatCard
                        label="Σ Individuals (m³)"
                        value={n(grandTotal)}
                        icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.blue}
                    />
                    {/* Difference — mint (ok) / red (high loss) */}
                    <HierarchyStatCard
                        label="Difference"
                        value={diffCell(diffGrandTotal)}
                        icon={<ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={Math.abs(diffGrandTotal) > 20 ? PALETTE.red : PALETTE.mint}
                        valueColor={Math.abs(diffGrandTotal) > 20 ? PALETTE.red : undefined}
                    />
                </div>

                <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />

                {/* Horizontally scrollable table */}
                <div className="relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full border-collapse" style={{ minWidth: `${420 + days.length * 72}px` }}>
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <Th
                                    sortKey="label" sort={sort} onSort={setSort}
                                    className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[150px]"
                                >Meter</Th>
                                <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                                <th className={cn(thBase, "text-center min-w-[90px]")}>Type</th>
                                {days.map(d => (
                                    <th key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</th>
                                ))}
                                <Th
                                    sortKey="total" sort={sort} onSort={setSort}
                                    className="text-right min-w-[80px] bg-slate-50/80 dark:bg-slate-800/40"
                                >Total</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ── L2 Bulk summary row (top) ──────────────────────
                               Always visible, unaffected by pagination/search.  */}
                            <tr
                                className="border-b-2"
                                style={{
                                    backgroundColor: `${PALETTE.primary}14`,
                                    borderBottomColor: `${PALETTE.primary}40`,
                                }}
                            >
                                <td
                                    className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                    style={{
                                        backgroundColor: `${PALETTE.primary}14`,
                                        color: PALETTE.primary,
                                        boxShadow: `inset 4px 0 0 ${PALETTE.primary}`,
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Droplets className="h-3.5 w-3.5 shrink-0" />
                                        {zoneRow.zoneName} Bulk (L2)
                                    </span>
                                </td>
                                <td className={cn(tdBase, "font-mono text-[11px]")} style={{ color: `${PALETTE.primary}AA` }}>
                                    {zoneConfig.l2Account}
                                </td>
                                <td className={cn(tdBase, "text-center")}>
                                    <StatusChip label="L2 BULK" color="primary" />
                                </td>
                                {l2DayTotals.map((val, i) => (
                                    <td
                                        key={i}
                                        className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-bold")}
                                        style={{ color: PALETTE.primary }}
                                    >
                                        {val === null ? (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        ) : (
                                            n(val)
                                        )}
                                    </td>
                                ))}
                                <td
                                    className={cn(tdBase, "text-right tabular-nums font-bold")}
                                    style={{
                                        backgroundColor: `${PALETTE.primary}20`,
                                        color: PALETTE.primary,
                                    }}
                                >
                                    {n(l2GrandTotal)}
                                </td>
                            </tr>

                            {/* ── Individual L3 meter rows (paginated/filtered) ── */}
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                        No meters found
                                    </td>
                                </tr>
                            ) : paginated.flatMap(meter => {
                                const detail = meter.building ? buildingL4Data.get(meter.account) : null;
                                const isExpanded = !!detail && expandedBuildings.has(meter.account);
                                const rows: React.ReactNode[] = [];

                                // ── The L3 meter row itself ───────────────────────
                                rows.push(
                                    <tr
                                        key={meter.account}
                                        className={cn(
                                            "border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
                                            !isExpanded && "even:bg-slate-50/40 dark:even:bg-slate-800/20",
                                        )}
                                    >
                                        <td className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900")}>
                                            <span className="inline-flex items-center gap-2">
                                                {detail ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleBuilding(meter.account)}
                                                        aria-expanded={isExpanded}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${detail.buildingName} L4 meters`}
                                                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        style={{ color: PALETTE.primary }}
                                                    >
                                                        {isExpanded
                                                            ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                                            : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="font-semibold">{detail.buildingName}</span>
                                                    </button>
                                                ) : meter.building ? (
                                                    <>
                                                        <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: PALETTE.primary }} />
                                                        {meter.building.buildingName}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        {meter.account}
                                                        {meter.isNullAsZero && <StatusChip label="IRR" color="primary" />}
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{meter.account}</td>
                                        <td className={cn(tdBase, "text-center")}>
                                            <StatusChip label={meter.building ? "Building" : "Individual"} color={meter.building ? "primary" : "default"} />
                                        </td>
                                        {meter.dailyValues.map((val, i) => (
                                            <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                                {val === null ? (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                ) : val === 0 ? (
                                                    <span className="text-slate-400">0.00</span>
                                                ) : (
                                                    n(val)
                                                )}
                                            </td>
                                        ))}
                                        <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                            {n(meter.total)}
                                        </td>
                                    </tr>,
                                );

                                // ── Expanded: child L4 meters + ΣL4 + diff ───────
                                if (detail && isExpanded) {
                                    // L4 child rows
                                    detail.children.forEach((child, idx) => {
                                        rows.push(
                                            <tr
                                                key={`${meter.account}-child-${child.account}`}
                                                className="border-b border-slate-50 dark:border-slate-800/60"
                                                style={{ backgroundColor: `${PALETTE.neutral}26` }}
                                            >
                                                <td
                                                    className={cn(tdBase, "pl-10 font-normal sticky left-0 z-10 text-[13px]")}
                                                    style={{
                                                        backgroundColor: `${PALETTE.neutral}26`,
                                                        boxShadow: `inset 4px 0 0 ${PALETTE.primary}30`,
                                                    }}
                                                >
                                                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                        {idx === detail.children.length - 1
                                                            ? <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE.primary }} />
                                                            : <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                                        {child.label}
                                                    </span>
                                                </td>
                                                <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{child.account}</td>
                                                <td className={cn(tdBase, "text-center")}>
                                                    <StatusChip
                                                        label={child.type === 'Common' ? 'Common' : 'Apartment'}
                                                        color={child.type === 'Common' ? 'primary' : 'default'}
                                                    />
                                                </td>
                                                {child.dailyValues.map((val, i) => (
                                                    <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-normal")}>
                                                        {val === null ? (
                                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                                        ) : val === 0 ? (
                                                            <span className="text-slate-400">0.00</span>
                                                        ) : (
                                                            n(val)
                                                        )}
                                                    </td>
                                                ))}
                                                <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                                    {n(child.total)}
                                                </td>
                                            </tr>,
                                        );
                                    });

                                    // ΣL4 sub-footer — sum of apartments
                                    rows.push(
                                        <tr
                                            key={`${meter.account}-l4sum`}
                                            style={{ backgroundColor: `${PALETTE.blue}12` }}
                                        >
                                            <td
                                                className={cn(tdBase, "pl-10 font-bold sticky left-0 z-10 text-[12px]")}
                                                style={{
                                                    backgroundColor: `${PALETTE.blue}12`,
                                                    color: PALETTE.blue,
                                                    boxShadow: `inset 4px 0 0 ${PALETTE.blue}`,
                                                }}
                                                colSpan={3}
                                            >
                                                Σ Individuals — {detail.children.length} meters
                                            </td>
                                            {detail.childDayTotals.map((t, i) => (
                                                <td
                                                    key={i}
                                                    className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                    style={{ color: PALETTE.blue }}
                                                >
                                                    {n(t)}
                                                </td>
                                            ))}
                                            <td
                                                className={cn(tdBase, "text-right tabular-nums font-bold")}
                                                style={{ backgroundColor: `${PALETTE.blue}20`, color: PALETTE.blue }}
                                            >
                                                {n(detail.childGrandTotal)}
                                            </td>
                                        </tr>,
                                    );

                                    // Difference sub-footer — bulk − sum
                                    const isHighBuildingDiff = Math.abs(detail.diffGrandTotal) > 5;
                                    const diffTint = isHighBuildingDiff ? PALETTE.red : PALETTE.mint;
                                    rows.push(
                                        <tr
                                            key={`${meter.account}-l4diff`}
                                            className="border-b-2"
                                            style={{
                                                backgroundColor: `${diffTint}14`,
                                                borderBottomColor: `${diffTint}40`,
                                            }}
                                        >
                                            <td
                                                className={cn(tdBase, "pl-10 font-bold sticky left-0 z-10 text-[12px]")}
                                                style={{
                                                    backgroundColor: `${diffTint}14`,
                                                    color: diffTint,
                                                    boxShadow: `inset 4px 0 0 ${diffTint}`,
                                                }}
                                                colSpan={3}
                                            >
                                                Difference (Bulk − Σ)
                                            </td>
                                            {detail.diffDayTotals.map((t, i) => (
                                                <td
                                                    key={i}
                                                    className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                    style={{ color: diffTint }}
                                                >
                                                    {diffCell(t)}
                                                </td>
                                            ))}
                                            <td
                                                className={cn(tdBase, "text-right tabular-nums font-bold")}
                                                style={{ backgroundColor: `${diffTint}20`, color: diffTint }}
                                            >
                                                {diffCell(detail.diffGrandTotal)}
                                            </td>
                                        </tr>,
                                    );
                                }

                                return rows;
                            })}

                            {/* ── Σ Individuals footer row (zone level) ──────── */}
                            <tr
                                className="border-t-2"
                                style={{
                                    backgroundColor: `${PALETTE.blue}12`,
                                    borderTopColor: `${PALETTE.blue}40`,
                                }}
                            >
                                <td
                                    className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                    colSpan={3}
                                    style={{
                                        backgroundColor: `${PALETTE.blue}12`,
                                        color: PALETTE.blue,
                                        boxShadow: `inset 4px 0 0 ${PALETTE.blue}`,
                                    }}
                                >
                                    Σ Individuals — {l3Meters.length} meters
                                </td>
                                {dayTotals.map((t, i) => (
                                    <td
                                        key={i}
                                        className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                        style={{ color: PALETTE.blue }}
                                    >
                                        {n(t)}
                                    </td>
                                ))}
                                <td
                                    className={cn(tdBase, "text-right tabular-nums font-bold")}
                                    style={{ backgroundColor: `${PALETTE.blue}20`, color: PALETTE.blue }}
                                >
                                    {n(grandTotal)}
                                </td>
                            </tr>

                            {/* ── Difference footer row (zone level) ─────────── */}
                            {(() => {
                                const isHighZoneDiff = Math.abs(diffGrandTotal) > 20;
                                const diffTint = isHighZoneDiff ? PALETTE.red : PALETTE.mint;
                                return (
                                    <tr
                                        className="border-t"
                                        style={{
                                            backgroundColor: `${diffTint}14`,
                                            borderTopColor: `${diffTint}40`,
                                        }}
                                    >
                                        <td
                                            className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                            colSpan={3}
                                            style={{
                                                backgroundColor: `${diffTint}14`,
                                                color: diffTint,
                                                boxShadow: `inset 4px 0 0 ${diffTint}`,
                                            }}
                                        >
                                            Difference (L2 − Σ Individuals)
                                        </td>
                                        {diffByDay.map((t, i) => (
                                            <td
                                                key={i}
                                                className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                style={{ color: diffTint }}
                                            >
                                                {diffCell(t)}
                                            </td>
                                        ))}
                                        <td
                                            className={cn(tdBase, "text-right tabular-nums font-bold")}
                                            style={{ backgroundColor: `${diffTint}20`, color: diffTint }}
                                        >
                                            {diffCell(diffGrandTotal)}
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden" />
                </div>

                {filtered.length > rowsPerPage && (
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={rpp => { setRowsPerPage(rpp); setPage(1); }}
                    />
                )}
            </CardContent>
        </Card>
    );
}

// ─── DC Analytics Panel (mirrors ZoneAnalyticsPanel) ─────────────────────────

interface DCAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}

function DCAnalyticsPanel({ reportData, monthData, selectedDay, month }: DCAnalyticsPanelProps) {
    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Daily DC total = sum of all DC meters for the selected day
    const dailyDcTotal = r2(reportData.dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    // 31-day DC trend + monthly aggregates
    const { trendData, monthlyTotal } = useMemo(() => {
        const results: { day: string; dayNum: number; 'DC Total': number }[] = [];
        let mTotal = 0;
        for (let day = 1; day <= 31; day++) {
            const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
            let dayTotal = 0;
            let hasAny = false;
            for (const dc of DC_METERS) {
                const row = accountMap.get(dc.account);
                const v = row?.[dayCol];
                if (v != null) {
                    dayTotal += Number(v);
                    hasAny = true;
                }
            }
            if (!hasAny) continue;
            mTotal += dayTotal;
            results.push({
                day: `D${String(day).padStart(2, '0')}`,
                dayNum: day,
                'DC Total': r2(dayTotal),
            });
        }
        return { trendData: results, monthlyTotal: r2(mTotal) };
    }, [accountMap]);

    // Active meters (reporting on selected day)
    const activeMeters = reportData.dcRows.filter(r => r.rawValue !== null).length;
    const totalMeters = reportData.dcRows.length;

    // Gauge scales
    const maxDaily = Math.max(...trendData.map(d => d['DC Total']), dailyDcTotal);
    const dailyGaugeMax = maxDaily * 1.2 || 100;
    const monthlyGaugeMax = monthlyTotal * 1.2 || 100;

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">

            {/* ── DC heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Direct Connection Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-mb-secondary font-medium">DC Daily Total</span> = sum of all DC meters today &bull;{" "}
                    <span className="text-mb-primary font-medium">Monthly Total</span> = month-to-date DC consumption &bull;{" "}
                    <span style={{ color: CHART_COLORS.success }} className="font-medium">Active Meters</span> = meters reporting today
                </p>
            </div>

            {/* ── 3 Gauge rings ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <LiquidProgressRing
                    value={dailyDcTotal}
                    max={dailyGaugeMax}
                    label="DC Daily Total"
                    sublabel="Sum of DC meters today"
                    color={CHART_COLORS.teal}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-1"
                />
                <LiquidProgressRing
                    value={monthlyTotal}
                    max={monthlyGaugeMax}
                    label="Monthly DC Total"
                    sublabel="Month-to-date consumption"
                    color={CHART_COLORS.brand}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-2"
                />
                <LiquidProgressRing
                    value={activeMeters}
                    max={totalMeters || 1}
                    label="Active DC Meters"
                    sublabel={`${activeMeters} of ${totalMeters} reporting`}
                    color={CHART_COLORS.success}
                    size={160}
                    showPercentage={true}
                    elementId="daily-dc-gauge-3"
                />
            </div>

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">
                        Direct Connection Daily Consumption Trend
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Day-by-day DC total across all {totalMeters} meters — {month}
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
                            No trend data available for direct connections
                        </div>
                    ) : (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradDailyDC" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        dy={10} interval={4}
                                    />
                                    <YAxis
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }}
                                    />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.brand}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: CHART_COLORS.brand, fontWeight: 600 }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="DC Total" dataKey="DC Total"
                                        stroke={CHART_COLORS.teal} fill="url(#gradDailyDC)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={600}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── DC Daily Meters Table (mirrors ZoneL3Table) ─────────────────────────────

function DCDailyTable({ monthData }: { monthData: SupabaseDailyWaterConsumption[] }) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Build account map for quick lookups
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Determine latest day with data for any DC account
    const latestDay = useMemo(() => {
        let maxDay = 0;
        for (const dc of DC_METERS) {
            const row = accountMap.get(dc.account);
            if (!row) continue;
            for (let d = 31; d >= 1; d--) {
                if (d <= maxDay) break;
                const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                if (val != null) { maxDay = d; break; }
            }
        }
        return Math.max(maxDay, 1);
    }, [accountMap]);

    const days = useMemo(() => Array.from({ length: latestDay }, (_, i) => i + 1), [latestDay]);

    // Build DC meter list with all daily readings.
    // `rawValues` preserves the pre-normalization null so "active today" logic
    // can distinguish a real 0 reading from an IRR/null-as-zero placeholder.
    const dcMeters = useMemo(() => {
        return DC_METERS.map(dc => {
            const dbRow = accountMap.get(dc.account);
            const isNullAsZero = dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account);

            const dailyValues: (number | null)[] = [];
            const rawValues: (number | null)[] = [];
            let total = 0;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                rawValues.push(raw != null ? Number(raw) : null);
                const val = raw != null ? r2(Number(raw)) : isNullAsZero ? 0 : null;
                dailyValues.push(val);
                total += val ?? 0;
            }

            return {
                account: dc.account,
                label: dc.meterName,
                isIrr: dc.isIrr,
                isNullAsZero,
                dailyValues,
                rawValues,
                total: r2(total),
            };
        });
    }, [accountMap, latestDay]);

    // Per-day ΣDC totals for footer
    const dayTotals = useMemo(() => {
        return days.map((_, i) => r2(dcMeters.reduce((sum, m) => sum + (m.dailyValues[i] ?? 0), 0)));
    }, [days, dcMeters]);
    const grandTotal = r2(dayTotals.reduce((s, v) => s + v, 0));

    // Active meters today (latest day) — measured from rawValues so IRR
    // meters that were normalized null→0 aren't mistakenly counted as active.
    const activeMeters = dcMeters.filter(m => m.rawValues[latestDay - 1] !== null).length;

    // Filter & sort
    const filtered = useMemo(() => {
        let result = [...dcMeters];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m => m.label.toLowerCase().includes(q) || m.account.includes(q));
        }
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'label') { va = a.label; vb = b.label; }
                else if (sort.key === 'total') { va = a.total; vb = b.total; }
                else { va = a.account; vb = b.account; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [dcMeters, search, sort]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination to page 1 when search/sort change; storing page in state is needed because users can also change it via pagination controls.
    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const colCount = 3 + days.length + 1; // Meter, Account, Type, ...days, Total

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <div>
                    <CardTitle className="text-base sm:text-lg">Direct Connection — Meters</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {dcMeters.length} meters — Day 1 to Day {latestDay}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-4">
                {/* DC summary KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Monthly Total */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Monthly DC Total (m³)</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{n(grandTotal)}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-secondary-light flex-shrink-0">
                                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-mb-secondary" />
                            </div>
                        </div>
                    </div>
                    {/* Total Meters */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">DC Meters</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{dcMeters.length}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-primary-light/20 flex-shrink-0">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-mb-primary" />
                            </div>
                        </div>
                    </div>
                    {/* Active Meters (latest day) */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Active (Day {latestDay})</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-mb-success-text tabular-nums tracking-tight">
                                    {activeMeters}<span className="text-slate-400 dark:text-slate-500 text-base font-semibold"> / {dcMeters.length}</span>
                                </h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-success-light flex-shrink-0">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-mb-success" />
                            </div>
                        </div>
                    </div>
                </div>

                <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />

                {/* Horizontally scrollable table */}
                <div className="relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full border-collapse" style={{ minWidth: `${420 + days.length * 72}px` }}>
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <Th
                                    sortKey="label" sort={sort} onSort={setSort}
                                    className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[180px]"
                                >Meter</Th>
                                <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                                <th className={cn(thBase, "text-center min-w-[90px]")}>Type</th>
                                {days.map(d => (
                                    <th key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</th>
                                ))}
                                <Th
                                    sortKey="total" sort={sort} onSort={setSort}
                                    className="text-right min-w-[80px] bg-slate-50/80 dark:bg-slate-800/40"
                                >Total</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                        No meters found
                                    </td>
                                </tr>
                            ) : paginated.map(meter => (
                                <tr
                                    key={meter.account}
                                    className="border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 even:bg-slate-50/40 dark:even:bg-slate-800/20"
                                >
                                    <td className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900")}>
                                        <span className="inline-flex items-center gap-2">
                                            {meter.isIrr ? (
                                                <Droplets className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                            ) : (
                                                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            )}
                                            {meter.label}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{meter.account}</td>
                                    <td className={cn(tdBase, "text-center")}>
                                        <StatusChip label={meter.isIrr ? "Irrigation" : "Service"} color={meter.isIrr ? "primary" : "default"} />
                                    </td>
                                    {meter.dailyValues.map((val, i) => (
                                        <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                            {val === null ? (
                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                            ) : val === 0 ? (
                                                <span className="text-slate-400">0.00</span>
                                            ) : (
                                                n(val)
                                            )}
                                        </td>
                                    ))}
                                    <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                        {n(meter.total)}
                                    </td>
                                </tr>
                            ))}
                            {/* ΣDC Footer */}
                            <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                                <td className={cn(tdBase, "font-bold sticky left-0 z-10 bg-slate-50/60 dark:bg-slate-800/20")} colSpan={3}>
                                    ΣDC Total ({dcMeters.length} meters)
                                </td>
                                {dayTotals.map((t, i) => (
                                    <td key={i} className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}>{n(t)}</td>
                                ))}
                                <td className={cn(tdBase, "text-right tabular-nums font-bold bg-slate-50/80 dark:bg-slate-800/40")}>{n(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden" />
                </div>

                {filtered.length > rowsPerPage && (
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={rpp => { setRowsPerPage(rpp); setPage(1); }}
                    />
                )}
            </CardContent>
        </Card>
    );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function LoadingState() {
    return (
        <div className="space-y-4">
            {['Zone Bulk vs L3', 'Building Analysis', 'Direct Connections'].map(label => (
                <Card key={label} className="card-elevated">
                    <CardHeader className="card-elevated-header p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 motion-safe:animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded motion-safe:animate-pulse" />
                                <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded motion-safe:animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 w-full rounded bg-slate-100 dark:bg-slate-800 motion-safe:animate-pulse" />
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
                Failed to Load Report
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

    // ── Apply "yesterday" defaults on client mount ────────────────────────────
    // Runs once on the client so `new Date()` reflects the user's local time,
    // not the server's UTC time. Guaranteed to land on (today − 1 day).
    useEffect(() => {
        const m = getDefaultMonth();
        setSelectedMonth(m);
        setSelectedDay(getDefaultDay(m));
        setDefaultsApplied(true);
        // Intentionally empty deps — run exactly once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                                    className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
                                    className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                        <Clock className="h-3 w-3" />
                                        Updated {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Day selector — own row on mobile (w-full), flex-1 inline on sm+ */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:flex-1 sm:min-w-[220px] sm:order-2 pt-1 sm:pt-0 border-t border-slate-200/60 dark:border-slate-700/60 sm:border-t-0">
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
                            <span className="text-base font-bold text-primary min-w-[56px] tabular-nums text-right">
                                Day {selectedDay}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Content ─────────────────────────────────────────────────── */}
            {status === 'loading' && !reportData && <LoadingState />}
            {status === 'error' && <ErrorState message={errorMsg} onRetry={() => fetchMonth(selectedMonth)} />}

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
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 sm:mr-1">
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
                                                    "w-full sm:w-auto px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-all border text-center whitespace-nowrap",
                                                    isActive
                                                        ? "bg-primary text-white border-primary shadow-sm dark:bg-secondary dark:text-white dark:border-secondary"
                                                        : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                )}
                                            >
                                                {z.zoneName}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setActiveView('dc')}
                                        className={cn(
                                            "w-full sm:w-auto col-span-2 sm:col-span-1 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-all border text-center whitespace-nowrap",
                                            activeView === 'dc'
                                                ? "bg-primary text-white border-primary shadow-sm dark:bg-secondary dark:text-white dark:border-secondary"
                                                : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
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
