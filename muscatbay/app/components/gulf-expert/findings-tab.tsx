"use client";

import { useState, useMemo } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import {
  MultiSelectDropdown,
  SortIcon,
  TablePagination,
  TableToolbar,
  type PageSizeOption,
} from "@/components/shared/data-table";
import type { PpmFinding } from "./types";

interface FindingsTabProps {
  findings: PpmFinding[];
}

function getPriorityColor(priority: string) {
  const p = priority?.toLowerCase() || "";
  if (p === "critical") return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (p === "high") return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  if (p === "medium") return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "closed") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (s.includes("awaiting")) return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (s === "open") return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (s === "quoted") return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap ml-auto">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span>
          {filtered.length !== findings.length && <span> of {findings.length}</span>} findings
        </div>
      </TableToolbar>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginated.map((f, i) => (
          <div key={f.id || i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {f.finding_code}
                  {f.is_recurring && <span className="text-amber-500" title="Recurring">↻</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{f.building} — {f.equipment_label}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(f.priority)}`}>
                {f.priority}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{f.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(f.status)}`}>
                {f.status}
              </span>
              <span className="text-[10px] text-slate-400">{f.fiscal_year} · {f.ppm_visit}</span>
              {f.quotation_ref && <span className="text-[10px] text-blue-500">{f.quotation_ref}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No findings match your filters.</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80">
              {columns.map((col) => (
                <th
                  key={col.field}
                  className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  onClick={() => handleSort(col.field)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon field={col.field} currentSortField={sortField} currentSortDirection={sortDirection} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((f, i) => (
              <tr key={f.id || i} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {f.finding_code}
                  {f.is_recurring && <span className="ml-1 text-amber-500" title="Recurring issue">↻</span>}
                </td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm">{f.building}</td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm max-w-[150px] truncate" title={f.equipment_label}>{f.equipment_label}</td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm">{f.fiscal_year}</td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm">{f.ppm_visit}</td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm max-w-[200px] truncate" title={f.description}>{f.description}</td>
                <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 text-sm text-center">{f.quantity}</td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(f.priority)}`}>{f.priority}</span>
                </td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(f.status)}`}>{f.status}</span>
                </td>
                <td className="py-4 px-5 font-semibold text-sm text-blue-600 dark:text-blue-400">{f.quotation_ref || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No findings match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
