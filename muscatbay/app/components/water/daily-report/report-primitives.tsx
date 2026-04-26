"use client";

import { ArrowUpDown, ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir, SortState } from "./report-types";

// ─── Table base classes ───────────────────────────────────────────────────────

export const thBase = "h-14 px-5 text-left align-middle font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap";
export const tdBase = "px-5 py-4 align-middle text-sm font-semibold text-slate-700 dark:text-slate-300";

// ─── Sort helpers ─────────────────────────────────────────────────────────────

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

export function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
                type="text"
                aria-label={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-full sm:w-64 pl-9 pr-8 text-[13px] rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-colors"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                    <span className="text-[10px] leading-none font-bold">&times;</span>
                </button>
            )}
        </div>
    );
}

export function StatusChip({ label, color }: { label: string; color: 'success' | 'danger' | 'warning' | 'default' | 'primary' }) {
    const styles = {
        success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        danger:  'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
        warning: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        default: 'bg-slate-100 text-slate-500 ring-slate-500/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20',
        primary: 'bg-secondary text-white ring-secondary/60 dark:bg-secondary/90 dark:text-white dark:ring-secondary/50',
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
                            "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors",
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
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out group/stat">
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
