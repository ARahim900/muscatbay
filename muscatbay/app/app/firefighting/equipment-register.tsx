"use client";

/**
 * @fileoverview Fire-safety Equipment Register.
 *
 * Built on the shared table primitives (toolbar + multi-select filters +
 * sortable heads + pagination + export) so it behaves exactly like the
 * Maintenance tracker and the HVAC Findings table. Previously this register
 * mapped the whole array with no search, filter, sort or pagination.
 *
 * Display and identification only — no work orders, assignment or close-out.
 *
 * @module app/firefighting/equipment-register
 */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
    MultiSelectDropdown, SortableTableHead, TablePagination, TableToolbar, ExportButton,
    type PageSizeOption, type ExportColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { FireSafetyEquipment } from "@/entities/fire-safety";
import { ZONE_BY_KEY } from "./ppm-programme";
import { EQUIP_STATUS_CLS, ZoneBadge, equipZoneKey, fmtDate } from "./ui";

export const EQUIPMENT_EXPORT_COLUMNS: ExportColumn<FireSafetyEquipment>[] = [
    { key: "name", header: "Asset" },
    { key: "type", header: "Type" },
    { key: "zone", header: "Zone" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status" },
    { key: "priority", header: "Priority" },
    { key: "next_maintenance", header: "Next PPM" },
    { key: "inspector", header: "Inspector" },
    { key: "battery", header: "Battery (%)" },
    { key: "signal", header: "Signal (%)" },
];

const COLUMNS: { field: string; label: string }[] = [
    { field: "name", label: "Asset" },
    { field: "type", label: "Type" },
    { field: "zone", label: "Zone" },
    { field: "location", label: "Location" },
    { field: "status", label: "Status" },
    { field: "priority", label: "Priority" },
    { field: "next_maintenance", label: "Next PPM" },
];

function sortValue(e: FireSafetyEquipment, field: string): string {
    switch (field) {
        case "zone": {
            const k = equipZoneKey(e.zone);
            return k ? ZONE_BY_KEY[k].label : e.zone ?? "";
        }
        case "next_maintenance": return e.next_maintenance ?? "";
        default: {
            const v = (e as unknown as Record<string, unknown>)[field];
            return v == null ? "" : String(v);
        }
    }
}

interface EquipmentRegisterProps {
    equipment: FireSafetyEquipment[];
}

export function EquipmentRegister({ equipment }: EquipmentRegisterProps) {
    const [search, setSearch] = useState("");
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    const zoneOptions = useMemo(
        () => [...new Set(equipment.map((e) => e.zone).filter(Boolean))].sort(),
        [equipment],
    );
    const statusOptions = useMemo(
        () => [...new Set(equipment.map((e) => e.status).filter(Boolean))].sort(),
        [equipment],
    );
    const typeOptions = useMemo(
        () => [...new Set(equipment.map((e) => e.type).filter(Boolean))].sort(),
        [equipment],
    );

    const filtered = useMemo(() => {
        let result = [...equipment];

        if (search) {
            const term = search.toLowerCase();
            result = result.filter(
                (e) =>
                    e.name?.toLowerCase().includes(term) ||
                    e.type?.toLowerCase().includes(term) ||
                    e.location?.toLowerCase().includes(term) ||
                    e.zone?.toLowerCase().includes(term) ||
                    e.inspector?.toLowerCase().includes(term),
            );
        }
        if (selectedZones.length > 0 && selectedZones.length < zoneOptions.length) {
            result = result.filter((e) => selectedZones.includes(e.zone));
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length) {
            result = result.filter((e) => selectedStatuses.includes(e.status));
        }
        if (selectedTypes.length > 0 && selectedTypes.length < typeOptions.length) {
            result = result.filter((e) => selectedTypes.includes(e.type));
        }

        if (sortField) {
            result.sort((a, b) => {
                const cmp = sortValue(a, sortField).localeCompare(sortValue(b, sortField), undefined, { numeric: true });
                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [equipment, search, selectedZones, zoneOptions, selectedStatuses, statusOptions, selectedTypes, typeOptions, sortField, sortDirection]);

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
        (selectedZones.length > 0 && selectedZones.length < zoneOptions.length) ||
        (selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length) ||
        (selectedTypes.length > 0 && selectedTypes.length < typeOptions.length);

    const clearFilters = () => {
        setSearch(""); setSelectedZones([]); setSelectedStatuses([]); setSelectedTypes([]);
        setCurrentPage(1);
    };

    if (equipment.length === 0) {
        return (
            <div className="ops-table-shell">
                <EmptyState variant="no-data" title="No equipment data" description="Live equipment register is unavailable right now." />
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
                        aria-label="Search equipment register"
                        placeholder="Search asset, type, location…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
                    />
                </div>
                <MultiSelectDropdown label="Zone" options={zoneOptions} selected={selectedZones} onChange={(s) => { setSelectedZones(s); setCurrentPage(1); }} />
                <MultiSelectDropdown label="Type" options={typeOptions} selected={selectedTypes} onChange={(s) => { setSelectedTypes(s); setCurrentPage(1); }} />
                <MultiSelectDropdown label="Status" options={statusOptions} selected={selectedStatuses} onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }} />
                {filtersActive && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
                <ExportButton rows={filtered} filename="fire-safety-equipment" columns={EQUIPMENT_EXPORT_COLUMNS} className="ml-auto" />
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    <span className="font-semibold text-foreground">{filtered.length}</span>
                    {filtered.length !== equipment.length && <span> of {equipment.length}</span>} assets
                </div>
            </TableToolbar>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {paginated.map((e) => {
                    const zk = equipZoneKey(e.zone);
                    return (
                        <div key={e.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{e.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{e.type} · {e.location}</p>
                                </div>
                                {zk ? <ZoneBadge zone={zk} /> : null}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", EQUIP_STATUS_CLS[e.status] || "bg-muted text-muted-foreground")}>{e.status}</span>
                                <span className="text-[11px] text-muted-foreground tabular-nums">Next: {fmtDate(e.next_maintenance)}</span>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="ops-table-shell">
                        <EmptyState
                            variant="filter-empty"
                            title="No equipment matches"
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
                        {paginated.map((e) => {
                            const zk = equipZoneKey(e.zone);
                            return (
                                <TableRow key={e.id}>
                                    <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{e.type}</TableCell>
                                    <TableCell>{zk ? <ZoneBadge zone={zk} /> : <span className="text-xs text-muted-foreground">{e.zone}</span>}</TableCell>
                                    {/* Wraps rather than truncating — a title tooltip is unreachable on touch. */}
                                    <TableCell className="text-xs text-muted-foreground max-w-[220px] whitespace-normal break-words">{e.location}</TableCell>
                                    <TableCell><span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", EQUIP_STATUS_CLS[e.status] || "bg-muted text-muted-foreground")}>{e.status}</span></TableCell>
                                    <TableCell className="text-xs font-medium text-muted-foreground">{e.priority}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(e.next_maintenance)}</TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.length}>
                                    <EmptyState
                                        variant="filter-empty"
                                        title="No equipment matches"
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
