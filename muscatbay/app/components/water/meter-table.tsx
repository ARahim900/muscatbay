"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ArrowUpDown, ChevronUp, ChevronDown,
    Droplets, Activity, Home, Building2, TrendingDown,
} from 'lucide-react';
import { WaterMeter, getConsumption } from '@/lib/water-data';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MeterTableProps {
    meters: WaterMeter[];
    months: string[];
    pageSize?: number;
}

// ─── Shared table primitives (mirrors DailyWaterReport style) ─────────────────

const thBase =
    'h-14 px-5 text-left align-middle font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap';
const tdBase = 'px-5 py-4 align-middle text-sm font-semibold text-slate-700 dark:text-slate-300';

// Brand palette — matches DailyWaterReport exactly
const PALETTE = {
    primary: '#4E4456', // dark purple  — L2 bulk / zone header
    blue:    '#337FCA', // blue         — ΣL3 total row
    mint:    '#A4DCC6', // mint green   — good / in-balance
    amber:   '#F4C741', // amber        — moderate loss warning
    red:     '#E05050', // red          — high loss
} as const;

// ─── Sort state ───────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null;
interface SortState { key: string; dir: SortDir }

function nextSort(curr: SortState, key: string): SortState {
    if (curr.key !== key) return { key, dir: 'asc' };
    if (curr.dir === 'asc') return { key, dir: 'desc' };
    return { key: '', dir: null };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active || !dir) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return dir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 text-secondary" />
        : <ChevronDown className="h-3.5 w-3.5 text-secondary" />;
}

function Th({
    children, sortKey, sort, onSort, className,
}: {
    children: React.ReactNode;
    sortKey?: string;
    sort?: SortState;
    onSort?: (s: SortState) => void;
    className?: string;
}) {
    const sortable = sortKey && sort && onSort;
    return (
        <th
            className={cn(
                thBase,
                sortable && 'cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
                className,
            )}
            onClick={sortable ? () => onSort(nextSort(sort, sortKey)) : undefined}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                {sortable && <SortIcon active={sort.key === sortKey} dir={sort.key === sortKey ? sort.dir : null} />}
            </span>
        </th>
    );
}

type ChipColor = 'success' | 'danger' | 'warning' | 'default' | 'primary' | 'info';
function StatusChip({ label, color }: { label: string; color: ChipColor }) {
    const styles: Record<ChipColor, string> = {
        success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        danger:  'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
        warning: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        default: 'bg-slate-100 text-slate-500 ring-slate-500/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20',
        primary: 'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
        info:    'bg-blue-50 text-blue-600 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    };
    return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset', styles[color])}>
            {label}
        </span>
    );
}

// KPI summary card — mirrors HierarchyStatCard from DailyWaterReport
function SummaryCard({
    label, value, icon, color, valueColor,
}: {
    label: string; value: string; icon: React.ReactNode;
    color: string; valueColor?: string;
}) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 ease-out group/stat">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">{label}</p>
                    <h3
                        className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100"
                        style={valueColor ? { color: valueColor } : undefined}
                    >
                        {value}
                    </h3>
                </div>
                <div
                    className="p-2 sm:p-3 rounded-lg group-hover/stat:scale-110 group-hover/stat:-rotate-3 transition-all duration-200 ease-out flex-shrink-0"
                    style={{ backgroundColor: `${color}1A`, color }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const r2 = (v: number) => Math.round(v * 100) / 100;

function fmt(v: number | null, fallback = '—'): string {
    if (v === null) return fallback;
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diffLabel(diff: number | null): string {
    if (diff === null) return '—';
    if (diff === 0) return '0.00';
    const f = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (diff > 0 ? '+' : '−') + f;
}

function lossColor(pct: number): ChipColor {
    if (pct < 10) return 'success';
    if (pct < 20) return 'warning';
    return 'danger';
}

function lossLabel(pct: number): string {
    if (pct < 0) return 'Surplus';
    if (pct < 10) return 'On Track';
    if (pct < 20) return 'Warning';
    return 'High Loss';
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MeterTable({ meters, months, pageSize = 15 }: MeterTableProps) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);

    // Classify meters into bulk (L1 or L2) vs individual (L2+DC or L3+L4)
    const { bulkMeters, individualMeters, bulkLabel, indivLabel } = useMemo(() => {
        const hasL1 = meters.some(m => m.level === 'L1');
        if (hasL1) {
            // DC zone: L1 is the super-bulk; L2 + DC are individual distribution meters
            return {
                bulkMeters:      meters.filter(m => m.level === 'L1'),
                individualMeters: meters.filter(m => m.level === 'L2' || m.level === 'DC'),
                bulkLabel:       'Main Bulk (L1)',
                indivLabel:      'Distribution (L2 + DC)',
            };
        }
        // Regular zone: L2 is the zone bulk; L3/L4 are individual consumers
        return {
            bulkMeters:      meters.filter(m => m.level === 'L2'),
            individualMeters: meters.filter(m => m.level === 'L3' || m.level === 'L4'),
            bulkLabel:       'Zone Bulk (L2)',
            indivLabel:      'Individual Meters (L3)',
        };
    }, [meters]);

    // Per-meter total across all selected months
    const meterTotals = useMemo(() => {
        const map = new Map<string, number>();
        for (const m of meters) {
            map.set(m.accountNumber, r2(months.reduce((s, mo) => s + getConsumption(m, mo), 0)));
        }
        return map;
    }, [meters, months]);

    // Bulk per-month aggregates
    const bulkMonthly = useMemo(
        () => months.map(mo => r2(bulkMeters.reduce((s, m) => s + getConsumption(m, mo), 0))),
        [bulkMeters, months],
    );
    const bulkTotal = r2(bulkMonthly.reduce((s, v) => s + v, 0));

    // Individual per-month aggregates
    const indivMonthly = useMemo(
        () => months.map(mo => r2(individualMeters.reduce((s, m) => s + getConsumption(m, mo), 0))),
        [individualMeters, months],
    );
    const indivTotal = r2(indivMonthly.reduce((s, v) => s + v, 0));

    // Per-month diff and grand diff
    const diffMonthly = bulkMonthly.map((b, i) => r2(b - indivMonthly[i]));
    const diffTotal   = r2(bulkTotal - indivTotal);
    const lossPct     = bulkTotal > 0 ? r2((diffTotal / bulkTotal) * 100) : 0;

    // Filter + sort individual meters
    const filtered = useMemo(() => {
        let rows = [...individualMeters];
        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(m =>
                m.label.toLowerCase().includes(q) ||
                m.accountNumber.toLowerCase().includes(q) ||
                m.zone.toLowerCase().includes(q),
            );
        }
        if (sort.dir && sort.key) {
            rows.sort((a, b) => {
                let va: number | string, vb: number | string;
                switch (sort.key) {
                    case 'label':   va = a.label; vb = b.label; break;
                    case 'account': va = a.accountNumber; vb = b.accountNumber; break;
                    case 'total':   va = meterTotals.get(a.accountNumber) ?? 0; vb = meterTotals.get(b.accountNumber) ?? 0; break;
                    default:        va = months.includes(sort.key) ? getConsumption(a, sort.key) : 0;
                                    vb = months.includes(sort.key) ? getConsumption(b, sort.key) : 0;
                }
                const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return rows;
    }, [individualMeters, search, sort, meterTotals, months]);

    // Reset to page 1 when filter/sort changes
    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const colSpan = 3 + months.length + 1; // Meter + Account + Level + months + Total

    // ── Mobile card view ─────────────────────────────────────────────────────
    const MobileCards = () => (
        <div className="md:hidden space-y-3 mt-4">
            {/* Bulk row card */}
            {bulkMeters.map(bulk => {
                const bTotal = meterTotals.get(bulk.accountNumber) ?? 0;
                return (
                    <div key={bulk.accountNumber} className="rounded-xl border-2 p-4 shadow-sm space-y-2"
                        style={{ borderColor: `${PALETTE.primary}40`, backgroundColor: `${PALETTE.primary}0D` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold" style={{ color: PALETTE.primary }}>
                                <Droplets className="inline h-3.5 w-3.5 mr-1" />{bulk.label || bulk.accountNumber}
                            </span>
                            <StatusChip label="L2 BULK" color="primary" />
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">{bulk.accountNumber}</p>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {months.map(mo => {
                                const v = getConsumption(bulk, mo);
                                return (
                                    <div key={mo} className="text-xs space-y-0.5">
                                        <span className="text-slate-400">{mo}</span>
                                        <p className="font-mono font-bold" style={{ color: PALETTE.primary }}>{v > 0 ? fmt(v) : '—'}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500">Monthly Total</span>
                            <span className="font-mono font-bold text-sm" style={{ color: PALETTE.primary }}>{fmt(bTotal)} m³</span>
                        </div>
                    </div>
                );
            })}

            {/* Individual meter cards (paginated) */}
            {paginated.map(meter => {
                const total = meterTotals.get(meter.accountNumber) ?? 0;
                const isBuilding = meter.level === 'L3' && meter.type.toLowerCase().includes('building');
                return (
                    <div key={meter.accountNumber} className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                                    {isBuilding ? <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                    {meter.label || meter.accountNumber}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{meter.accountNumber}</p>
                            </div>
                            <StatusChip label={meter.level} color="default" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {months.map(mo => {
                                const v = getConsumption(meter, mo);
                                return (
                                    <div key={mo} className="text-xs space-y-0.5">
                                        <span className="text-slate-400">{mo}</span>
                                        <p className="font-mono font-medium text-slate-700 dark:text-slate-300">{v > 0 ? fmt(v) : '—'}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500">Total</span>
                            <span className="font-mono font-bold text-sm">{fmt(total)} m³</span>
                        </div>
                    </div>
                );
            })}

            {/* ΣL3 + Loss summary card */}
            {individualMeters.length > 0 && (
                <div className="rounded-xl border-2 p-4 space-y-3"
                    style={{ borderColor: diffTotal > 0 ? `${PALETTE.red}40` : `${PALETTE.mint}60`, backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}14` }}>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Monthly Summary</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{bulkLabel}</p>
                            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: PALETTE.primary }}>{fmt(bulkTotal)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Σ Individuals</p>
                            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: PALETTE.blue }}>{fmt(indivTotal)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Loss / Diff</p>
                            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: diffTotal > 0 ? PALETTE.red : '#10b981' }}>{diffLabel(diffTotal)}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <StatusChip label={`${lossPct.toFixed(1)}% loss`} color={lossColor(lossPct)} />
                        <StatusChip label={lossLabel(lossPct)} color={lossColor(lossPct)} />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* ── KPI summary cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <SummaryCard
                    label={bulkLabel}
                    value={`${fmt(bulkTotal)} m³`}
                    icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />}
                    color={PALETTE.primary}
                />
                <SummaryCard
                    label={indivLabel}
                    value={`${fmt(indivTotal)} m³`}
                    icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                    color={PALETTE.blue}
                />
                <SummaryCard
                    label={`Loss / Diff (${lossPct.toFixed(1)}%)`}
                    value={`${diffLabel(diffTotal)} m³`}
                    icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                    color={diffTotal > 0 && lossPct >= 10 ? PALETTE.red : PALETTE.mint}
                    valueColor={diffTotal > 0 && lossPct >= 10 ? PALETTE.red : undefined}
                />
            </div>

            {/* ── Search + count ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search meter or account…"
                        className="h-9 w-full sm:w-64 pl-9 pr-8 text-[13px] rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center"
                        >
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">&times;</span>
                        </button>
                    )}
                </div>
                <span className="text-[12px] text-slate-400 dark:text-slate-500 tabular-nums">
                    {filtered.length} meter{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Mobile view ───────────────────────────────────────────────── */}
            <MobileCards />

            {/* ── Desktop table ─────────────────────────────────────────────── */}
            <div className="hidden md:block relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                <table
                    className="w-full border-collapse"
                    style={{ minWidth: `${320 + months.length * 100}px` }}
                >
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <Th sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[180px]">
                                Meter
                            </Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[110px]">
                                Account
                            </Th>
                            <th className={cn(thBase, 'text-center min-w-[80px]')}>Level</th>
                            {months.map(mo => (
                                <Th key={mo} sortKey={mo} sort={sort} onSort={setSort} className="text-right min-w-[96px]">
                                    {mo}
                                </Th>
                            ))}
                            <Th sortKey="total" sort={sort} onSort={setSort}
                                className="text-right min-w-[100px] bg-slate-50/80 dark:bg-slate-800/40">
                                Total m³
                            </Th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* ── Bulk header rows (L2 or L1) ───────────────────── */}
                        {bulkMeters.map(bulk => {
                            const bTotal = meterTotals.get(bulk.accountNumber) ?? 0;
                            return (
                                <tr
                                    key={bulk.accountNumber}
                                    className="border-b-2"
                                    style={{
                                        backgroundColor: `${PALETTE.primary}14`,
                                        borderBottomColor: `${PALETTE.primary}40`,
                                    }}
                                >
                                    <td
                                        className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                        style={{
                                            backgroundColor: `${PALETTE.primary}14`,
                                            color: PALETTE.primary,
                                            boxShadow: `inset 4px 0 0 ${PALETTE.primary}`,
                                        }}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Droplets className="h-3.5 w-3.5 shrink-0" />
                                            {bulk.label || bulk.accountNumber}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, 'font-mono text-[11px]')}
                                        style={{ color: `${PALETTE.primary}AA` }}>
                                        {bulk.accountNumber}
                                    </td>
                                    <td className={cn(tdBase, 'text-center')}>
                                        <StatusChip label={bulk.level === 'L1' ? 'L1 BULK' : 'L2 BULK'} color="primary" />
                                    </td>
                                    {months.map(mo => {
                                        const v = getConsumption(bulk, mo);
                                        return (
                                            <td key={mo} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-bold')}
                                                style={{ color: PALETTE.primary }}>
                                                {v > 0
                                                    ? fmt(v)
                                                    : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                        );
                                    })}
                                    <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                        style={{ backgroundColor: `${PALETTE.primary}20`, color: PALETTE.primary }}>
                                        {fmt(bTotal)}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* ── Individual meter rows (paginated / filtered) ───── */}
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                    No meters found
                                </td>
                            </tr>
                        ) : paginated.map((meter, idx) => {
                            const total = meterTotals.get(meter.accountNumber) ?? 0;
                            const isBuilding = meter.type?.toLowerCase().includes('building');
                            return (
                                <tr
                                    key={meter.accountNumber}
                                    className={cn(
                                        'border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30',
                                        idx % 2 !== 0 && 'bg-slate-50/40 dark:bg-slate-800/20',
                                    )}
                                >
                                    <td className={cn(tdBase, 'font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900')}>
                                        <span className="inline-flex items-center gap-2">
                                            {isBuilding
                                                ? <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                : <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                            {meter.label || meter.accountNumber}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, 'font-mono text-[11px] text-slate-400 dark:text-slate-500')}>
                                        {meter.accountNumber}
                                    </td>
                                    <td className={cn(tdBase, 'text-center')}>
                                        <StatusChip
                                            label={meter.level}
                                            color={meter.level === 'DC' ? 'warning' : 'default'}
                                        />
                                    </td>
                                    {months.map(mo => {
                                        const v = getConsumption(meter, mo);
                                        return (
                                            <td key={mo} className={cn(tdBase, 'text-right tabular-nums text-[12px]')}>
                                                {v > 0
                                                    ? fmt(v)
                                                    : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                        );
                                    })}
                                    <td className={cn(tdBase, 'text-right tabular-nums font-bold bg-slate-50/80 dark:bg-slate-800/40')}>
                                        {fmt(total)}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* ── ΣL3 / ΣDistribution footer ────────────────────── */}
                        {individualMeters.length > 0 && (
                            <tr
                                className="border-t-2 border-slate-200 dark:border-slate-700"
                                style={{ backgroundColor: `${PALETTE.blue}0E` }}
                            >
                                <td
                                    className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                    style={{
                                        backgroundColor: `${PALETTE.blue}0E`,
                                        color: PALETTE.blue,
                                        boxShadow: `inset 4px 0 0 ${PALETTE.blue}`,
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Activity className="h-3.5 w-3.5 shrink-0" />
                                        Σ Individuals Total
                                    </span>
                                </td>
                                <td className={cn(tdBase, 'text-slate-400 text-[11px]')} colSpan={2}>
                                    {individualMeters.length} meters
                                </td>
                                {indivMonthly.map((v, i) => (
                                    <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-bold')}
                                        style={{ color: PALETTE.blue }}>
                                        {fmt(v)}
                                    </td>
                                ))}
                                <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                    style={{ backgroundColor: `${PALETTE.blue}20`, color: PALETTE.blue }}>
                                    {fmt(indivTotal)}
                                </td>
                            </tr>
                        )}

                        {/* ── Diff / Loss row ───────────────────────────────── */}
                        {bulkMeters.length > 0 && individualMeters.length > 0 && (
                            <tr style={{
                                backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}18`,
                            }}>
                                <td
                                    className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                    style={{
                                        backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}18`,
                                        color: diffTotal > 0 ? PALETTE.red : '#10b981',
                                        boxShadow: `inset 4px 0 0 ${diffTotal > 0 ? PALETTE.red : PALETTE.mint}`,
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        Diff (Bulk − Σ Individuals)
                                        <StatusChip label={`${lossPct.toFixed(1)}%`} color={lossColor(lossPct)} />
                                    </span>
                                </td>
                                <td className={cn(tdBase)} colSpan={2}>
                                    <StatusChip label={lossLabel(lossPct)} color={lossColor(lossPct)} />
                                </td>
                                {diffMonthly.map((v, i) => (
                                    <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-semibold')}
                                        style={{ color: v > 0 ? PALETTE.red : v < 0 ? '#10b981' : '#64748b' }}>
                                        {diffLabel(v)}
                                    </td>
                                ))}
                                <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                    style={{
                                        backgroundColor: diffTotal > 0 ? `${PALETTE.red}18` : `${PALETTE.mint}30`,
                                        color: diffTotal > 0 ? PALETTE.red : '#10b981',
                                    }}>
                                    {diffLabel(diffTotal)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {filtered.length > rowsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            className="h-8 px-3 text-[12px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Prev
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5) {
                                if (page <= 3) p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all',
                                        p === page
                                            ? 'bg-primary text-white shadow-sm dark:bg-secondary dark:text-white'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            className="h-8 px-3 text-[12px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                    <label className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
                        Rows
                        <select
                            value={rowsPerPage}
                            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-transparent text-[12px] px-2 focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer"
                        >
                            {[5, 10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}
