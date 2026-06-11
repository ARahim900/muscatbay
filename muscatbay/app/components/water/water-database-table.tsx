"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
    Search, ChevronDown, ChevronRight,
    Download, Columns, Users,
    X, Check
} from 'lucide-react';
import { WaterMeter, getConsumption } from '@/lib/water-data';
import { cn } from '@/lib/utils';
import { MultiSelectDropdown, SortIcon, TablePagination, TableToolbar } from '@/components/shared/data-table';
import { useVirtualTableRows } from '@/hooks/useVirtualTableRows';

interface WaterDatabaseTableProps {
    meters: WaterMeter[];
    months: string[];
}

// Unified body row model — flat and grouped modes share one virtualizable list
type TableRowModel =
    | { kind: 'group-header'; zone: string; meterCount: number }
    | { kind: 'meter'; meter: WaterMeter };

// Zone border colors — sourced from --chart-zone-* tokens in globals.css
// (categorical, theme-aware, retired the indigo/pink Tailwind utilities)
const ZONE_BORDER_VAR: Record<string, string> = {
    'Zone_01_(FM)': 'var(--chart-zone-c)', // sage
    'Zone_03_(A)':  'var(--chart-zone-a)', // blue
    'Zone_03_(B)':  'var(--chart-zone-b)', // muted violet
    'Zone_05':      'var(--chart-zone-b)', // muted violet
    'Zone_08':      'var(--chart-zone-f)', // teal
    'Zone_VS':      'var(--chart-zone-d)', // amber
    'DC':           'var(--chart-zone-d)', // amber
    'Main':         'var(--muted-foreground)',
    'N/A':          'var(--border)',
};

const ZONE_BG_COLORS: Record<string, string> = {
    'Zone_01_(FM)': 'bg-emerald-50 dark:bg-emerald-950/30',
    'Zone_03_(A)': 'bg-blue-50 dark:bg-blue-950/30',
    'Zone_03_(B)': 'bg-indigo-50 dark:bg-indigo-950/30',
    'Zone_05': 'bg-purple-50 dark:bg-purple-950/30',
    'Zone_08': 'bg-pink-50 dark:bg-pink-950/30',
    'Zone_VS': 'bg-amber-50 dark:bg-amber-950/30',
    'DC': 'bg-orange-50 dark:bg-orange-950/30',
    'Main': 'bg-muted dark:bg-muted/50',
    'N/A': 'bg-muted dark:bg-muted/30',
};

// Level badge colors — sourced from --badge-* tokens in globals.css
const LEVEL_STYLES: Record<string, string> = {
    'L1': 'bg-badge-green/25 text-badge-green-fg ring-1 ring-badge-green/50 dark:bg-badge-green/15 dark:ring-badge-green/30',
    'L2': 'bg-badge-blue/15 text-badge-blue-fg ring-1 ring-badge-blue/35 dark:bg-badge-blue/20 dark:ring-badge-blue/35',
    'L3': 'bg-secondary text-primary-foreground ring-1 ring-secondary/60 dark:bg-secondary/90 dark:text-primary-foreground dark:ring-secondary/50',
    'L4': 'bg-badge-red/12 text-badge-red-fg ring-1 ring-badge-red/35 dark:bg-badge-red/20 dark:ring-badge-red/35',
    'DC': 'bg-badge-amber/20 text-badge-amber-fg ring-1 ring-badge-amber/45 dark:bg-badge-amber/15 dark:ring-badge-amber/35',
};

// All unique levels
const ALL_LEVELS = ['L1', 'L2', 'L3', 'L4', 'DC'];

// All unique zones from ZONE_CONFIG plus extras
const ALL_ZONES = ['Zone_01_(FM)', 'Zone_03_(A)', 'Zone_03_(B)', 'Zone_05', 'Zone_08', 'Zone_VS', 'DC', 'Main', 'N/A'];

// Friendly zone names
const ZONE_NAMES: Record<string, string> = {
    'Zone_01_(FM)': 'Zone FM',
    'Zone_03_(A)': 'Zone 3A',
    'Zone_03_(B)': 'Zone 3B',
    'Zone_05': 'Zone 5',
    'Zone_08': 'Zone 8',
    'Zone_VS': 'Village Square',
    'DC': 'Direct Connection',
    'Main': 'Main',
    'N/A': 'N/A',
};

// Column visibility dropdown
function ColumnVisibilityDropdown({
    months,
    visibleMonths,
    onChange,
}: {
    months: string[];
    visibleMonths: string[];
    onChange: (months: string[]) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMonth = (month: string) => {
        if (visibleMonths.includes(month)) {
            onChange(visibleMonths.filter(m => m !== month));
        } else {
            onChange([...visibleMonths, month]);
        }
    };

    const showAll = () => onChange([...months]);
    const showLast6 = () => onChange(months.slice(-6));
    const showLast12 = () => onChange(months.slice(-12));

    const popoverId = React.useId();
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls={popoverId}
                aria-label={`Toggle visible months. ${visibleMonths.length} of ${months.length} months selected.`}
                className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border border-border/80 dark:border-border/80 hover:border-border dark:hover:border-border hover:shadow-sm text-muted-foreground transition-all duration-200"
            >
                <Columns className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Columns</span>
                <span className="text-sm text-muted-foreground">({visibleMonths.length}/{months.length})</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Dismiss column visibility menu"
                        tabIndex={-1}
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        id={popoverId}
                        role="dialog"
                        aria-label="Column visibility"
                        className="absolute top-full right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg w-[min(220px,calc(100vw-2rem))] sm:w-[280px] py-1"
                    >
                        <div role="group" aria-label="Quick range" className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
                            <button
                                type="button"
                                onClick={showAll}
                                aria-label={`Show all ${months.length} months`}
                                className="text-sm px-2 py-1 rounded bg-muted dark:bg-muted hover:bg-border dark:hover:bg-border"
                            >
                                All ({months.length})
                            </button>
                            <button
                                type="button"
                                onClick={showLast12}
                                aria-label="Show last 12 months"
                                className="text-sm px-2 py-1 rounded bg-muted dark:bg-muted hover:bg-border dark:hover:bg-border"
                            >
                                Last 12
                            </button>
                            <button
                                type="button"
                                onClick={showLast6}
                                aria-label="Show last 6 months"
                                className="text-sm px-2 py-1 rounded bg-muted dark:bg-muted hover:bg-border dark:hover:bg-border"
                            >
                                Last 6
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                            {months.map(month => (
                                <label
                                    key={month}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors",
                                        visibleMonths.includes(month)
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted dark:hover:bg-muted/50"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleMonths.includes(month)}
                                        onChange={() => toggleMonth(month)}
                                        className="sr-only"
                                    />
                                    {visibleMonths.includes(month) ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <div className="w-3 h-3" />
                                    )}
                                    {month}
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function WaterDatabaseTable({ meters, months }: WaterDatabaseTableProps) {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState<string[]>([...ALL_LEVELS]);
    const [selectedZones, setSelectedZones] = useState<string[]>([...ALL_ZONES]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const typesInitializedRef = React.useRef(false);
    const [groupByZone, setGroupByZone] = useState(false);
    const [visibleMonths, setVisibleMonths] = useState<string[]>([...months]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'All'>(50);

    // Get unique types from meters
    const allTypes = useMemo(() => {
        const types = new Set(meters.map(m => m.type));
        return Array.from(types).sort();
    }, [meters]);

    // Initialize selected types once when data first arrives
    React.useEffect(() => {
        if (!typesInitializedRef.current && allTypes.length > 0) {
            setSelectedTypes([...allTypes]);
            typesInitializedRef.current = true;
        }
    }, [allTypes]);

    // Filter meters
    const filteredMeters = useMemo(() => {
        let result = [...meters];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.label.toLowerCase().includes(term) ||
                m.accountNumber.toLowerCase().includes(term) ||
                m.zone.toLowerCase().includes(term) ||
                m.type.toLowerCase().includes(term) ||
                (m.parentMeter || '').toLowerCase().includes(term)
            );
        }

        // Level filter
        if (selectedLevels.length < ALL_LEVELS.length) {
            result = result.filter(m => selectedLevels.includes(m.level));
        }

        // Zone filter
        if (selectedZones.length < ALL_ZONES.length) {
            result = result.filter(m => selectedZones.includes(m.zone) || selectedZones.includes('N/A'));
        }

        // Type filter
        if (selectedTypes.length > 0 && selectedTypes.length < allTypes.length) {
            result = result.filter(m => selectedTypes.includes(m.type));
        }

        // Sort
        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';

                if (sortField === 'label') { aVal = a.label; bVal = b.label; }
                else if (sortField === 'account') { aVal = a.accountNumber; bVal = b.accountNumber; }
                else if (sortField === 'level') { aVal = a.level; bVal = b.level; }
                else if (sortField === 'zone') { aVal = a.zone; bVal = b.zone; }
                else if (sortField === 'parentMeter') { aVal = a.parentMeter || ''; bVal = b.parentMeter || ''; }
                else if (sortField === 'type') { aVal = a.type; bVal = b.type; }
                else if (months.includes(sortField)) {
                    aVal = getConsumption(a, sortField);
                    bVal = getConsumption(b, sortField);
                }

                if (typeof aVal === 'string') {
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal as string)
                        : (bVal as string).localeCompare(aVal);
                }
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }

        return result;
    }, [meters, searchTerm, selectedLevels, selectedZones, selectedTypes, allTypes, sortField, sortDirection, months]);

    // Group by zone if enabled
    const groupedMeters = useMemo(() => {
        if (!groupByZone) return null;

        const groups: Record<string, WaterMeter[]> = {};
        filteredMeters.forEach(meter => {
            const zone = meter.zone || 'N/A';
            if (!groups[zone]) groups[zone] = [];
            groups[zone].push(meter);
        });

        // Sort zones
        const sortedZones = Object.keys(groups).sort((a, b) => {
            const aIdx = ALL_ZONES.indexOf(a);
            const bIdx = ALL_ZONES.indexOf(b);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });

        return sortedZones.map(zone => ({ zone, meters: groups[zone] }));
    }, [filteredMeters, groupByZone]);

    // Pagination
    const effectivePageSize = pageSize === 'All' ? filteredMeters.length : pageSize;
    const totalPages = Math.ceil(filteredMeters.length / effectivePageSize);
    const startIndex = (currentPage - 1) * effectivePageSize;
    const paginatedMeters = useMemo(
        () => filteredMeters.slice(startIndex, startIndex + effectivePageSize),
        [filteredMeters, startIndex, effectivePageSize]
    );

    // Flatten grouped/flat modes into one row list so both can be virtualized.
    // Grouped mode renders ALL rows (no pagination), so large zones rely on this.
    const bodyRows = useMemo<TableRowModel[]>(() => {
        if (groupByZone && groupedMeters) {
            const rows: TableRowModel[] = [];
            groupedMeters.forEach(group => {
                rows.push({ kind: 'group-header', zone: group.zone, meterCount: group.meters.length });
                group.meters.forEach(meter => rows.push({ kind: 'meter', meter }));
            });
            return rows;
        }
        return paginatedMeters.map(meter => ({ kind: 'meter', meter }));
    }, [groupByZone, groupedMeters, paginatedMeters]);

    // Window-scroll virtualization with spacer rows — only above 100 rows
    const { bodyRef, virtualItems, paddingTop, paddingBottom } = useVirtualTableRows({
        count: bodyRows.length,
        enabled: bodyRows.length > 100,
    });

    // Reset page when filters change
    const handleFilterChange = useCallback(() => {
        setCurrentPage(1);
    }, []);

    // Sort handler
    const handleSort = useCallback((field: string) => {
        setSortField(prev => {
            if (prev === field) {
                setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                return prev;
            }
            setSortDirection('asc');
            return field;
        });
    }, []);

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['Label', 'Account #', 'Level', 'Zone', 'Parent Meter', 'Type', ...visibleMonths];
        const rows = filteredMeters.map(m => [
            m.label,
            m.accountNumber,
            m.level,
            m.zone,
            m.parentMeter || '',
            m.type,
            ...visibleMonths.map(month => getConsumption(m, month).toString())
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `water-meters-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedLevels([...ALL_LEVELS]);
        setSelectedZones([...ALL_ZONES]);
        setSelectedTypes([...allTypes]);
        setGroupByZone(false);
        setSortField(null);
        handleFilterChange();
    };

    const hasActiveFilters = searchTerm ||
        selectedLevels.length < ALL_LEVELS.length ||
        selectedZones.length < ALL_ZONES.length ||
        (selectedTypes.length > 0 && selectedTypes.length < allTypes.length);

    // Render table row — zebra striping derives from the row's index in the
    // full body list (not DOM position) so it stays stable under virtualization
    const renderRow = (meter: WaterMeter, rowIndex: number) => {
        const zoneBorder = ZONE_BORDER_VAR[meter.zone] || ZONE_BORDER_VAR['N/A'];
        const levelStyle = LEVEL_STYLES[meter.level] || 'bg-muted text-foreground';

        return (
            <tr
                key={meter.accountNumber}
                style={{ borderLeftColor: zoneBorder }}
                className={cn(
                    "border-b border-border/80 dark:border-border/80 hover:bg-secondary/5 dark:hover:bg-muted/40 transition-colors",
                    rowIndex % 2 === 1 && "bg-muted/40 dark:bg-muted/20",
                    "border-l-2"
                )}
            >
                <td className="py-4 px-5 font-medium whitespace-nowrap col-sticky w-[120px] sm:w-[180px] md:w-[200px]">
                    {meter.label}
                </td>
                <td className="py-4 px-5 text-muted-foreground meter text-sm col-sticky left-[120px] sm:left-[180px] md:left-[200px]">
                    {meter.accountNumber}
                </td>
                <td className="py-4 px-5 text-center">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", levelStyle)}>
                        {meter.level}
                    </span>
                </td>
                <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-badge-sage/25 text-badge-sage-fg ring-1 ring-badge-sage/55 dark:bg-badge-sage/10 dark:ring-badge-sage/20 whitespace-nowrap">
                        {ZONE_NAMES[meter.zone] || meter.zone}
                    </span>
                </td>
                <td className="py-4 px-5 text-muted-foreground dark:text-muted-foreground text-sm max-w-[150px] truncate">
                    {meter.parentMeter || '—'}
                </td>
                <td className="py-4 px-5">
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                        meter.type === 'Supply'
                            ? 'bg-badge-blue/12 text-badge-blue-fg ring-1 ring-badge-blue/30 dark:bg-badge-blue/20 dark:ring-badge-blue/30'
                            : 'bg-secondary text-primary-foreground ring-1 ring-secondary/60 dark:bg-secondary/90 dark:text-primary-foreground dark:ring-secondary/50'
                    )}>
                        {meter.type}
                    </span>
                </td>
                {visibleMonths.map(month => {
                    const val = getConsumption(meter, month);
                    return (
                        <td key={month} className="py-4 px-5 num text-sm text-foreground/80">
                            {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>}
                        </td>
                    );
                })}
            </tr>
        );
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <TableToolbar>
                {/* Search */}
                <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        aria-label="Search meters by name, account number, or zone"
                        placeholder="Search meters..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
                        className="pl-10 pr-4 py-2 w-full rounded-full border border-border/80 dark:border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                    />
                </div>

                {/* Filters */}
                <MultiSelectDropdown
                    label="Level"
                    options={ALL_LEVELS}
                    selected={selectedLevels}
                    onChange={(s) => { setSelectedLevels(s); handleFilterChange(); }}
                />

                <MultiSelectDropdown
                    label="Zone"
                    options={ALL_ZONES}
                    selected={selectedZones}
                    onChange={(s) => { setSelectedZones(s); handleFilterChange(); }}
                    getDisplayName={(z) => ZONE_NAMES[z] || z}
                />

                <MultiSelectDropdown
                    label="Type"
                    options={allTypes}
                    selected={selectedTypes}
                    onChange={(s) => { setSelectedTypes(s); handleFilterChange(); }}
                />

                {/* Group By Toggle */}
                <button
                    type="button"
                    onClick={() => setGroupByZone(!groupByZone)}
                    aria-pressed={groupByZone}
                    aria-label={groupByZone ? "Disable zone grouping" : "Group rows by zone"}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                        groupByZone
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-border dark:hover:border-border text-foreground/80"
                    )}
                >
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Group by Zone</span>
                </button>

                {/* Column Visibility */}
                <ColumnVisibilityDropdown
                    months={months}
                    visibleMonths={visibleMonths}
                    onChange={setVisibleMonths}
                />

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        aria-label="Clear all active filters"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                    >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        Clear
                    </button>
                )}

                {/* Export */}
                <button
                    type="button"
                    onClick={handleExportCSV}
                    aria-label="Export filtered meters to CSV"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto"
                >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Export CSV</span>
                </button>

                {/* Record Count */}
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    <span className="font-semibold text-foreground/80">{filteredMeters.length}</span>
                    {filteredMeters.length !== meters.length && (
                        <span> of {meters.length}</span>
                    )} records
                </div>
            </TableToolbar>

            {/* Active Filters Pills */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    {searchTerm && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-muted text-foreground/80">
                            Search: &ldquo;{searchTerm}&rdquo;
                            <button onClick={() => setSearchTerm('')} className="hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedLevels.length < ALL_LEVELS.length && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Levels: {selectedLevels.join(', ')}
                            <button onClick={() => setSelectedLevels([...ALL_LEVELS])} className="hover:text-blue-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedZones.length < ALL_ZONES.length && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            {selectedZones.length} zone{selectedZones.length !== 1 ? 's' : ''}
                            <button onClick={() => setSelectedZones([...ALL_ZONES])} className="hover:text-emerald-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedTypes.length > 0 && selectedTypes.length < allTypes.length && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}
                            <button onClick={() => setSelectedTypes([...allTypes])} className="hover:text-purple-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Table */}
            <div
                role="region"
                aria-label="Water meter consumption table. Scroll horizontally to view more months."
                tabIndex={0}
                className="ops-table-shell scroll-hint-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <table className="ops-table">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-muted/80">
                            <th
                                scope="col"
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors col-sticky z-20 w-[120px] sm:w-[180px] md:w-[200px]"
                                onClick={() => handleSort('label')}
                            >
                                <div className="flex items-center gap-1.5 truncate">Label <SortIcon field="label" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors col-sticky left-[120px] sm:left-[180px] md:left-[200px] z-20 min-w-[100px]"
                                onClick={() => handleSort('account')}
                            >
                                <div className="flex items-center gap-1.5">Account # <SortIcon field="account" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-center py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors min-w-[70px]"
                                onClick={() => handleSort('level')}
                            >
                                <div className="flex items-center justify-center gap-1.5">Level <SortIcon field="level" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors min-w-[100px]"
                                onClick={() => handleSort('zone')}
                            >
                                <div className="flex items-center gap-1.5">Zone <SortIcon field="zone" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors min-w-[150px]"
                                onClick={() => handleSort('parentMeter')}
                            >
                                <div className="flex items-center gap-1.5">Parent <SortIcon field="parentMeter" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors min-w-[120px]"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center gap-1.5">Type <SortIcon field="type" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            {visibleMonths.map(month => (
                                <th
                                    key={month}
                                    scope="col"
                                    className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-muted-foreground border-b-2 border-border cursor-pointer hover:bg-muted/60 transition-colors min-w-[80px] whitespace-nowrap"
                                    onClick={() => handleSort(month)}
                                >
                                    <div className="flex items-center justify-end gap-1.5">{month} <SortIcon field={month} currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody ref={bodyRef}>
                        {/* Spacer row — keeps virtualized rows at their true scroll offset */}
                        {paddingTop > 0 && (
                            <tr aria-hidden="true">
                                <td colSpan={6 + visibleMonths.length} style={{ height: paddingTop, padding: 0, border: 0 }} />
                            </tr>
                        )}
                        {virtualItems.map(vi => {
                            const row = bodyRows[vi.index];
                            if (row.kind === 'group-header') {
                                return (
                                    /* Group Header */
                                    <tr key={`group-${row.zone}`} className={cn("border-b border-border", ZONE_BG_COLORS[row.zone] || ZONE_BG_COLORS['N/A'])}>
                                        <td colSpan={6 + visibleMonths.length} className="py-2.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-semibold text-foreground/80">
                                                    {ZONE_NAMES[row.zone] || row.zone}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-sm bg-border dark:bg-muted text-muted-foreground">
                                                    {row.meterCount} meter{row.meterCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            return renderRow(row.meter, vi.index);
                        })}
                        {paddingBottom > 0 && (
                            <tr aria-hidden="true">
                                <td colSpan={6 + visibleMonths.length} style={{ height: paddingBottom, padding: 0, border: 0 }} />
                            </tr>
                        )}

                        {filteredMeters.length === 0 && (
                            <tr>
                                <td colSpan={6 + visibleMonths.length} className="py-12 text-center text-muted-foreground">
                                    No meters found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!groupByZone && filteredMeters.length > 0 && (
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredMeters.length}
                    pageSize={pageSize}
                    startIndex={startIndex}
                    endIndex={Math.min(startIndex + effectivePageSize, filteredMeters.length)}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
            )}
        </div>
    );
}
