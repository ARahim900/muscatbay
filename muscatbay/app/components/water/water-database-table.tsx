"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
    Search, ChevronDown, ChevronRight,
    Download, Columns, Users,
    X, Check
} from 'lucide-react';
import { WaterMeter, getConsumption, ZONE_CONFIG } from '@/lib/water-data';
import { cn } from '@/lib/utils';
import { MultiSelectDropdown, SortIcon, TablePagination, TableToolbar } from '@/components/shared/data-table';

interface WaterDatabaseTableProps {
    meters: WaterMeter[];
    months: string[];
}

// Zone colors for left border (pastel)
const ZONE_COLORS: Record<string, string> = {
    'Zone_01_(FM)': 'border-l-emerald-400',
    'Zone_03_(A)': 'border-l-blue-400',
    'Zone_03_(B)': 'border-l-indigo-400',
    'Zone_05': 'border-l-purple-400',
    'Zone_08': 'border-l-pink-400',
    'Zone_VS': 'border-l-amber-400',
    'DC': 'border-l-orange-400',
    'Main': 'border-l-slate-400',
    'N/A': 'border-l-slate-300',
};

const ZONE_BG_COLORS: Record<string, string> = {
    'Zone_01_(FM)': 'bg-emerald-50 dark:bg-emerald-950/30',
    'Zone_03_(A)': 'bg-blue-50 dark:bg-blue-950/30',
    'Zone_03_(B)': 'bg-indigo-50 dark:bg-indigo-950/30',
    'Zone_05': 'bg-purple-50 dark:bg-purple-950/30',
    'Zone_08': 'bg-pink-50 dark:bg-pink-950/30',
    'Zone_VS': 'bg-amber-50 dark:bg-amber-950/30',
    'DC': 'bg-orange-50 dark:bg-orange-950/30',
    'Main': 'bg-slate-50 dark:bg-slate-900/50',
    'N/A': 'bg-slate-50 dark:bg-slate-900/30',
};

// Level badge colors — Muscat Bay palette (#A4DCC6 mint | #337FCA blue | #4E4456 purple | #E05050 coral | #F4C741 amber)
const LEVEL_STYLES: Record<string, string> = {
    'L1': 'bg-[#A4DCC6]/25 text-[#0d5c38] ring-1 ring-[#A4DCC6]/50 dark:bg-[#A4DCC6]/15 dark:text-[#A4DCC6] dark:ring-[#A4DCC6]/30',
    'L2': 'bg-[#337FCA]/15 text-[#1a4fa8] ring-1 ring-[#337FCA]/35 dark:bg-[#337FCA]/20 dark:text-[#337FCA] dark:ring-[#337FCA]/35',
    'L3': 'bg-[#4E4456]/10 text-[#4E4456] ring-1 ring-[#4E4456]/25 dark:bg-[#4E4456]/35 dark:text-[#c6bece] dark:ring-[#4E4456]/40',
    'L4': 'bg-[#E05050]/12 text-[#8a1515] ring-1 ring-[#E05050]/35 dark:bg-[#E05050]/20 dark:text-[#E05050] dark:ring-[#E05050]/35',
    'DC': 'bg-[#F4C741]/20 text-[#7a5200] ring-1 ring-[#F4C741]/45 dark:bg-[#F4C741]/15 dark:text-[#F4C741] dark:ring-[#F4C741]/35',
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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm text-slate-600 dark:text-slate-300 transition-all duration-200"
            >
                <Columns className="w-3.5 h-3.5" />
                <span>Columns</span>
                <span className="text-sm text-slate-500">({visibleMonths.length}/{months.length})</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-[220px] sm:w-[280px] py-1">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                            <button onClick={showAll} className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                                All ({months.length})
                            </button>
                            <button onClick={showLast12} className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                                Last 12
                            </button>
                            <button onClick={showLast6} className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
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
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
    const paginatedMeters = filteredMeters.slice(startIndex, startIndex + effectivePageSize);

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

    // Render table row
    const renderRow = (meter: WaterMeter, _index: number, isGrouped: boolean = false) => {
        const zoneColor = ZONE_COLORS[meter.zone] || ZONE_COLORS['N/A'];
        const levelStyle = LEVEL_STYLES[meter.level] || 'bg-slate-100 text-slate-700';

        return (
            <tr
                key={meter.accountNumber}
                className={cn(
                    "border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-[#00d2b3]/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20",
                    "border-l-4",
                    zoneColor
                )}
            >
                <td className="py-4 px-5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap sticky left-0 bg-inherit z-10 w-[140px] sm:w-[180px] md:w-[200px]">
                    {meter.label}
                </td>
                <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-mono text-sm sticky left-[140px] sm:left-[180px] md:left-[200px] bg-inherit z-10">
                    {meter.accountNumber}
                </td>
                <td className="py-4 px-5 text-center">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", levelStyle)}>
                        {meter.level}
                    </span>
                </td>
                <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#C6D8D3]/25 text-[#2d5048] ring-1 ring-[#C6D8D3]/55 dark:bg-[#C6D8D3]/10 dark:text-[#C6D8D3] dark:ring-[#C6D8D3]/20 whitespace-nowrap">
                        {ZONE_NAMES[meter.zone] || meter.zone}
                    </span>
                </td>
                <td className="py-4 px-5 text-slate-500 dark:text-slate-500 text-sm max-w-[150px] truncate">
                    {meter.parentMeter || '—'}
                </td>
                <td className="py-4 px-5">
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                        meter.type === 'Supply'
                            ? 'bg-[#337FCA]/12 text-[#1a4fa8] ring-1 ring-[#337FCA]/30 dark:bg-[#337FCA]/20 dark:text-[#337FCA] dark:ring-[#337FCA]/30'
                            : 'bg-[#4E4456]/10 text-[#4E4456] ring-1 ring-[#4E4456]/20 dark:bg-[#4E4456]/30 dark:text-[#c6bece] dark:ring-[#4E4456]/35'
                    )}>
                        {meter.type}
                    </span>
                </td>
                {visibleMonths.map(month => {
                    const val = getConsumption(meter, month);
                    return (
                        <td key={month} className="py-4 px-5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                            {val > 0 ? val.toLocaleString('en-US') : <span className="text-slate-300 dark:text-slate-600">—</span>}
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
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search meters..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
                        className="pl-10 pr-4 py-2 w-full rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
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
                    onClick={() => setGroupByZone(!groupByZone)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                        groupByZone
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                    )}
                >
                    <Users className="w-3.5 h-3.5" />
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
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}

                {/* Export */}
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto"
                >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                </button>

                {/* Record Count */}
                <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredMeters.length}</span>
                    {filteredMeters.length !== meters.length && (
                        <span> of {meters.length}</span>
                    )} records
                </div>
            </TableToolbar>

            {/* Active Filters Pills */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    {searchTerm && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Search: "{searchTerm}"
                            <button onClick={() => setSearchTerm('')} className="hover:text-slate-900">
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
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-slate-50 dark:bg-slate-800/80">
                            <th
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-20 w-[140px] sm:w-[180px] md:w-[200px]"
                                onClick={() => handleSort('label')}
                            >
                                <div className="flex items-center gap-1.5">Label <SortIcon field="label" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors sticky left-[140px] sm:left-[180px] md:left-[200px] bg-slate-50 dark:bg-slate-800/80 z-20 min-w-[100px]"
                                onClick={() => handleSort('account')}
                            >
                                <div className="flex items-center gap-1.5">Account # <SortIcon field="account" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                className="text-center py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[70px]"
                                onClick={() => handleSort('level')}
                            >
                                <div className="flex items-center justify-center gap-1.5">Level <SortIcon field="level" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[100px]"
                                onClick={() => handleSort('zone')}
                            >
                                <div className="flex items-center gap-1.5">Zone <SortIcon field="zone" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[150px]"
                                onClick={() => handleSort('parentMeter')}
                            >
                                <div className="flex items-center gap-1.5">Parent <SortIcon field="parentMeter" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th
                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[120px]"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center gap-1.5">Type <SortIcon field="type" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            {visibleMonths.map(month => (
                                <th
                                    key={month}
                                    className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[80px] whitespace-nowrap"
                                    onClick={() => handleSort(month)}
                                >
                                    <div className="flex items-center justify-end gap-1.5">{month} <SortIcon field={month} currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groupByZone && groupedMeters ? (
                            groupedMeters.map(group => (
                                <React.Fragment key={group.zone}>
                                    {/* Group Header */}
                                    <tr className={cn("border-b border-slate-200 dark:border-slate-700", ZONE_BG_COLORS[group.zone] || ZONE_BG_COLORS['N/A'])}>
                                        <td colSpan={6 + visibleMonths.length} className="py-2.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {ZONE_NAMES[group.zone] || group.zone}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                    {group.meters.length} meter{group.meters.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Group Rows */}
                                    {group.meters.map((meter, idx) => renderRow(meter, idx, true))}
                                </React.Fragment>
                            ))
                        ) : (
                            paginatedMeters.map((meter, idx) => renderRow(meter, idx))
                        )}

                        {filteredMeters.length === 0 && (
                            <tr>
                                <td colSpan={6 + visibleMonths.length} className="py-12 text-center text-slate-500 dark:text-slate-400">
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
