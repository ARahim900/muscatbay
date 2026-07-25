"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  MultiSelectDropdown,
  TablePagination,
  TableToolbar,
  SortableTableHead,
  ExportButton,
  type PageSizeOption,
  type ExportColumn,
} from "@/components/shared/data-table";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { RecurringIssue } from "./types";

interface RecurringTabProps {
  issues: RecurringIssue[];
}

// Full ge_recurring_issues column set for the database export
const RECURRING_EXPORT_COLUMNS: ExportColumn<RecurringIssue>[] = [
  { key: "building", header: "Building" },
  { key: "equipment_id", header: "Equipment ID" },
  { key: "equipment_label", header: "Equipment" },
  { key: "issue_type", header: "Issue Type" },
  { key: "occurrence_count", header: "Occurrences" },
  { key: "first_ppm", header: "First PPM" },
  { key: "last_ppm", header: "Last PPM" },
  { key: "still_open", header: "Status", format: (i) => (i.still_open ? "Open" : "Closed") },
  { key: "resolved_ppm", header: "Resolved PPM" },
  { key: "notes", header: "Notes" },
];

const OPEN_LABEL = "Open";
const CLOSED_LABEL = "Closed";
const STATUS_OPTIONS = [OPEN_LABEL, CLOSED_LABEL];

const COLUMNS: { field: string; label: string }[] = [
  { field: "equipment_label", label: "Equipment" },
  { field: "building", label: "Building" },
  { field: "issue_type", label: "Issue Type" },
  { field: "occurrence_count", label: "Occurrences" },
  { field: "first_ppm", label: "First PPM" },
  { field: "last_ppm", label: "Last PPM" },
  { field: "status", label: "Status" },
  { field: "resolved_ppm", label: "Resolved" },
  { field: "notes", label: "Notes" },
];

function statusCls(stillOpen: boolean) {
  return stillOpen
    ? "bg-mb-danger-light text-mb-danger-text"
    : "bg-mb-success-light text-mb-success-text";
}

/** Sort key extractor — numeric fields sort numerically, everything else as text. */
function sortValue(issue: RecurringIssue, field: string): string | number {
  switch (field) {
    case "occurrence_count": return issue.occurrence_count ?? 0;
    case "status": return issue.still_open ? OPEN_LABEL : CLOSED_LABEL;
    case "notes": return issue.notes ?? "";
    case "resolved_ppm": return issue.resolved_ppm ?? "";
    default: {
      const value = (issue as unknown as Record<string, unknown>)[field];
      return value == null ? "" : String(value);
    }
  }
}

export function RecurringTab({ issues }: RecurringTabProps) {
  const [search, setSearch] = useState("");
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string | null>("occurrence_count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  const uniqueBuildings = useMemo(
    () => [...new Set(issues.map((i) => i.building).filter(Boolean))].sort(),
    [issues],
  );
  const uniqueTypes = useMemo(
    () => [...new Set(issues.map((i) => i.issue_type).filter(Boolean))].sort(),
    [issues],
  );

  const filtered = useMemo(() => {
    let result = [...issues];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.equipment_label?.toLowerCase().includes(term) ||
          i.equipment_id?.toLowerCase().includes(term) ||
          i.building?.toLowerCase().includes(term) ||
          i.issue_type?.toLowerCase().includes(term) ||
          (i.notes?.toLowerCase().includes(term) ?? false),
      );
    }
    if (selectedBuildings.length > 0 && selectedBuildings.length < uniqueBuildings.length) {
      result = result.filter((i) => selectedBuildings.includes(i.building));
    }
    if (selectedTypes.length > 0 && selectedTypes.length < uniqueTypes.length) {
      result = result.filter((i) => selectedTypes.includes(i.issue_type));
    }
    if (selectedStatuses.length > 0 && selectedStatuses.length < STATUS_OPTIONS.length) {
      result = result.filter((i) =>
        selectedStatuses.includes(i.still_open ? OPEN_LABEL : CLOSED_LABEL),
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const aVal = sortValue(a, sortField);
        const bVal = sortValue(b, sortField);
        const cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [issues, search, selectedBuildings, uniqueBuildings, selectedTypes, uniqueTypes, selectedStatuses, sortField, sortDirection]);

  const effectivePageSize = pageSize === "All" ? filtered.length : pageSize;
  const totalPages = Math.ceil(filtered.length / (effectivePageSize || 1));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginated = filtered.slice(startIndex, startIndex + effectivePageSize);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const hasFilters =
    Boolean(search) ||
    (selectedBuildings.length > 0 && selectedBuildings.length < uniqueBuildings.length) ||
    (selectedTypes.length > 0 && selectedTypes.length < uniqueTypes.length) ||
    (selectedStatuses.length > 0 && selectedStatuses.length < STATUS_OPTIONS.length);

  const clearFilters = () => {
    setSearch("");
    setSelectedBuildings([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setCurrentPage(1);
  };

  // Nothing in the register at all — distinct from "filters matched nothing".
  if (issues.length === 0) {
    return (
      <div className="ops-table-shell">
        <EmptyState
          variant="no-data"
          title="No recurring issues"
          description="No equipment has repeated the same finding across PPM visits."
        />
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
            aria-label="Search recurring issues"
            placeholder="Search equipment, building, issue…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
          />
        </div>
        <MultiSelectDropdown label="Building" options={uniqueBuildings} selected={selectedBuildings} onChange={(s) => { setSelectedBuildings(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="Issue Type" options={uniqueTypes} selected={selectedTypes} onChange={(s) => { setSelectedTypes(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="Status" options={STATUS_OPTIONS} selected={selectedStatuses} onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }} />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <ExportButton rows={filtered} filename="hvac-recurring-issues" columns={RECURRING_EXPORT_COLUMNS} className="ml-auto" />
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-semibold text-foreground">{filtered.length}</span>
          {filtered.length !== issues.length && <span> of {issues.length}</span>} recurring issues
        </div>
      </TableToolbar>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.map((issue) => (
          <div key={issue.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{issue.issue_type}</p>
                <p className="text-xs text-muted-foreground">
                  {issue.building} — {issue.equipment_label}
                </p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCls(issue.still_open)}`}>
                {issue.still_open ? OPEN_LABEL : CLOSED_LABEL}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {issue.occurrence_count}×
              </span>
              <span>{issue.first_ppm} → {issue.last_ppm}</span>
              {issue.resolved_ppm && <span className="text-mb-success-text">Resolved: {issue.resolved_ppm}</span>}
            </div>
            {issue.notes && (
              <p className="text-[11px] text-muted-foreground">{issue.notes}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="ops-table-shell">
            <EmptyState
              variant="filter-empty"
              title="No recurring issues match"
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
                  className="px-4"
                >
                  {col.label}
                </SortableTableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((issue) => (
              <TableRow key={issue.id}>
                {/* Long values wrap instead of truncating: a `title` tooltip is
                    unreachable on touch, so the full text stays on screen. */}
                <TableCell className="font-semibold text-foreground text-sm max-w-[180px] whitespace-normal break-words">
                  {issue.equipment_label}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{issue.building}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] whitespace-normal break-words">{issue.issue_type}</TableCell>
                <TableCell className="text-foreground text-sm text-center font-semibold tabular-nums">{issue.occurrence_count}</TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{issue.first_ppm}</TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{issue.last_ppm}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCls(issue.still_open)}`}>
                    {issue.still_open ? OPEN_LABEL : CLOSED_LABEL}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{issue.resolved_ppm || "—"}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground max-w-[260px] whitespace-normal break-words">{issue.notes || "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length}>
                  <EmptyState
                    variant="filter-empty"
                    title="No recurring issues match"
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
