"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getDynamicMonths } from "@/lib/water-data";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, NULL_AS_ZERO_ACCOUNTS,
    BUILDING_CHILD_METERS,
    type ZoneBulkConfig, type BuildingConfig, type DCMeterConfig,
    type ChildMeterInfo,
} from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CalendarDays,
    Droplets, Building2, Zap, Activity, Search, ArrowUpDown,
    Clock, Loader2, RefreshCw, WifiOff, Radio, Home, Users, Filter,
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

function SectionHeader({
    icon, title, subtitle, color = 'teal',
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    color?: 'teal' | 'violet' | 'amber' | 'emerald';
}) {
    const bg = {
        teal: 'bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/10',
        violet: 'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/10',
        amber: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/10',
        emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/10',
    }[color];
    const text = {
        teal: 'text-teal-600 dark:text-teal-400',
        violet: 'text-violet-600 dark:text-violet-400',
        amber: 'text-amber-600 dark:text-amber-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
    }[color];
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl shadow-sm", bg)}>
                <div className={cn("h-5 w-5", text)}>{icon}</div>
            </div>
            <div>
                <h3 className="text-[15px] sm:text-[17px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">{title}</h3>
                {subtitle && <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function NullBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
            <AlertTriangle className="h-3 w-3" /> NULL
        </span>
    );
}

// ─── Modern table primitives ─────────────────────────────────────────────────
// Uses raw HTML table elements styled inline to avoid shadcn's double-border wrapper.

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

function FilterSelect({ value, onChange, children, icon }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    "h-9 text-[13px] rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50",
                    "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all appearance-none cursor-pointer pr-8",
                    icon ? "pl-9" : "pl-3",
                )}
            >
                {children}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
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

// TABLE 1 ─────────────────────────────────────────────────────────────────────

function ZoneBulkTable({ rows }: { rows: ZoneRow[] }) {
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'high_loss' | 'null'>('all');

    const filtered = useMemo(() => {
        let result = [...rows];
        if (statusFilter === 'normal') result = result.filter(r => !r.isHighLoss && !r.isNullL2);
        else if (statusFilter === 'high_loss') result = result.filter(r => r.isHighLoss);
        else if (statusFilter === 'null') result = result.filter(r => r.isNullL2);
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'zone') { va = a.zoneName; vb = b.zoneName; }
                else if (sort.key === 'l2') { va = a.l2Value ?? -1; vb = b.l2Value ?? -1; }
                else if (sort.key === 'l3') { va = a.l3Sum; vb = b.l3Sum; }
                else { va = a.diff ?? 0; vb = b.diff ?? 0; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [rows, sort, statusFilter]);

    const l2Total = r2(rows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const l3Total = r2(rows.reduce((s, r) => s + r.l3Sum, 0));
    const diffTotal = r2(l2Total - l3Total);
    const normalCount = rows.filter(r => !r.isHighLoss && !r.isNullL2).length;
    const lossCount = rows.filter(r => r.isHighLoss).length;

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* ── Toolbar ─────────────────────────────────── */}
            <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <SectionHeader
                        icon={<Droplets className="h-5 w-5" />}
                        title="Zone Bulk (L2) vs Sum of L3 Meters"
                        subtitle="L2 bulk meter reading vs sum of all L3 meters per zone"
                        color="teal"
                    />
                    <FilterSelect
                        value={statusFilter}
                        onChange={v => setStatusFilter(v as typeof statusFilter)}
                        icon={<Filter className="h-3.5 w-3.5" />}
                    >
                        <option value="all">All Status</option>
                        <option value="normal">Normal ({normalCount})</option>
                        <option value="high_loss">High Loss ({lossCount})</option>
                        <option value="null">NULL L2</option>
                    </FilterSelect>
                </div>
                <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    {filtered.length} of {rows.length} zones
                </span>
            </div>
            {/* ── Table ───────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-t border-b border-slate-100 dark:border-slate-800">
                            <Th sortKey="zone" sort={sort} onSort={setSort} className="min-w-[130px]">Zone</Th>
                            <th className={cn(thBase, "text-center")}>L2 Account</th>
                            <Th sortKey="l2" sort={sort} onSort={setSort} className="text-right">L2 (m³)</Th>
                            <Th sortKey="l3" sort={sort} onSort={setSort} className="text-right">ΣL3 (m³)</Th>
                            <Th sortKey="diff" sort={sort} onSort={setSort} className="text-right">Diff</Th>
                            <th className={cn(thBase, "text-center min-w-[100px]")}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(row => (
                            <tr key={row.zoneName} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                <td className={cn(tdBase, "font-semibold")}>{row.zoneName}</td>
                                <td className={cn(tdBase, "text-center font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{row.l2Account}</td>
                                <td className={cn(tdBase, "text-right tabular-nums font-medium")}>
                                    {row.isNullL2 ? <NullBadge /> : n(row.l2Value)}
                                </td>
                                <td className={cn(tdBase, "text-right tabular-nums")}>{n(row.l3Sum)}</td>
                                <td className={cn(
                                    tdBase, "text-right tabular-nums font-semibold",
                                    row.isHighLoss && "text-red-600 dark:text-red-400",
                                    !row.isHighLoss && !row.isNullL2 && "text-emerald-600 dark:text-emerald-400",
                                )}>
                                    {row.diff !== null ? diffCell(row.diff) : '—'}
                                </td>
                                <td className={cn(tdBase, "text-center")}>
                                    {row.isNullL2 && <StatusChip label="NULL L2" color="warning" />}
                                    {row.isHighLoss && <StatusChip label="High Loss" color="danger" />}
                                    {!row.isNullL2 && !row.isHighLoss && <StatusChip label="Normal" color="success" />}
                                </td>
                            </tr>
                        ))}
                        {/* Totals */}
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                            <td className={cn(tdBase, "font-bold")} colSpan={2}>Total</td>
                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>{n(l2Total)}</td>
                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>{n(l3Total)}</td>
                            <td className={cn(tdBase, "text-right tabular-nums font-bold", Math.abs(diffTotal) > 20 && "text-red-600 dark:text-red-400")}>
                                {diffCell(diffTotal)}
                            </td>
                            <td className={tdBase} />
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// TABLE 2 ─────────────────────────────────────────────────────────────────────

function BuildingBulkTable({ rows }: { rows: BuildingRow[] }) {
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState<'all' | '3A' | '3B'>('all');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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

    // Filter + sort
    const filtered = useMemo(() => {
        let result = [...rows];
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
                else if (sort.key === 'l3') { va = a.l3Bulk ?? -1; vb = b.l3Bulk ?? -1; }
                else if (sort.key === 'l4') { va = a.l4Sum; vb = b.l4Sum; }
                else { va = a.diff ?? 0; vb = b.diff ?? 0; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [rows, search, zoneFilter, sort]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, zoneFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginatedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const z3ACount = rows.filter(r => r.zone === '3A').length;
    const z3BCount = rows.filter(r => r.zone === '3B').length;

    function renderBuildingRow(row: BuildingRow) {
        const isExpanded = expandedBuildings.has(row.buildingName);
        const childCount = row.childMeters.length;
        const aptCount = row.childMeters.filter(c => c.type === 'Apartment').length;

        const mainRow = (
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
                <td className={cn(tdBase, "text-right tabular-nums")}>{n(row.l4Sum)}</td>
                <td className={cn(tdBase, "text-right")}>
                    {row.diff !== null ? (
                        row.hasNonZeroDiff
                            ? <StatusChip label={diffCell(row.diff)} color="warning" />
                            : <StatusChip label={diffCell(row.diff)} color="success" />
                    ) : '—'}
                </td>
            </tr>
        );

        if (!isExpanded) return [mainRow];

        const childRow = (
            <tr key={`${row.buildingName}-children`} className="bg-slate-50/40 dark:bg-slate-800/20">
                <td colSpan={6} className="py-0 px-0">
                    <div className="border-l-[3px] border-secondary/40 dark:border-secondary/30 ml-5 sm:ml-7">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                    <th className="text-left py-2 px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 w-[40%]">Meter</th>
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
                                        Sum of {childCount} meters
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-[12px] font-bold tabular-nums">{n(row.l4Sum)}</td>
                                </tr>
                                <tr className={cn(
                                    "border-t border-dashed border-slate-200 dark:border-slate-700",
                                    row.hasNonZeroDiff ? "bg-amber-50/50 dark:bg-amber-900/5" : "bg-emerald-50/30 dark:bg-emerald-900/5",
                                )}>
                                    <td className="py-2 px-4 text-[12px] font-bold" colSpan={3}>
                                        Bulk ({n(row.l3Bulk)}) − Sum ({n(row.l4Sum)}) = Difference
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

        return [mainRow, childRow];
    }

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* ── Toolbar ─────────────────────────────────── */}
            <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <SectionHeader
                        icon={<Building2 className="h-5 w-5" />}
                        title="Building Bulk (L3) vs Apartments (L4)"
                        subtitle="Click a building to expand apartment details"
                        color="violet"
                    />
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
                    <TableSearch value={search} onChange={setSearch} placeholder="Search building..." />
                    <FilterSelect
                        value={zoneFilter}
                        onChange={v => setZoneFilter(v as typeof zoneFilter)}
                        icon={<Filter className="h-3.5 w-3.5" />}
                    >
                        <option value="all">All Zones ({rows.length})</option>
                        <option value="3A">Zone 3A ({z3ACount})</option>
                        <option value="3B">Zone 3B ({z3BCount})</option>
                    </FilterSelect>
                </div>
            </div>
            {/* ── Table ───────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-t border-b border-slate-100 dark:border-slate-800">
                            <Th sortKey="building" sort={sort} onSort={setSort} className="min-w-[140px]">Building</Th>
                            <th className={cn(thBase)}>Bulk Account</th>
                            <th className={cn(thBase, "text-center")}>Zone</th>
                            <Th sortKey="l3" sort={sort} onSort={setSort} className="text-right">L3 Bulk (m³)</Th>
                            <Th sortKey="l4" sort={sort} onSort={setSort} className="text-right">ΣL4 (m³)</Th>
                            <Th sortKey="diff" sort={sort} onSort={setSort} className="text-right">Diff</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                    No buildings found
                                </td>
                            </tr>
                        ) : (
                            paginatedRows.flatMap(row => renderBuildingRow(row))
                        )}
                    </tbody>
                </table>
            </div>
            {/* ── Pagination ──────────────────────────────── */}
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
    );
}

// TABLE 3 ─────────────────────────────────────────────────────────────────────

function DCMetersTable({ rows }: { rows: DCRow[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'no-data' | 'idle'>('all');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });

    const total = r2(rows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    // Derive status for each row
    function getStatus(row: DCRow): 'active' | 'no-data' | 'idle' {
        if (row.rawValue !== null) return 'active';
        if (row.isIrr || NULL_AS_ZERO_ACCOUNTS.has(row.account)) return 'idle';
        return 'no-data';
    }

    // Filter
    const filtered = rows.filter(row => {
        if (search) {
            const q = search.toLowerCase();
            if (!row.meterName.toLowerCase().includes(q) && !row.account.includes(q)) return false;
        }
        if (statusFilter !== 'all' && getStatus(row) !== statusFilter) return false;
        return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (!sort.dir) return 0;
        const mul = sort.dir === 'asc' ? 1 : -1;
        switch (sort.key) {
            case 'name': return mul * a.meterName.localeCompare(b.meterName);
            case 'account': return mul * a.account.localeCompare(b.account);
            case 'status': return mul * getStatus(a).localeCompare(getStatus(b));
            case 'reading': return mul * ((a.displayValue ?? 0) - (b.displayValue ?? 0));
            default: return 0;
        }
    });

    const activeCount = rows.filter(r => r.rawValue !== null).length;
    const noDataCount = rows.filter(r => r.isNullFlag).length;
    const idleCount = rows.length - activeCount - noDataCount;

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* ── Toolbar ──────────────────────────────────── */}
            <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <SectionHeader
                        icon={<Zap className="h-5 w-5" />}
                        title="Direct Connections (DC)"
                        subtitle="Hotels, irrigation, facilities — connected directly to the L1 main supply"
                        color="amber"
                    />
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap tabular-nums">
                        {sorted.length} of {rows.length} meters
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter name or account…" />
                    <FilterSelect
                        value={statusFilter}
                        onChange={v => setStatusFilter(v as typeof statusFilter)}
                        icon={<Filter className="h-3.5 w-3.5" />}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active ({activeCount})</option>
                        <option value="no-data">No Data ({noDataCount})</option>
                        <option value="idle">Idle ({idleCount})</option>
                    </FilterSelect>
                </div>
            </div>
            {/* ── Table ────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-t border-b border-slate-100 dark:border-slate-800">
                            <Th sortKey="name" sort={sort} onSort={setSort} className="min-w-[180px]">Meter Name</Th>
                            <Th sortKey="account" sort={sort} onSort={setSort}>Account</Th>
                            <Th sortKey="status" sort={sort} onSort={setSort} className="text-center min-w-[80px]">Status</Th>
                            <Th sortKey="reading" sort={sort} onSort={setSort} className="text-right min-w-[110px]">Reading (m³)</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                    No meters found
                                </td>
                            </tr>
                        ) : (
                            sorted.map(row => {
                                const status = getStatus(row);
                                return (
                                    <tr key={row.account} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className={cn(tdBase, "font-semibold")}>
                                            <span className="inline-flex items-center gap-2">
                                                {row.meterName}
                                                {row.isIrr && <StatusChip label="IRR" color="primary" />}
                                            </span>
                                        </td>
                                        <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{row.account}</td>
                                        <td className={cn(tdBase, "text-center")}>
                                            {status === 'active' && <StatusChip label="Active" color="success" />}
                                            {status === 'idle' && <StatusChip label="Idle" color="default" />}
                                            {status === 'no-data' && <StatusChip label="No Data" color="warning" />}
                                        </td>
                                        <td className={cn(tdBase, "text-right tabular-nums font-medium")}>
                                            {row.isNullFlag ? (
                                                <span className="text-amber-500 dark:text-amber-400 text-xs">—</span>
                                            ) : row.rawValue === null ? (
                                                <span className="text-slate-400 dark:text-slate-500">0.00</span>
                                            ) : (
                                                n(row.displayValue)
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {/* Totals */}
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                            <td className={cn(tdBase, "font-bold")} colSpan={3}>Total DC</td>
                            <td className={cn(tdBase, "text-right tabular-nums font-bold")}>
                                {n(total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
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
                {/* Zone summary KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* L2 Bulk */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-200 ease-out group/stat overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200" />
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">L2 Bulk (m³)</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{n(l2GrandTotal)}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 group-hover/stat:scale-110 group-hover/stat:-rotate-3 transition-all duration-200 ease-out flex-shrink-0">
                                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                            </div>
                        </div>
                    </div>
                    {/* ΣL3 */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-200 ease-out group/stat overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-violet-500 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200" />
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">ΣL3 (m³)</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{n(grandTotal)}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 group-hover/stat:scale-110 group-hover/stat:-rotate-3 transition-all duration-200 ease-out flex-shrink-0">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                            </div>
                        </div>
                    </div>
                    {/* Difference */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-200 ease-out group/stat overflow-hidden relative">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200",
                            Math.abs(diffGrandTotal) > 20 ? "bg-red-500" : "bg-emerald-500",
                        )} />
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Difference</p>
                                <h3 className={cn(
                                    "text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight",
                                    Math.abs(diffGrandTotal) > 20 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                                )}>{diffCell(diffGrandTotal)}</h3>
                            </div>
                            <div className={cn(
                                "p-2 sm:p-3 rounded-lg group-hover/stat:scale-110 group-hover/stat:-rotate-3 transition-all duration-200 ease-out flex-shrink-0",
                                Math.abs(diffGrandTotal) > 20 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20",
                            )}>
                                <ArrowUpDown className={cn(
                                    "w-4 h-4 sm:w-5 sm:h-5",
                                    Math.abs(diffGrandTotal) > 20 ? "text-red-500" : "text-emerald-500",
                                )} />
                            </div>
                        </div>
                    </div>
                </div>

                <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />

                {/* Horizontally scrollable table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
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
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                        No meters found
                                    </td>
                                </tr>
                            ) : paginated.map(meter => (
                                <tr
                                    key={meter.account}
                                    className="border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                                >
                                    <td className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900")}>
                                        <span className="inline-flex items-center gap-2">
                                            {meter.building ? (
                                                <>
                                                    <Building2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
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
                                </tr>
                            ))}
                            {/* ΣL3 Footer */}
                            <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                                <td className={cn(tdBase, "font-bold sticky left-0 z-10 bg-slate-50/60 dark:bg-slate-800/20")} colSpan={3}>
                                    ΣL3 Total ({l3Meters.length} meters)
                                </td>
                                {dayTotals.map((t, i) => (
                                    <td key={i} className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}>{n(t)}</td>
                                ))}
                                <td className={cn(tdBase, "text-right tabular-nums font-bold bg-slate-50/80 dark:bg-slate-800/40")}>{n(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
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
                            <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
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
    const defaultMonth = getDefaultMonth();
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedDay, setSelectedDay] = useState(() => getDefaultDay(defaultMonth));
    const [status, setStatus] = useState<ReportStatus>('loading');
    const [monthData, setMonthData] = useState<SupabaseDailyWaterConsumption[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [activeView, setActiveView] = useState<string>(ZONE_BULK_CONFIG[0].zoneName);

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

    // ── Auto-fetch when month changes (includes initial mount) ────────────────
    useEffect(() => {
        setReportData(null);
        fetchMonth(selectedMonth);
    }, [selectedMonth, fetchMonth]);

    // ── Supabase real-time subscription ───────────────────────────────────────
    const { isLive } = useSupabaseRealtime({
        table: 'water_daily_consumption',
        channelName: `water-daily-rt-${selectedMonth}`,
        filter: `month=eq.${selectedMonth}`,
        onChanged: () => fetchMonth(selectedMonth, true),
    });

    // ── Controls bar ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
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

                        {/* Manual refresh */}
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
                            {/* Real-time status */}
                            <span className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                                isLive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                <Radio className={cn("h-3 w-3", isLive && "animate-pulse")} />
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
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-1">
                                    Select Zone
                                </span>
                                {ZONE_BULK_CONFIG.map(z => {
                                    const zr = reportData.zoneRows.find(r => r.zoneName === z.zoneName);
                                    const isActive = z.zoneName === activeView;
                                    const hasHighLoss = zr?.isHighLoss;
                                    const hasNullL2 = zr?.isNullL2;
                                    return (
                                        <button
                                            key={z.zoneName}
                                            onClick={() => setActiveView(z.zoneName)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                                isActive
                                                    ? "bg-primary text-white border-primary shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            {z.zoneName}
                                        </button>
                                    );
                                })}
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                                <button
                                    onClick={() => setActiveView('dc')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all border inline-flex items-center gap-1.5",
                                        activeView === 'dc'
                                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                            : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <Zap className="h-3.5 w-3.5" />
                                    Direct Connections
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Content based on selection ─────────────────────── */}
                    {activeView === 'dc' ? (
                        <DCMetersTable rows={reportData.dcRows} />
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
