"use client";

/**
 * @fileoverview Fire-safety Issues & Defects Register.
 *
 * Same shared-table treatment as the Equipment Register and the Maintenance
 * tracker: toolbar search, multi-select filters, sortable heads, pagination
 * and export. Previously the whole array was mapped unbounded.
 *
 * Identification only — the register displays what BEC and site staff logged;
 * it does not assign, schedule or close anything.
 *
 * @module app/firefighting/issues-register
 */

import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
    MultiSelectDropdown, SortableTableHead, TablePagination, TableToolbar, ExportButton,
    type PageSizeOption, type ExportColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { FireIssue } from "@/entities/fire-safety";
import { fmtDate, issueStatusCls } from "./ui";

export const ISSUES_EXPORT_COLUMNS: ExportColumn<FireIssue>[] = [
    { key: "issue_description", header: "Issue" },
    { key: "location", header: "Location" },
    { key: "date_reported", header: "Reported" },
    { key: "reported_by", header: "Reported By" },
    { key: "status", header: "Status" },
    { key: "quote_ref", header: "Quote Ref" },
    { key: "resolution", header: "Resolution" },
];

const COLUMNS: { field: string; label: string }[] = [
    { field: "issue_description", label: "Issue" },
    { field: "location", label: "Location" },
    { field: "date_reported", label: "Reported" },
    { field: "status", label: "Status" },
    { field: "quote_ref", label: "Quote Ref" },
    { field: "resolution", label: "Resolution" },
];

function sortValue(i: FireIssue, field: string): string {
    const v = (i as unknown as Record<string, unknown>)[field];
    return v == null ? "" : String(v);
}

interface IssuesRegisterProps {
    issues: FireIssue[];
}

export function IssuesRegister({ issues }: IssuesRegisterProps) {
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>("date_reported");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    const statusOptions = useMemo(
        () => [...new Set(issues.map((i) => i.status).filter(Boolean))].sort(),
        [issues],
    );
    const locationOptions = useMemo(
        () => [...new Set(issues.map((i) => i.location).filter(Boolean))].sort(),
        [issues],
    );

    const filtered = useMemo(() => {
        let result = [...issues];

        if (search) {
            const term = search.toLowerCase();
            result = result.filter(
                (i) =>
                    i.issue_description?.toLowerCase().includes(term) ||
                    i.location?.toLowerCase().includes(term) ||
                    i.quote_ref?.toLowerCase().includes(term) ||
                    i.resolution?.toLowerCase().includes(term) ||
                    (i.reported_by?.toLowerCase().includes(term) ?? false),
            );
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length) {
            result = result.filter((i) => selectedStatuses.includes(i.status));
        }
        if (selectedLocations.length > 0 && selectedLocations.length < locationOptions.length) {
            result = result.filter((i) => selectedLocations.includes(i.location));
        }

        if (sortField) {
            result.sort((a, b) => {
                const cmp = sortValue(a, sortField).localeCompare(sortValue(b, sortField), undefined, { numeric: true });
                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [issues, search, selectedStatuses, statusOptions, selectedLocations, locationOptions, sortField, sortDirection]);

    const effectivePageSize = pageSize === "All" ? filtered.length : pageSize;
    const totalPages = Math.ceil(filtered.length / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;
    const paginated = filtered.slice(startIndex, startIndex + effectivePageSize);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        else { setSortField(field); setSortDirection("asc"); }
        setCurrentPage(1);
    };

    const filtersActive =
        Boolean(search) ||
        (selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length) ||
        (selectedLocations.length > 0 && selectedLocations.length < locationOptions.length);

    const clearFilters = () => {
        setSearch(""); setSelectedStatuses([]); setSelectedLocations([]);
        setCurrentPage(1);
    };

    if (issues.length === 0) {
        return (
            <div className="ops-table-shell">
                <EmptyState variant="no-data" title="No issues logged" description="The issues register is empty or unavailable." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TableToolbar>
                <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        aria-label="Search issues register"
                        placeholder="Search issue, location, quote ref…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
                    />
                </div>
                <MultiSelectDropdown label="Status" options={statusOptions} selected={selectedStatuses} onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }} />
                <MultiSelectDropdown label="Location" options={locationOptions} selected={selectedLocations} onChange={(s) => { setSelectedLocations(s); setCurrentPage(1); }} />
                {filtersActive && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
                <ExportButton rows={filtered} filename="fire-issues-register" columns={ISSUES_EXPORT_COLUMNS} className="ml-auto" />
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    <span className="font-semibold text-foreground">{filtered.length}</span>
                    {filtered.length !== issues.length && <span> of {issues.length}</span>} issues
                </div>
            </TableToolbar>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {paginated.map((it) => (
                    <div key={it.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{it.issue_description}</p>
                            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0", issueStatusCls(it.status))}>{it.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{it.location} · {fmtDate(it.date_reported)}</p>
                        {it.resolution && <p className="text-[11px] text-muted-foreground">{it.resolution}</p>}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="ops-table-shell">
                        <EmptyState
                            variant="filter-empty"
                            title="No issues match"
                            description="Try adjusting the search or filters."
                            action={{ label: "Clear filters", onClick: clearFilters }}
                        />
                    </div>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {COLUMNS.map((col) => (
                                <SortableTableHead
                                    key={col.field}
                                    field={col.field}
                                    currentSortField={sortField}
                                    currentSortDirection={sortDirection}
                                    onSort={handleSort}
                                >
                                    {col.label}
                                </SortableTableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.map((it) => (
                            <TableRow key={it.id}>
                                {/* Long values wrap — no truncate-with-title, which is
                                    unrecoverable on a touch device. */}
                                <TableCell className="font-medium text-foreground max-w-[240px] whitespace-normal break-words">{it.issue_description}</TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[160px] whitespace-normal break-words">{it.location}</TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(it.date_reported)}</TableCell>
                                <TableCell><span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", issueStatusCls(it.status))}>{it.status}</span></TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">{it.quote_ref || "—"}</TableCell>
                                <TableCell className="text-[11px] text-muted-foreground max-w-[260px] whitespace-normal break-words">{it.resolution || "—"}</TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.length}>
                                    <EmptyState
                                        variant="filter-empty"
                                        title="No issues match"
                                        description="Try adjusting the search or filters."
                                        action={{ label: "Clear filters", onClick: clearFilters }}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {filtered.length > 0 && (
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    startIndex={startIndex}
                    endIndex={Math.min(startIndex + effectivePageSize, filtered.length)}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
            )}
        </div>
    );
}
