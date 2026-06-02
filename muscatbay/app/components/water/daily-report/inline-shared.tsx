"use client";

// ─── Shared helpers, primitives, types extracted verbatim from
//     DailyWaterReport.tsx to keep the main file under ~1000 LOC.
// ─── This module preserves the ORIGINAL inline palette + behavior exactly.
//     The sibling files (report-types.ts, report-primitives.tsx, zone-panel.tsx,
//     dc-panel.tsx, zone-analytics.tsx) contain an enhanced parallel
//     implementation that is intentionally NOT used here — swapping to those
//     would alter behavior (different chart palette tokens, toggleable legend,
//     different layout). Do not consolidate without explicit design review.

import { ArrowUpDown, ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHART_PALETTE } from "@/lib/tokens";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, NULL_AS_ZERO_ACCOUNTS,
    BUILDING_CHILD_METERS,
} from "@/lib/water-accounts";

// ─── Chart color constants (CSS variable-backed) ────────────────────────────

export const CHART_COLORS = {
    loss: 'var(--chart-loss)',
    success: 'var(--chart-success)',
    teal: 'var(--chart-teal)',
    brand: 'var(--chart-brand)',
    amber: 'var(--chart-amber)',
    gray: 'var(--chart-gray)',
} as const;

// ─── Unified brand palette (Muscat Bay) ──────────────────────────────────────

export const PALETTE = {
    primary: CHART_PALETTE[0], // brand purple  — bulk headers, emphasis
    neutral: CHART_PALETTE[1], // teal-gray     — subtle row fills
    mint:    CHART_PALETTE[5], // sage green    — OK / in-balance / sum totals
    blue:    CHART_PALETTE[4], // soft blue     — informational / secondary rollups
    amber:   CHART_PALETTE[2], // amber         — mid-magnitude difference warnings
    red:     CHART_PALETTE[3], // coral         — high-loss / out-of-tolerance
} as const;

// ─── Computed row types ───────────────────────────────────────────────────────

export interface ZoneRow {
    zoneName: string;
    l2Account: string;
    l2Value: number | null;
    l3Sum: number;
    diff: number | null;
    isNullL2: boolean;
    isHighLoss: boolean;
}

export interface ChildMeterReading {
    label: string;
    account: string;
    type: 'Apartment' | 'Common';
    value: number | null;
}

export interface BuildingRow {
    buildingName: string;
    zone: '3A' | '3B';
    bulkAccount: string;
    l3Bulk: number | null;
    l4Sum: number;
    diff: number | null;
    hasNonZeroDiff: boolean;
    childMeters: ChildMeterReading[];
}

export interface DCRow {
    meterName: string;
    account: string;
    isIrr: boolean;
    rawValue: number | null;
    /** The value displayed — 0 for null-as-zero, null for truly missing non-irr meters */
    displayValue: number | null;
    isNullFlag: boolean;
}

export interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    dcTotal: number;
    grandTotal: number;
}

export type ReportStatus = 'loading' | 'success' | 'error' | 'empty';

// ─── Data processing ──────────────────────────────────────────────────────────

/** Round to 2 decimal places */
export const r2 = (v: number) => Math.round(v * 100) / 100;

export function processReport(readings: Record<string, number | null>): ReportData {
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

// ─── Number formatters ────────────────────────────────────────────────────────

export function n(v: number | null, fallback = '—'): string {
    if (v === null) return fallback;
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function diffCell(diff: number | null): string {
    if (diff === null) return '—';
    if (diff === 0) return '0.00';
    const formatted = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (diff > 0 ? '+' : '-') + formatted;
}

// ─── Unified KPI tile for the Zone hierarchy view ────────────────────────────

export function HierarchyStatCard({
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
            className="relative overflow-hidden bg-white dark:bg-muted p-4 sm:p-5 rounded-xl border border-border dark:border-border shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out group/stat"
        >
            <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            />
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                    <p className="text-muted-foreground dark:text-muted-foreground text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">
                        {label}
                    </p>
                    <h3
                        className="text-lg sm:text-xl md:text-2xl font-medium tabular-nums tracking-tight text-foreground"
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

export const thBase = "h-14 px-5 text-left align-middle font-semibold text-sm uppercase tracking-wider text-muted-foreground dark:text-muted-foreground whitespace-nowrap";
export const tdBase = "px-5 py-4 align-middle text-sm font-semibold text-foreground dark:text-muted-foreground/70";

export type SortDir = 'asc' | 'desc' | null;
export interface SortState { key: string; dir: SortDir }

export function nextSort(current: SortState, key: string): SortState {
    if (current.key !== key) return { key, dir: 'asc' };
    if (current.dir === 'asc') return { key, dir: 'desc' };
    return { key: '', dir: null };
}

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active || !dir) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return dir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 text-secondary" />
        : <ChevronDown className="h-3.5 w-3.5 text-secondary" />;
}

export function Th({
    children, sortKey, sort, onSort, className,
}: {
    children: React.ReactNode; sortKey?: string; sort?: SortState;
    onSort?: (s: SortState) => void; className?: string;
}) {
    const sortable = sortKey && sort && onSort;
    return (
        <th scope="col"
            className={cn(thBase, sortable && "cursor-pointer select-none group hover:text-muted-foreground dark:hover:text-muted-foreground/70 transition-colors", className)}
            onClick={sortable ? () => onSort(nextSort(sort, sortKey)) : undefined}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                {sortable && <SortIcon active={sort.key === sortKey} dir={sort.key === sortKey ? sort.dir : null} />}
            </span>
        </th>
    );
}

export function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-9 w-full sm:w-64 pl-9 pr-8 text-[13px] rounded-full border border-border dark:border-border/80 bg-muted/80 dark:bg-muted/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-design"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted dark:text-muted-foreground/70 dark:hover:bg-muted/60 transition-colors"
                >
                    <span aria-hidden="true" className="text-[14px] leading-none font-medium">&times;</span>
                </button>
            )}
        </div>
    );
}

export function StatusChip({ label, color }: { label: string; color: 'success' | 'danger' | 'warning' | 'default' | 'primary' }) {
    const styles = {
        success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        danger: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
        warning: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        default: 'bg-muted text-muted-foreground ring-border/10 dark:bg-muted/10 dark:text-muted-foreground dark:ring-border/20',
        primary: 'bg-secondary text-primary-foreground ring-secondary/60 dark:bg-secondary/90 dark:text-primary-foreground dark:ring-secondary/50',
    }[color];
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset", styles)}>
            {label}
        </span>
    );
}

export function TablePagination({
    page, totalPages, totalItems, onPageChange, rowsPerPage, onRowsPerPageChange,
}: {
    page: number; totalPages: number; totalItems: number;
    onPageChange: (p: number) => void; rowsPerPage: number; onRowsPerPageChange: (n: number) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
            <span className="text-[12px] text-muted-foreground dark:text-muted-foreground tabular-nums">
                {totalItems} result{totalItems !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
                <button
                    className="min-h-11 px-4 text-[12px] font-medium rounded-full border border-border dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors sm:min-h-8 sm:px-3"
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
                            "flex min-h-11 min-w-11 items-center justify-center rounded-full text-[12px] font-medium transition-design sm:min-h-8 sm:min-w-8",
                            p === page
                                ? "bg-primary text-primary-foreground shadow-sm dark:bg-secondary dark:text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted dark:hover:bg-muted",
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className="min-h-11 px-4 text-[12px] font-medium rounded-full border border-border dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors sm:min-h-8 sm:px-3"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground dark:text-muted-foreground">
                Rows
                <select
                    value={rowsPerPage}
                    onChange={e => onRowsPerPageChange(Number(e.target.value))}
                    className="min-h-11 rounded-full border border-border dark:border-border bg-transparent text-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer sm:min-h-8 sm:px-2"
                >
                    {[5, 10, 15, 21].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
        </div>
    );
}
