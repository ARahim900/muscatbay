"use client";

import { useState, useMemo } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import {
  MultiSelectDropdown,
  TablePagination,
  TableToolbar,
  SortableTableHead,
  type PageSizeOption,
} from "@/components/shared/data-table";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import type { PpmFinding } from "./types";

interface FindingsTabProps {
  findings: PpmFinding[];
}

function getPriorityColor(priority: string) {
  const p = priority?.toLowerCase() || "";
  if (p === "critical") return "bg-mb-danger-light text-mb-danger-text";
  if (p === "high") return "bg-mb-stale-light text-mb-stale-text";
  if (p === "medium") return "bg-mb-warning-light text-mb-warning-text";
  return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "closed") return "bg-mb-success-light text-mb-success-text";
  if (s.includes("awaiting")) return "bg-mb-warning-light text-mb-warning-text";
  if (s === "open") return "bg-mb-danger-light text-mb-danger-text";
  if (s === "quoted") return "bg-mb-info-light text-mb-info-text";
  return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";
}

export function FindingsTab({ findings }: FindingsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedVisits, setSelectedVisits] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  const uniqueBuildings = useMemo(() => [...new Set(findings.map((f) => f.building).filter(Boolean))].sort(), [findings]);
  const uniqueYears = useMemo(() => [...new Set(findings.map((f) => f.fiscal_year).filter(Boolean))].sort(), [findings]);
  const uniqueVisits = useMemo(() => [...new Set(findings.map((f) => f.ppm_visit).filter(Boolean))].sort(), [findings]);
  const uniquePriorities = useMemo(() => [...new Set(findings.map((f) => f.priority).filter(Boolean))].sort(), [findings]);
  const uniqueStatuses = useMemo(() => [...new Set(findings.map((f) => f.status).filter(Boolean))].sort(), [findings]);

  const filtered = useMemo(() => {
    let result = [...findings];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.finding_code?.toLowerCase().includes(term) ||
          f.building?.toLowerCase().includes(term) ||
          f.equipment_label?.toLowerCase().includes(term) ||
          f.description?.toLowerCase().includes(term)
      );
    }
    if (selectedBuildings.length > 0 && selectedBuildings.length < uniqueBuildings.length)
      result = result.filter((f) => selectedBuildings.includes(f.building));
    if (selectedYears.length > 0 && selectedYears.length < uniqueYears.length)
      result = result.filter((f) => selectedYears.includes(f.fiscal_year));
    if (selectedVisits.length > 0 && selectedVisits.length < uniqueVisits.length)
      result = result.filter((f) => selectedVisits.includes(f.ppm_visit));
    if (selectedPriorities.length > 0 && selectedPriorities.length < uniquePriorities.length)
      result = result.filter((f) => selectedPriorities.includes(f.priority));
    if (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length)
      result = result.filter((f) => selectedStatuses.includes(f.status));

    if (sortField) {
      result.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
        const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [findings, search, selectedBuildings, uniqueBuildings, selectedYears, uniqueYears, selectedVisits, uniqueVisits, selectedPriorities, uniquePriorities, selectedStatuses, uniqueStatuses, sortField, sortDirection]);

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
    search ||
    (selectedBuildings.length > 0 && selectedBuildings.length < uniqueBuildings.length) ||
    (selectedYears.length > 0 && selectedYears.length < uniqueYears.length) ||
    (selectedVisits.length > 0 && selectedVisits.length < uniqueVisits.length) ||
    (selectedPriorities.length > 0 && selectedPriorities.length < uniquePriorities.length) ||
    (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length);

  const clearFilters = () => {
    setSearch("");
    setSelectedBuildings([]);
    setSelectedYears([]);
    setSelectedVisits([]);
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setCurrentPage(1);
  };

  const columns = [
    { field: "finding_code", label: "Code" },
    { field: "building", label: "Building" },
    { field: "equipment_label", label: "Equipment" },
    { field: "fiscal_year", label: "FY" },
    { field: "ppm_visit", label: "PPM" },
    { field: "description", label: "Description" },
    { field: "quantity", label: "Qty" },
    { field: "priority", label: "Priority" },
    { field: "status", label: "Status" },
    { field: "quotation_ref", label: "Quotation" },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar>
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="Search findings"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 dark:border-border/80 bg-card text-foreground dark:text-muted-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
          />
        </div>
        <MultiSelectDropdown label="Building" options={uniqueBuildings} selected={selectedBuildings} onChange={(s) => { setSelectedBuildings(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="FY" options={uniqueYears} selected={selectedYears} onChange={(s) => { setSelectedYears(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="PPM" options={uniqueVisits} selected={selectedVisits} onChange={(s) => { setSelectedVisits(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="Priority" options={uniquePriorities} selected={selectedPriorities} onChange={(s) => { setSelectedPriorities(s); setCurrentPage(1); }} />
        <MultiSelectDropdown label="Status" options={uniqueStatuses} selected={selectedStatuses} onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }} />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <div className="text-sm text-muted-foreground dark:text-muted-foreground whitespace-nowrap ml-auto">
          <span className="font-semibold text-foreground dark:text-muted-foreground/70">{filtered.length}</span>
          {filtered.length !== findings.length && <span> of {findings.length}</span>} findings
        </div>
      </TableToolbar>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginated.map((f, i) => (
          <div key={f.id || i} className="rounded-xl border border-border dark:border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground dark:text-muted-foreground flex items-center gap-1">
                  {f.finding_code}
                  {f.is_recurring && <span className="text-mb-warning" title="Recurring">↻</span>}
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">{f.building} — {f.equipment_label}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(f.priority)}`}>
                {f.priority}
              </span>
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2">{f.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(f.status)}`}>
                {f.status}
              </span>
              <span className="text-[10px] text-muted-foreground">{f.fiscal_year} · {f.ppm_visit}</span>
              {f.quotation_ref && <span className="text-[10px] text-mb-info">{f.quotation_ref}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground dark:text-muted-foreground bg-card rounded-xl border border-border dark:border-border">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No findings match your filters.</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
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
            {paginated.map((f, i) => (
              <TableRow key={f.id || i}>
                <TableCell className="font-semibold text-foreground dark:text-muted-foreground whitespace-nowrap">
                  {f.finding_code}
                  {f.is_recurring && <span className="ml-1 text-mb-warning" title="Recurring issue">↻</span>}
                </TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm">{f.building}</TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm max-w-[150px] truncate" title={f.equipment_label}>{f.equipment_label}</TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm">{f.fiscal_year}</TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm">{f.ppm_visit}</TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm max-w-[200px] truncate" title={f.description}>{f.description}</TableCell>
                <TableCell className="text-muted-foreground dark:text-muted-foreground text-sm text-center">{f.quantity}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(f.priority)}`}>{f.priority}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(f.status)}`}>{f.status}</span>
                </TableCell>
                <TableCell className="font-semibold text-sm text-mb-info">{f.quotation_ref || "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-muted-foreground dark:text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No findings match your filters.</p>
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
