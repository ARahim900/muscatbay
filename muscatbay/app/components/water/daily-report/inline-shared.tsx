"use client";

// ─── Shared helpers, primitives, types for the Daily report ───────────────────
//     Data processing (`processReport`, formatters) is unchanged. The visual
//     helpers are design-system only: tokens from app/design-tokens.css, chart
//     colours from `chartTheme`, and no local KPI tile or status chip — those
//     are `KpiCard` and `Badge` from components/ui/ (DESIGN_SYSTEM.md §6).

import { ArrowUpDown, ChevronUp, ChevronDown, Search, ArrowRight, ArrowDown } from "lucide-react";
import { chartTheme } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS,
    BUILDING_CHILD_METERS,
} from "@/lib/water-accounts";

// ─── Chart colours (DESIGN_SYSTEM.md §2.4, through chartTheme) ───────────────

export const CHART_COLORS = {
    loss: chartTheme.loss,
    success: chartTheme.series[5],   // sage
    teal: chartTheme.series[1],      // teal
    brand: chartTheme.series[0],     // purple
    amber: chartTheme.series[3],     // amber
    gray: "var(--color-neutral)",
} as const;

/**
 * Loss connector rendered *between* the two daily gauges (supply → consumption),
 * replacing the old standalone third "loss" gauge. `loss` is L2 − ΣL3 (positive
 * = water lost); `of` is the supply total used for the percentage. Calm by
 * default — danger tint only when there is actual loss ("urgent only when
 * earned"), mirroring the monthly water-balance treatment. The arrow flips to
 * vertical when the gauges stack on narrow screens.
 */
export function DailyLossConnector({ loss, of }: { loss: number | null; of: number }) {
    // `null` = the balance could not be computed (the bulk meter was not read).
    // Showing that as "0 · balanced" claimed the zone reconciled perfectly.
    if (loss === null) {
        return (
            <div className="flex shrink-0 flex-col items-center justify-center">
                <ArrowDown size={20} strokeWidth={2} className="text-muted sm:hidden" aria-hidden="true" />
                <ArrowRight size={20} strokeWidth={2} className="hidden text-muted sm:block" aria-hidden="true" />
                <div className="mt-2 flex flex-col items-center rounded-control border border-dashed border-line px-3 py-1.5">
                    <span className="whitespace-nowrap text-title text-muted">—</span>
                    <span className="whitespace-nowrap text-eyebrow uppercase text-muted">no reading</span>
                </div>
            </div>
        );
    }
    const v = loss;
    const isLoss = v > 0;
    const tint = isLoss ? "var(--color-danger)" : "var(--color-success)";
    const pct = of > 0 ? Math.abs(Math.round((v / of) * 1000) / 10) : 0;
    const sign = v > 0 ? '−' : v < 0 ? '+' : '';
    const caption = v > 0 ? 'loss' : v < 0 ? 'over-read' : 'balanced';
    return (
        <div className="flex shrink-0 flex-col items-center justify-center">
            <ArrowDown size={20} strokeWidth={2} className="text-muted sm:hidden" aria-hidden="true" />
            <ArrowRight size={20} strokeWidth={2} className="hidden text-muted sm:block" aria-hidden="true" />
            <div
                className={cn("mt-2 flex flex-col items-center rounded-control px-3 py-1.5", isLoss ? "bg-danger-tint" : "bg-success-tint")}
            >
                <span className="whitespace-nowrap text-title tabular-nums" style={{ color: tint }}>
                    {sign}{n(Math.abs(v))} m³
                </span>
                <span className="whitespace-nowrap text-eyebrow uppercase" style={{ color: tint }}>
                    {caption} · {pct}%
                </span>
            </div>
        </div>
    );
}

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
    /** The source value rounded for display; null remains missing. */
    displayValue: number | null;
    isNullFlag: boolean;
}

export interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    l3Total: number;
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
        const displayValue = rawValue !== null ? r2(rawValue) : null;
        return {
            meterName: dc.meterName,
            account: dc.account,
            isIrr: dc.isIrr,
            rawValue,
            displayValue,
            isNullFlag: rawValue === null,
        };
    });

    // SUMMARY
    const l2Total = r2(zoneRows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const l3Total = r2(zoneRows.reduce((s, r) => s + r.l3Sum, 0));
    const dcTotal = r2(dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    return { zoneRows, buildingRows, dcRows, l2Total, l3Total, dcTotal, grandTotal: r2(l2Total + dcTotal) };
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

// ─── Table primitives ─────────────────────────────────────────────────────────
// Raw HTML table elements styled with the design tokens: a sticky purple header
// row (text-eyebrow, on-primary — DESIGN_SYSTEM.md §6 DataTable) and caption-size
// cells, so daily tables read identically to the monthly ledgers.

export const thBase = "sticky top-0 z-10 whitespace-nowrap bg-primary px-3 py-2 text-left align-middle text-eyebrow uppercase text-on-primary";
export const tdBase = "px-3 py-2 align-middle text-caption text-fg";

export type SortDir = 'asc' | 'desc' | null;
export interface SortState { key: string; dir: SortDir }

export function nextSort(current: SortState, key: string): SortState {
    if (current.key !== key) return { key, dir: 'asc' };
    if (current.dir === 'asc') return { key, dir: 'desc' };
    return { key: '', dir: null };
}

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active || !dir) return <ArrowUpDown size={12} strokeWidth={2} className="opacity-30" aria-hidden="true" />;
    return dir === 'asc'
        ? <ChevronUp size={14} strokeWidth={2} className="text-accent" aria-hidden="true" />
        : <ChevronDown size={14} strokeWidth={2} className="text-accent" aria-hidden="true" />;
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
            className={cn(thBase, sortable && "group cursor-pointer select-none transition-opacity hover:opacity-80", className)}
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
            <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-9 w-full rounded-control border border-line bg-card pl-9 pr-8 text-label text-fg outline-none placeholder:text-muted sm:w-64"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-control text-muted transition-colors hover:bg-component hover:text-fg"
                >
                    <span aria-hidden="true" className="text-body font-medium leading-none">&times;</span>
                </button>
            )}
        </div>
    );
}

export function TablePagination({
    page, totalPages, totalItems, onPageChange, rowsPerPage, onRowsPerPageChange,
}: {
    page: number; totalPages: number; totalItems: number;
    onPageChange: (p: number) => void; rowsPerPage: number; onRowsPerPageChange: (n: number) => void;
}) {
    const pageButton = "flex min-h-11 min-w-11 items-center justify-center rounded-control text-caption font-medium transition-colors sm:min-h-8 sm:min-w-8";
    const edgeButton = "min-h-11 rounded-control border border-line px-4 text-caption font-medium text-muted transition-colors hover:bg-component disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8 sm:px-3";
    return (
        <div className="flex flex-col items-center justify-between gap-3 px-1 py-2 sm:flex-row">
            <span className="text-caption tabular-nums text-muted">
                {totalItems} result{totalItems !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
                <button type="button" className={edgeButton} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onPageChange(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={cn(pageButton, p === page ? "bg-primary text-on-primary" : "text-muted hover:bg-component hover:text-fg")}
                    >
                        {p}
                    </button>
                ))}
                <button type="button" className={edgeButton} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Next
                </button>
            </div>
            <label className="flex items-center gap-1.5 text-caption text-muted">
                Rows
                <select
                    value={rowsPerPage}
                    onChange={e => onRowsPerPageChange(Number(e.target.value))}
                    className="min-h-11 cursor-pointer rounded-control border border-line bg-card px-3 text-caption text-fg outline-none sm:min-h-8 sm:px-2"
                >
                    {[5, 10, 15, 21].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
        </div>
    );
}
