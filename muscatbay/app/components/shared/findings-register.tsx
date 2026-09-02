"use client";

/**
 * Findings register — the identification-only replacement for the Exceptions &
 * Actions table.
 *
 * Why this exists alongside `components/shared/inspection.tsx`
 * -----------------------------------------------------------
 * The shared `ExceptionsRegister` hardcodes two tracking columns — `Owner` and
 * `Status: "Open"` — that are pure fiction: nothing in the app assigns work or
 * closes an item, and management explicitly does NOT want assignment or
 * resolution tracking, only identification. This register keeps everything that
 * is real (severity, item, value, remarks, suggested action) and drops the
 * theatre. It deliberately reuses the shared severity model (`Severity`,
 * `SeverityChip`, `SEV_UI`) rather than inventing a second one, so the colours
 * and labels stay identical to the health cards and heatmaps above it.
 *
 * It also fixes the two things that made the old register unusable at scale:
 *  - grouping: repeated identical findings collapse into one row with an
 *    occurrence count and a date span, instead of hundreds of near-identical
 *    "No inlet recorded" rows burying the Critical ones;
 *  - filtering + pagination: severity chips, a category select, a free-text
 *    search, and the shared rows-per-page pagination so the table never
 *    renders an unbounded list.
 *
 * The table itself renders through the unified table system (`<Table>` →
 * `.ops-table`), so it shares the app-wide look: sticky brand header,
 * sortable columns, zebra rows, emphasized first column, CSV export.
 */

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityChip } from "@/components/shared/inspection";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    ExportButton,
    SortableTableHead,
    TablePagination,
    TableToolbar,
    type ExportColumn,
    type PageSizeOption,
} from "@/components/shared/data-table";

// ─── Row model ────────────────────────────────────────────────────────────────

export type FindingSeverity = "Critical" | "Watch";

export interface Finding {
    /** Stable key for React + de-duplication. */
    id: string;
    /** Day or period the finding belongs to; omitted for single-period registers. */
    date?: string;
    category: string;
    item: string;
    severity: FindingSeverity;
    /** The measured figure that triggered the finding. */
    value: string;
    /** Why it fired — the live threshold that was crossed, and any grouping span. */
    remarks?: string;
    /** What an operator should go and check. Identification only — never a work order. */
    action: string;
    /** >1 when consecutive identical findings were collapsed into this row. */
    occurrences?: number;
}

type SortField = "date" | "category" | "item" | "severity" | "value";

const SEVERITY_RANK: Record<FindingSeverity, number> = { Critical: 0, Watch: 1 };

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [25, 50, 100, 'All'];
const DEFAULT_PAGE_SIZE: PageSizeOption = 50;

// ─── Grouping helper (exported — analytics modules collapse runs before render) ─

/**
 * Collapse a chronologically-ordered run of identical findings (same category +
 * item + severity) into one row carrying the occurrence count and the date span.
 * Keeps the register honest: nothing is dropped, it is summarised.
 */
export function collapseConsecutive(rows: Finding[]): Finding[] {
    const out: Finding[] = [];
    for (const row of rows) {
        const prev = out[out.length - 1];
        const sameFinding =
            prev &&
            prev.category === row.category &&
            prev.item === row.item &&
            prev.severity === row.severity;
        if (sameFinding) {
            const count = (prev.occurrences ?? 1) + 1;
            const firstDate = prev.date?.split(" – ")[0] ?? prev.date;
            const baseRemark = prev.remarks?.split(" · spans ")[0];
            out[out.length - 1] = {
                ...prev,
                occurrences: count,
                // The first occurrence's value is kept (it is the one that opened
                // the run); the span and count carry the rest of the story.
                date: firstDate && row.date ? `${firstDate} – ${row.date}` : (row.date ?? prev.date),
                remarks: [baseRemark, `spans ${count} consecutive logged days`].filter(Boolean).join(" · "),
            };
        } else {
            out.push(row);
        }
    }
    return out;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/** Numeric key where the display string parses to a number, else the string. */
function sortKey(row: Finding, field: SortField): string | number {
    switch (field) {
        case "date":
            // Sort on the run's opening date; ISO dates compare lexicographically.
            return row.date?.split(" – ")[0] ?? "";
        case "severity":
            return SEVERITY_RANK[row.severity];
        case "value": {
            const numeric = parseFloat(row.value.replace(/[^0-9.eE+-]/g, ""));
            return Number.isNaN(numeric) ? row.value.toLowerCase() : numeric;
        }
        case "category":
            return row.category.toLowerCase();
        case "item":
            return row.item.toLowerCase();
    }
}

// ─── Summary tiles ────────────────────────────────────────────────────────────

function SummaryStat({
    label, value, icon, color, valueColor,
}: { label: string; value: string; icon: React.ReactNode; color: string; valueColor?: string }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card-standard sm:p-5">
            <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
                    <h3 className="text-lg font-semibold tracking-tight tabular-nums text-foreground sm:text-xl md:text-2xl" style={valueColor ? { color: valueColor } : undefined}>
                        {value}
                    </h3>
                </div>
                <div className="flex-shrink-0 rounded-lg p-2 sm:p-3" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function FindingsRegister({
    rows, title, subtitle, filename, emptyHint, showDate = true, gateNote,
}: {
    rows: Finding[];
    title: string;
    subtitle: string;
    filename: string;
    emptyHint?: string;
    showDate?: boolean;
    /** The live threshold sentence — so an operator can see what produced these rows. */
    gateNote?: string;
}) {
    const [severityFilter, setSeverityFilter] = useState<"all" | FindingSeverity>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

    const categories = useMemo(
        () => Array.from(new Set(rows.map((r) => r.category))).sort(),
        [rows],
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (severityFilter !== "all" && r.severity !== severityFilter) return false;
            if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
            if (term) {
                const hay = `${r.item} ${r.category} ${r.value} ${r.remarks ?? ""} ${r.date ?? ""}`.toLowerCase();
                if (!hay.includes(term)) return false;
            }
            return true;
        });
    }, [rows, severityFilter, categoryFilter, search]);

    // Unsorted order is the analytics order (severity runs, chronological) —
    // sorting only applies once a column header is clicked.
    const sorted = useMemo(() => {
        if (!sortField) return filtered;
        const dir = sortDirection === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const ka = sortKey(a, sortField);
            const kb = sortKey(b, sortField);
            if (typeof ka === "number" && typeof kb === "number") return (ka - kb) * dir;
            return String(ka).localeCompare(String(kb)) * dir;
        });
    }, [filtered, sortField, sortDirection]);

    const effectivePageSize = pageSize === 'All' ? (sorted.length || 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(sorted.length / effectivePageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * effectivePageSize;
    const paginated = sorted.slice(startIndex, startIndex + effectivePageSize);

    const criticalTotal = rows.filter((r) => r.severity === "Critical").length;
    const watchTotal = rows.length - criticalTotal;
    const hasFilters = severityFilter !== "all" || categoryFilter !== "all" || search.trim() !== "";

    const handleSort = (field: string) => {
        const f = field as SortField;
        if (sortField === f) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(f);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSeverityFilter("all");
        setCategoryFilter("all");
        setSearch("");
        setCurrentPage(1);
    };

    // Exports exactly what is on screen (the filtered, sorted set),
    // identification fields only — no owner, no status, no due date.
    const exportColumns = useMemo<ExportColumn<Finding>[]>(() => [
        ...(showDate ? [{ key: "date", header: "Date", format: (r: Finding) => r.date ?? "" } as ExportColumn<Finding>] : []),
        { key: "category", header: "Category" },
        { key: "item", header: "Item" },
        { key: "severity", header: "Severity" },
        { key: "value", header: "Value" },
        { key: "id", header: "Occurrences", format: (r) => r.occurrences ?? 1 },
        { key: "remarks", header: "Remarks", format: (r) => r.remarks ?? "" },
        { key: "action", header: "Suggested Action" },
    ], [showDate]);

    const sevButton = (key: "all" | FindingSeverity, label: string, count: number) => (
        <button
            key={key}
            type="button"
            onClick={() => { setSeverityFilter(key); setCurrentPage(1); }}
            aria-pressed={severityFilter === key}
            className={cn(
                "rounded-[5px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                severityFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
            )}
        >
            {label} <span className="tabular-nums opacity-80">({count})</span>
        </button>
    );

    const columnCount = showDate ? 7 : 6;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <SummaryStat label="Findings" value={String(rows.length)} icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--primary)" />
                <SummaryStat label="Critical" value={String(criticalTotal)} icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--status-danger)" valueColor={criticalTotal > 0 ? "var(--mb-danger-text)" : undefined} />
                <SummaryStat label="Watch" value={String(watchTotal)} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--status-warning)" />
            </div>

            <div className="space-y-4">
                <TableToolbar className="flex-wrap">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <ClipboardList className="h-4 w-4 text-mb-secondary-text" aria-hidden="true" />
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                        {gateNote && (
                            <p className="mt-1 text-[11px] leading-snug text-muted-foreground/90">
                                <span className="font-semibold uppercase tracking-wide">Thresholds in force · </span>
                                {gateNote}
                            </p>
                        )}
                    </div>

                    {rows.length > 0 && (
                        <>
                            <div className="flex items-center gap-1.5 sm:ml-auto" role="group" aria-label="Filter findings by severity">
                                {sevButton("all", "All", rows.length)}
                                {sevButton("Critical", "Critical", criticalTotal)}
                                {sevButton("Watch", "Watch", watchTotal)}
                            </div>

                            {categories.length > 1 && (
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                    aria-label="Filter findings by category"
                                    className="rounded-lg border border-border/80 bg-card px-2.5 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                >
                                    <option value="all">All categories</option>
                                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}

                            <div className="relative flex-1 min-w-0 sm:min-w-[180px] max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search findings…"
                                    aria-label="Search findings"
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                                />
                            </div>

                            <ExportButton rows={sorted} filename={filename} columns={exportColumns} />

                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                <span className="font-semibold text-foreground">{filtered.length === rows.length ? rows.length : `${filtered.length} of ${rows.length}`}</span> findings
                            </div>
                        </>
                    )}
                </TableToolbar>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-[10.5px] border border-border bg-card py-10 text-center shadow-sm">
                        <CheckCircle2 className="h-8 w-8 text-mb-success-text" aria-hidden="true" />
                        <p className="text-sm font-semibold text-foreground">No findings in this period</p>
                        {emptyHint && <p className="max-w-md text-xs text-muted-foreground">{emptyHint}</p>}
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="md:hidden space-y-3">
                            {paginated.map((r) => (
                                <div key={r.id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-foreground min-w-0 truncate">{r.category}</span>
                                        <SeverityChip severity={r.severity === "Critical" ? "critical" : "watch"} label={r.severity} />
                                    </div>
                                    {showDate && r.date && (
                                        <p className="text-xs tabular-nums text-muted-foreground">{r.date}</p>
                                    )}
                                    <p className="text-sm text-foreground">
                                        {r.item}
                                        {r.occurrences && r.occurrences > 1 && (
                                            <span className="ms-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                                                ×{r.occurrences}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm font-medium tabular-nums text-foreground">{r.value}</p>
                                    {r.remarks && <p className="text-xs text-muted-foreground">{r.remarks}</p>}
                                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Check:</span> {r.action}</p>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-card py-10 text-center">
                                    <Search className="h-7 w-7 text-muted-foreground/70" aria-hidden="true" />
                                    <p className="text-sm font-semibold text-foreground">No findings match these filters</p>
                                    {hasFilters && (
                                        <button type="button" onClick={clearFilters} className="text-xs font-semibold text-mb-secondary-text underline underline-offset-2">
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block">
                            <Table data-density="compact" aria-label={title}>
                                <TableHeader>
                                    <TableRow>
                                        {showDate && (
                                            <SortableTableHead field="date" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Date</SortableTableHead>
                                        )}
                                        <SortableTableHead field="category" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Category</SortableTableHead>
                                        <SortableTableHead field="item" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Item</SortableTableHead>
                                        <SortableTableHead field="severity" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Severity</SortableTableHead>
                                        <SortableTableHead field="value" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Value</SortableTableHead>
                                        <TableHead>Remarks</TableHead>
                                        <TableHead>Suggested action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginated.map((r) => (
                                        <TableRow key={r.id}>
                                            {showDate && <TableCell className="whitespace-nowrap tabular-nums">{r.date ?? "—"}</TableCell>}
                                            <TableCell className="whitespace-nowrap">{r.category}</TableCell>
                                            <TableCell className="min-w-[200px] text-foreground">
                                                {r.item}
                                                {r.occurrences && r.occurrences > 1 && (
                                                    <span className="ms-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                                                        ×{r.occurrences}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <SeverityChip severity={r.severity === "Critical" ? "critical" : "watch"} label={r.severity} />
                                            </TableCell>
                                            <TableCell className="num whitespace-nowrap text-foreground">{r.value}</TableCell>
                                            <TableCell className="min-w-[160px] text-muted-foreground">{r.remarks ?? "—"}</TableCell>
                                            <TableCell className="min-w-[240px] text-muted-foreground">{r.action}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={columnCount} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Search className="h-7 w-7 text-muted-foreground/70" aria-hidden="true" />
                                                    <p className="text-sm font-medium text-foreground">No findings match these filters</p>
                                                    {hasFilters && (
                                                        <button type="button" onClick={clearFilters} className="text-xs font-semibold text-mb-secondary-text underline underline-offset-2">
                                                            Clear filters
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {sorted.length > 0 && (
                            <TablePagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                totalItems={sorted.length}
                                pageSize={pageSize}
                                pageSizeOptions={PAGE_SIZE_OPTIONS}
                                startIndex={startIndex}
                                endIndex={Math.min(startIndex + effectivePageSize, sorted.length)}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
