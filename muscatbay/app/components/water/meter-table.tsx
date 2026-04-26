"use client";

/**
 * Monthly Zone Analysis Table
 *
 * Hierarchy:
 *   L2 Bulk row  — zone entry meter (purple, pinned top)
 *   L3 rows      — individual meters at zone level
 *                  · Villas / non-building meters  → plain row
 *                  · Building bulk meters (D-44…)  → expandable row
 *                      ↳ L4 child rows (apartments + common, indented)
 *                      ↳ ΣL4 subtotal row
 *                      ↳ Building diff row  (L3 bulk − ΣL4)
 *   ΣL3 footer   — sum of all L3 meters (blue)
 *   Loss row     — L2 − ΣL3, per month + grand total, with status chip
 *
 * DC zone (L1 is present):
 *   L1 row (super-bulk) / individual = L2 zone bulks + DC meters / no expand
 *
 * N/A meters are excluded upstream (page.tsx level filter); nothing extra needed here.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Search, ArrowUpDown, ChevronUp, ChevronDown,
    Droplets, Activity, Home, Building2, TrendingDown, ChevronRight,
} from 'lucide-react';
import { WaterMeter, getConsumption } from '@/lib/water-data';
import { BUILDING_CONFIG, BUILDING_CHILD_METERS } from '@/lib/water-accounts';
import { cn } from '@/lib/utils';
import { CHART_PALETTE } from '@/lib/tokens';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MeterTableProps {
    meters: WaterMeter[];
    months: string[];
    pageSize?: number;
}

// ─── Shared table primitives (mirrors DailyWaterReport style) ─────────────────

const thBase =
    'h-14 px-5 text-left align-middle font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap';
const tdBase =
    'px-5 py-4 align-middle text-sm font-semibold text-slate-700 dark:text-slate-300';

const PALETTE = {
    primary: '#1DA1F2',        // Twitter Blue  — L2 bulk / zone header
    blue:    '#7DD3FC',        // Sky Blue      — ΣL3 total row
    mint:    CHART_PALETTE[5], // sage green    — good / in-balance
    amber:   CHART_PALETTE[2], // amber         — moderate loss
    red:     CHART_PALETTE[3], // coral         — high loss
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
    children: React.ReactNode; sortKey?: string; sort?: SortState;
    onSort?: (s: SortState) => void; className?: string;
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
        success: 'bg-mb-success-light text-mb-success-text ring-mb-success/20',
        danger:  'bg-mb-danger-light text-mb-danger-text ring-mb-danger/20',
        warning: 'bg-mb-warning-light text-mb-warning-text ring-mb-warning/20',
        default: 'bg-slate-100 text-slate-500 ring-slate-500/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20',
        primary: 'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
        info:    'bg-mb-info-light text-mb-info-text ring-mb-info/20',
    };
    return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset', styles[color])}>
            {label}
        </span>
    );
}

function SummaryCard({
    label, value, icon, color, valueColor,
}: {
    label: string; value: string; icon: React.ReactNode;
    color: string; valueColor?: string;
}) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[transform] duration-200 ease-out group/stat">
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
                    className="p-2 sm:p-3 rounded-lg motion-safe:group-hover/stat:scale-110 motion-safe:group-hover/stat:-rotate-3 transition-transform duration-200 ease-out flex-shrink-0"
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

function lossChipColor(pct: number): ChipColor {
    if (pct < 0) return 'info';    // surplus (over-metered)
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
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

    const toggleBuilding = useCallback((account: string) => {
        setExpandedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(account)) next.delete(account); else next.add(account);
            return next;
        });
    }, []);

    // ── Classify meters by level ──────────────────────────────────────────────
    const { bulkMeters, l3Meters, l4Meters, isDC, bulkLabel, indivLabel } = useMemo(() => {
        const l1 = meters.filter(m => m.level === 'L1');
        const l2 = meters.filter(m => m.level === 'L2');
        const l3 = meters.filter(m => m.level === 'L3');
        const l4 = meters.filter(m => m.level === 'L4');
        const dc = meters.filter(m => m.level === 'DC');

        if (l1.length > 0) {
            // DC zone view: L1 = main bulk, L2+DC = distribution
            return {
                bulkMeters: l1,
                l3Meters: [...l2, ...dc],
                l4Meters: [],
                isDC: true,
                bulkLabel: 'Main Bulk (L1)',
                indivLabel: 'Distribution — L2 Zone Bulks + DC',
            };
        }

        // Regular zone view: L2 = zone bulk, L3 = individuals (villas + building bulks)
        return {
            bulkMeters: l2,
            l3Meters: l3,
            l4Meters: l4,
            isDC: false,
            bulkLabel: 'Zone Bulk (L2)',
            indivLabel: 'L3 Individuals — Villas + Building Bulks',
        };
    }, [meters]);

    // ── Building data: for each L3 building bulk, get L4 children + stats ────
    const buildingDataMap = useMemo(() => {
        if (isDC) return new Map<string, BuildingData>();

        const l4ByAccount = new Map(l4Meters.map(m => [m.accountNumber, m]));
        const map = new Map<string, BuildingData>();

        for (const bCfg of BUILDING_CONFIG) {
            // Only include buildings whose L3 bulk meter is present in this zone's data
            const bulkMeter = l3Meters.find(m => m.accountNumber === bCfg.bulkAccount);
            if (!bulkMeter) continue;

            const bulkMonthly = months.map(mo => getConsumption(bulkMeter, mo));
            const bulkTotal = r2(bulkMonthly.reduce((s, v) => s + v, 0));

            const childInfo = BUILDING_CHILD_METERS[bCfg.buildingName] ?? [];
            const children: ChildRow[] = bCfg.l4Accounts.map(acc => {
                const info = childInfo.find(c => c.account === acc);
                const meter = l4ByAccount.get(acc) ?? null;
                const monthlyValues = months.map(mo => (meter ? getConsumption(meter, mo) : 0));
                return {
                    account: acc,
                    label: info?.label ?? acc,
                    type: info?.type ?? 'Apartment',
                    meter,
                    monthlyValues,
                    total: r2(monthlyValues.reduce((s, v) => s + v, 0)),
                };
            });

            const childMonthly = months.map((_, i) =>
                r2(children.reduce((s, c) => s + (c.monthlyValues[i] ?? 0), 0)),
            );
            const childTotal = r2(childMonthly.reduce((s, v) => s + v, 0));
            const diff = r2(bulkTotal - childTotal);
            const diffPct = bulkTotal > 0 ? r2((diff / bulkTotal) * 100) : 0;

            map.set(bCfg.bulkAccount, {
                buildingName: bCfg.buildingName,
                children,
                bulkMonthly,
                bulkTotal,
                childMonthly,
                childTotal,
                diff,
                diffPct,
            });
        }

        return map;
    }, [isDC, l3Meters, l4Meters, months]);

    // ── Zone-level aggregates ─────────────────────────────────────────────────
    const meterTotals = useMemo(() => {
        const map = new Map<string, number>();
        for (const m of meters) {
            map.set(m.accountNumber, r2(months.reduce((s, mo) => s + getConsumption(m, mo), 0)));
        }
        return map;
    }, [meters, months]);

    const bulkMonthly = useMemo(
        () => months.map(mo => r2(bulkMeters.reduce((s, m) => s + getConsumption(m, mo), 0))),
        [bulkMeters, months],
    );
    const bulkTotal = r2(bulkMonthly.reduce((s, v) => s + v, 0));

    // ΣL3 = sum of ALL L3 meters (includes building bulk accounts — NOT L4)
    const indivMonthly = useMemo(
        () => months.map(mo => r2(l3Meters.reduce((s, m) => s + getConsumption(m, mo), 0))),
        [l3Meters, months],
    );
    const indivTotal = r2(indivMonthly.reduce((s, v) => s + v, 0));

    const diffMonthly = bulkMonthly.map((b, i) => r2(b - indivMonthly[i]));
    const diffTotal = r2(bulkTotal - indivTotal);
    const lossPct = bulkTotal > 0 ? r2((diffTotal / bulkTotal) * 100) : 0;

    // ── Filter + sort L3 meters ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        let rows = [...l3Meters];
        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(m =>
                m.label.toLowerCase().includes(q) ||
                m.accountNumber.toLowerCase().includes(q),
            );
        }
        if (sort.dir && sort.key) {
            rows.sort((a, b) => {
                let va: number | string, vb: number | string;
                switch (sort.key) {
                    case 'label':   va = a.label; vb = b.label; break;
                    case 'account': va = a.accountNumber; vb = b.accountNumber; break;
                    case 'total':   va = meterTotals.get(a.accountNumber) ?? 0; vb = meterTotals.get(b.accountNumber) ?? 0; break;
                    default:
                        va = months.includes(sort.key) ? getConsumption(a, sort.key) : 0;
                        vb = months.includes(sort.key) ? getConsumption(b, sort.key) : 0;
                }
                const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return rows;
    }, [l3Meters, search, sort, meterTotals, months]);

    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const colSpan = 3 + months.length + 1;

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
                    {filtered.length} L3 meter{filtered.length !== 1 ? 's' : ''}
                    {!isDC && buildingDataMap.size > 0 && ` · ${buildingDataMap.size} building${buildingDataMap.size !== 1 ? 's' : ''} expandable`}
                </span>
            </div>

            {/* ── Mobile summary cards ──────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
                {bulkMeters.map(bulk => (
                    <div key={bulk.accountNumber} className="rounded-xl border-2 p-4 shadow-sm space-y-2"
                        style={{ borderColor: `${PALETTE.primary}40`, backgroundColor: `${PALETTE.primary}0D` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold" style={{ color: PALETTE.primary }}>
                                <Droplets className="inline h-3.5 w-3.5 mr-1" />{bulk.label || bulk.accountNumber}
                            </span>
                            <StatusChip label={bulk.level === 'L1' ? 'L1' : 'L2 BULK'} color="primary" />
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
                            <span className="font-mono font-bold text-sm" style={{ color: PALETTE.primary }}>{fmt(meterTotals.get(bulk.accountNumber) ?? 0)} m³</span>
                        </div>
                    </div>
                ))}
                {paginated.map(meter => {
                    const total = meterTotals.get(meter.accountNumber) ?? 0;
                    const bData = buildingDataMap.get(meter.accountNumber);
                    const isExpanded = expandedBuildings.has(meter.accountNumber);
                    return (
                        <div key={meter.accountNumber} className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex items-center gap-2">
                                    {bData
                                        ? <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        : <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{meter.label || meter.accountNumber}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <StatusChip label={meter.level} color="default" />
                                    {bData && (
                                        <button
                                            onClick={() => toggleBuilding(meter.accountNumber)}
                                            className="text-xs font-medium text-secondary underline"
                                        >
                                            {isExpanded ? 'Collapse' : 'Expand'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">{meter.accountNumber}</p>
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
                            {bData && isExpanded && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Child Meters ({bData.buildingName})</p>
                                    {bData.children.map(c => (
                                        <div key={c.account} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <span className="text-slate-600 dark:text-slate-300 truncate">{c.label}</span>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <StatusChip label={c.type} color={c.type === 'Common' ? 'info' : 'default'} />
                                                <span className="font-mono font-medium">{fmt(c.total)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-xs px-2 py-1 rounded-lg font-semibold"
                                        style={{ backgroundColor: bData.diff > 0 ? `${PALETTE.red}10` : `${PALETTE.mint}20`, color: bData.diff > 0 ? PALETTE.red : PALETTE.mint }}>
                                        <span>Building Diff (L3 − ΣL4)</span>
                                        <div className="flex items-center gap-2">
                                            <StatusChip label={`${Math.abs(bData.diffPct).toFixed(1)}%`} color={lossChipColor(bData.diffPct)} />
                                            <span className="font-mono">{diffLabel(bData.diff)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Zone summary footer card */}
                {l3Meters.length > 0 && (
                    <div className="rounded-xl border-2 p-4 space-y-3"
                        style={{ borderColor: diffTotal > 0 ? `${PALETTE.red}40` : `${PALETTE.mint}60`, backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}14` }}>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Zone Monthly Summary</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">L2 Bulk</p>
                                <p className="font-mono font-bold text-sm mt-0.5" style={{ color: PALETTE.primary }}>{fmt(bulkTotal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">ΣL3</p>
                                <p className="font-mono font-bold text-sm mt-0.5" style={{ color: PALETTE.blue }}>{fmt(indivTotal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Diff</p>
                                <p className="font-mono font-bold text-sm mt-0.5" style={{ color: diffTotal > 0 ? PALETTE.red : PALETTE.mint }}>{diffLabel(diffTotal)}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <StatusChip label={`${lossPct.toFixed(1)}% zone loss`} color={lossChipColor(lossPct)} />
                            <StatusChip label={lossLabel(lossPct)} color={lossChipColor(lossPct)} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Desktop table ─────────────────────────────────────────────── */}
            <div className="hidden md:block relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                <table
                    className="w-full border-collapse"
                    style={{ minWidth: `${340 + months.length * 100}px` }}
                >
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <Th sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[200px]">
                                Meter
                            </Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[110px]">Account</Th>
                            <th className={cn(thBase, 'text-center min-w-[90px]')}>Level</th>
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
                        {/* ── L2 / L1 Bulk row ──────────────────────────────── */}
                        {bulkMeters.map(bulk => {
                            const bTotal = meterTotals.get(bulk.accountNumber) ?? 0;
                            return (
                                <tr key={bulk.accountNumber} className="border-b-2"
                                    style={{ backgroundColor: `${PALETTE.primary}14`, borderBottomColor: `${PALETTE.primary}40` }}>
                                    <td
                                        className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                        style={{ backgroundColor: `${PALETTE.primary}14`, color: PALETTE.primary, boxShadow: `inset 4px 0 0 ${PALETTE.primary}` }}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Droplets className="h-3.5 w-3.5 shrink-0" />
                                            {bulk.label || bulk.accountNumber}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, 'font-mono text-[11px]')} style={{ color: `${PALETTE.primary}AA` }}>
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
                                                {v > 0 ? fmt(v) : <span className="text-slate-300 dark:text-slate-600">—</span>}
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

                        {/* ── L3 individual rows + building expand ──────────── */}
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                    No meters found
                                </td>
                            </tr>
                        ) : paginated.flatMap((meter, idx) => {
                            const total = meterTotals.get(meter.accountNumber) ?? 0;
                            const bData = buildingDataMap.get(meter.accountNumber);
                            const isExpanded = expandedBuildings.has(meter.accountNumber);
                            const rows: React.ReactNode[] = [];

                            // L3 meter row
                            rows.push(
                                <tr
                                    key={meter.accountNumber}
                                    className={cn(
                                        'border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30',
                                        !isExpanded && idx % 2 !== 0 && 'bg-slate-50/40 dark:bg-slate-800/20',
                                    )}
                                >
                                    <td className={cn(tdBase, 'font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900')}>
                                        <span className="inline-flex items-center gap-2">
                                            {bData ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleBuilding(meter.accountNumber)}
                                                    aria-expanded={isExpanded}
                                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${bData.buildingName}`}
                                                    className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    style={{ color: PALETTE.primary }}
                                                >
                                                    {isExpanded
                                                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                                        : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="font-bold">{bData.buildingName}</span>
                                                </button>
                                            ) : (
                                                <>
                                                    <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {meter.label || meter.accountNumber}
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, 'font-mono text-[11px] text-slate-400 dark:text-slate-500')}>
                                        {meter.accountNumber}
                                    </td>
                                    <td className={cn(tdBase, 'text-center')}>
                                        {bData
                                            ? <StatusChip label="Building Bulk" color="primary" />
                                            : <StatusChip label={meter.level} color="default" />}
                                    </td>
                                    {months.map(mo => {
                                        const v = getConsumption(meter, mo);
                                        return (
                                            <td key={mo} className={cn(tdBase, 'text-right tabular-nums text-[12px]')}>
                                                {v > 0 ? fmt(v) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                        );
                                    })}
                                    <td className={cn(tdBase, 'text-right tabular-nums font-bold bg-slate-50/80 dark:bg-slate-800/40')}>
                                        {fmt(total)}
                                    </td>
                                </tr>,
                            );

                            // Building expand rows
                            if (bData && isExpanded) {
                                // Sort: apartments first, common last
                                const sortedChildren = [...bData.children].sort((a, b) => {
                                    if (a.type === 'Common' && b.type !== 'Common') return 1;
                                    if (a.type !== 'Common' && b.type === 'Common') return -1;
                                    return 0;
                                });

                                // Child meter rows (L4)
                                sortedChildren.forEach(child => {
                                    rows.push(
                                        <tr key={`${meter.accountNumber}-${child.account}`}
                                            style={{ backgroundColor: `${PALETTE.primary}06` }}>
                                            <td
                                                className={cn(tdBase, 'sticky left-0 z-10 pl-12 font-medium text-slate-500 dark:text-slate-400')}
                                                style={{ backgroundColor: `${PALETTE.primary}06` }}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    {/* Tree connector */}
                                                    <span className="shrink-0 w-4 h-4 border-b-2 border-l-2 border-slate-200 dark:border-slate-700 rounded-bl" aria-hidden="true" />
                                                    {child.label}
                                                </span>
                                            </td>
                                            <td className={cn(tdBase, 'font-mono text-[11px] text-slate-400')}>
                                                {child.account}
                                            </td>
                                            <td className={cn(tdBase, 'text-center')}>
                                                <StatusChip label={child.type} color={child.type === 'Common' ? 'info' : 'default'} />
                                            </td>
                                            {child.monthlyValues.map((v, i) => (
                                                <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] text-slate-500 dark:text-slate-400')}>
                                                    {v > 0 ? fmt(v) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </td>
                                            ))}
                                            <td className={cn(tdBase, 'text-right tabular-nums text-slate-500 dark:text-slate-400')}>
                                                {fmt(child.total)}
                                            </td>
                                        </tr>,
                                    );
                                });

                                // ΣL4 subtotal row
                                rows.push(
                                    <tr key={`${meter.accountNumber}-sigma`}
                                        style={{ backgroundColor: `${PALETTE.blue}0A` }}>
                                        <td
                                            className={cn(tdBase, 'sticky left-0 z-10 pl-12 font-bold')}
                                            style={{ backgroundColor: `${PALETTE.blue}0A`, color: PALETTE.blue, boxShadow: `inset 3px 0 0 ${PALETTE.blue}` }}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                <Activity className="h-3 w-3 shrink-0" />
                                                Σ Child Meters ({bData.children.length})
                                            </span>
                                        </td>
                                        <td className={cn(tdBase, 'text-slate-400 text-[11px]')} colSpan={2} />
                                        {bData.childMonthly.map((v, i) => (
                                            <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-bold')}
                                                style={{ color: PALETTE.blue }}>
                                                {fmt(v)}
                                            </td>
                                        ))}
                                        <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                            style={{ color: PALETTE.blue, backgroundColor: `${PALETTE.blue}14` }}>
                                            {fmt(bData.childTotal)}
                                        </td>
                                    </tr>,
                                );

                                // Building diff row (L3 bulk − ΣL4)
                                rows.push(
                                    <tr key={`${meter.accountNumber}-diff`}
                                        style={{ backgroundColor: bData.diff > 0 ? `${PALETTE.red}07` : `${PALETTE.mint}12` }}>
                                        <td
                                            className={cn(tdBase, 'sticky left-0 z-10 pl-12 font-bold')}
                                            style={{
                                                backgroundColor: bData.diff > 0 ? `${PALETTE.red}07` : `${PALETTE.mint}12`,
                                                color: bData.diff > 0 ? PALETTE.red : PALETTE.mint,
                                                boxShadow: `inset 3px 0 0 ${bData.diff > 0 ? PALETTE.red : PALETTE.mint}`,
                                            }}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                Building Diff (L3 − ΣL4)
                                                <StatusChip label={`${Math.abs(bData.diffPct).toFixed(1)}%`} color={lossChipColor(bData.diffPct)} />
                                            </span>
                                        </td>
                                        <td className={cn(tdBase)} colSpan={2}>
                                            <StatusChip label={lossLabel(bData.diffPct)} color={lossChipColor(bData.diffPct)} />
                                        </td>
                                        {bData.bulkMonthly.map((bulkV, i) => {
                                            const d = r2(bulkV - (bData.childMonthly[i] ?? 0));
                                            return (
                                                <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-semibold')}
                                                    style={{ color: d > 0 ? PALETTE.red : d < 0 ? PALETTE.mint : 'var(--chart-axis)' }}>
                                                    {diffLabel(d)}
                                                </td>
                                            );
                                        })}
                                        <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                            style={{
                                                backgroundColor: bData.diff > 0 ? `${PALETTE.red}14` : `${PALETTE.mint}25`,
                                                color: bData.diff > 0 ? PALETTE.red : PALETTE.mint,
                                            }}>
                                            {diffLabel(bData.diff)}
                                        </td>
                                    </tr>,
                                );
                            }

                            return rows;
                        })}

                        {/* ── ΣL3 footer row ───────────────────────────────── */}
                        {l3Meters.length > 0 && (
                            <tr className="border-t-2 border-slate-200 dark:border-slate-700"
                                style={{ backgroundColor: `${PALETTE.blue}0E` }}>
                                <td
                                    className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                    style={{ backgroundColor: `${PALETTE.blue}0E`, color: PALETTE.blue, boxShadow: `inset 4px 0 0 ${PALETTE.blue}` }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Activity className="h-3.5 w-3.5 shrink-0" />
                                        ΣL3 Total — Villas + Building Bulks
                                    </span>
                                </td>
                                <td className={cn(tdBase, 'text-slate-400 text-[11px]')} colSpan={2}>
                                    {l3Meters.length} meters
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

                        {/* ── Zone Loss / Diff row (L2 − ΣL3) ─────────────── */}
                        {bulkMeters.length > 0 && l3Meters.length > 0 && (
                            <tr style={{ backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}18` }}>
                                <td
                                    className={cn(tdBase, 'font-bold sticky left-0 z-10')}
                                    style={{
                                        backgroundColor: diffTotal > 0 ? `${PALETTE.red}08` : `${PALETTE.mint}18`,
                                        color: diffTotal > 0 ? PALETTE.red : PALETTE.mint,
                                        boxShadow: `inset 4px 0 0 ${diffTotal > 0 ? PALETTE.red : PALETTE.mint}`,
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        Zone Diff (L2 − ΣL3)
                                        <StatusChip label={`${lossPct.toFixed(1)}%`} color={lossChipColor(lossPct)} />
                                    </span>
                                </td>
                                <td className={cn(tdBase)} colSpan={2}>
                                    <StatusChip label={lossLabel(lossPct)} color={lossChipColor(lossPct)} />
                                </td>
                                {diffMonthly.map((v, i) => (
                                    <td key={i} className={cn(tdBase, 'text-right tabular-nums text-[12px] font-semibold')}
                                        style={{ color: v > 0 ? PALETTE.red : v < 0 ? PALETTE.mint : 'var(--chart-axis)' }}>
                                        {diffLabel(v)}
                                    </td>
                                ))}
                                <td className={cn(tdBase, 'text-right tabular-nums font-bold')}
                                    style={{
                                        backgroundColor: diffTotal > 0 ? `${PALETTE.red}18` : `${PALETTE.mint}30`,
                                        color: diffTotal > 0 ? PALETTE.red : PALETTE.mint,
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
                        >Prev</button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5) {
                                if (page <= 3) p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                            }
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all',
                                        p === page ? 'bg-primary text-white shadow-sm dark:bg-secondary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                                    )}>
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            className="h-8 px-3 text-[12px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >Next</button>
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

// ─── Local types ──────────────────────────────────────────────────────────────

interface ChildRow {
    account: string;
    label: string;
    type: 'Apartment' | 'Common';
    meter: WaterMeter | null;
    monthlyValues: number[];
    total: number;
}

interface BuildingData {
    buildingName: string;
    children: ChildRow[];
    bulkMonthly: number[];
    bulkTotal: number;
    childMonthly: number[];
    childTotal: number;
    diff: number;
    diffPct: number;
}
