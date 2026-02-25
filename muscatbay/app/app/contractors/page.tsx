"use client";

import { useEffect, useState, useMemo } from "react";
import {
    getContractorTrackerData,
    isSupabaseConfigured,
    ContractorTracker
} from "@/lib/supabase";
import { StatsGridSkeleton, TableSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, DollarSign, AlertCircle, Download, Calendar, Building2, FileText, RefreshCw, Wifi, WifiOff, X } from "lucide-react";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills, TableToolbar, type PageSizeOption } from "@/components/shared/data-table";

export default function ContractorsPage() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    // Sorting and pagination state
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    // Data state for new Contractor_Tracker table
    const [contractors, setContractors] = useState<ContractorTracker[]>([]);
    const [dataSource, setDataSource] = useState<'supabase' | 'none'>('none');

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Check if Supabase is configured
            if (!isSupabaseConfigured()) {
                setDataSource('none');
                setLoading(false);
                return;
            }

            try {
                const data = await getContractorTrackerData();
                setContractors(data);
                setDataSource(data.length > 0 ? 'supabase' : 'none');
            } catch (e) {
                console.error("Failed to load contractors data", e);
                setDataSource('none');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const getStatusColor = (status: string | null) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('active')) return 'bg-mb-success-light text-mb-success hover:bg-mb-success-light/80 dark:bg-mb-success-light/20 dark:text-mb-success-hover';
        if (s.includes('expired')) return 'bg-mb-danger-light text-mb-danger hover:bg-mb-danger-light/80 dark:bg-mb-danger-light/20 dark:text-mb-danger-hover';
        if (s.includes('retain')) return 'bg-mb-warning-light text-mb-warning hover:bg-mb-warning-light/80 dark:bg-mb-warning-light/20 dark:text-mb-warning';
        return 'bg-mb-primary-light/20 text-mb-primary dark:bg-mb-primary-light/10 dark:text-mb-primary-light';
    };

    const getContractTypeColor = (type: string | null) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('contract')) return 'bg-mb-info-light text-mb-info dark:bg-mb-info-light/20 dark:text-mb-info';
        if (t.includes('po') || t.includes('purchase')) return 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success';
        if (t.includes('quotation')) return 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    };

    // Get unique statuses and contract types for filters
    const uniqueStatuses = useMemo(() =>
        [...new Set(contractors.map(c => c.Status).filter(Boolean))] as string[],
        [contractors]
    );
    const uniqueContractTypes = useMemo(() =>
        [...new Set(contractors.map(c => c["Contract Type"]).filter(Boolean))] as string[],
        [contractors]
    );

    // Initialize multi-select filters
    useEffect(() => {
        if (selectedStatuses.length === 0 && uniqueStatuses.length > 0) {
            setSelectedStatuses([...uniqueStatuses]);
        }
    }, [uniqueStatuses]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedTypes.length === 0 && uniqueContractTypes.length > 0) {
            setSelectedTypes([...uniqueContractTypes]);
        }
    }, [uniqueContractTypes]); // eslint-disable-line react-hooks/exhaustive-deps

    // Filter and sort contractors
    const filteredContractors = useMemo(() => {
        let result = [...contractors];

        // Search
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(c =>
                c.Contractor?.toLowerCase().includes(term) ||
                c["Service Provided"]?.toLowerCase().includes(term) ||
                c.Note?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) {
            result = result.filter(c => c.Status && selectedStatuses.includes(c.Status));
        }

        // Type filter
        if (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length) {
            result = result.filter(c => c["Contract Type"] && selectedTypes.includes(c["Contract Type"]));
        }

        // Sort
        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';

                switch (sortField) {
                    case 'contractor': aVal = a.Contractor || ''; bVal = b.Contractor || ''; break;
                    case 'service': aVal = a["Service Provided"] || ''; bVal = b["Service Provided"] || ''; break;
                    case 'status': aVal = a.Status || ''; bVal = b.Status || ''; break;
                    case 'contractType': aVal = a["Contract Type"] || ''; bVal = b["Contract Type"] || ''; break;
                    case 'startDate': aVal = a["Start Date"] || ''; bVal = b["Start Date"] || ''; break;
                    case 'endDate': aVal = a["End Date"] || ''; bVal = b["End Date"] || ''; break;
                    case 'monthly': aVal = a["Contract (OMR)/Month"] || 0; bVal = b["Contract (OMR)/Month"] || 0; break;
                    case 'annual': aVal = a["Annual Value (OMR)"] || 0; bVal = b["Annual Value (OMR)"] || 0; break;
                    case 'renewal': aVal = a["Renewal Plan"] || ''; bVal = b["Renewal Plan"] || ''; break;
                    case 'note': aVal = a.Note || ''; bVal = b.Note || ''; break;
                }

                if (typeof aVal === 'string') {
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                }
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }

        return result;
    }, [contractors, search, selectedStatuses, uniqueStatuses, selectedTypes, uniqueContractTypes, sortField, sortDirection]);

    // Pagination
    const effectivePageSize = pageSize === 'All' ? filteredContractors.length : pageSize;
    const totalPages = Math.ceil(filteredContractors.length / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;
    const paginatedContractors = filteredContractors.slice(startIndex, startIndex + effectivePageSize);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        exportToCSV(
            filteredContractors.map(c => ({
                'Contractor': c.Contractor || '',
                'Service Provided': c["Service Provided"] || '',
                'Status': c.Status || '',
                'Contract Type': c["Contract Type"] || '',
                'Start Date': c["Start Date"] || '',
                'End Date': c["End Date"] || '',
                'Monthly (OMR)': c["Contract (OMR)/Month"] || '',
                'Yearly (OMR)': c["Contract Total (OMR)/Year"] || '',
                'Annual Value': c["Annual Value (OMR)"] || '',
                'Renewal Plan': c["Renewal Plan"] || '',
                'Note': c.Note || ''
            })),
            `contractors-${getDateForFilename()}`
        );
    };

    const hasActiveFilters = search ||
        (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) ||
        (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length);

    const clearFilters = () => {
        setSearch('');
        setSelectedStatuses([...uniqueStatuses]);
        setSelectedTypes([...uniqueContractTypes]);
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <StatsGridSkeleton />
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex gap-4 mb-6">
                        <Skeleton className="h-10 w-full max-w-sm" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <TableSkeleton columns={8} rows={8} />
                </div>
            </div>
        );
    }

    // Calculate summary stats
    const totalContractors = contractors.length;
    const activeContractors = contractors.filter(c => c.Status?.toLowerCase().includes('active')).length;
    const expiredContractors = contractors.filter(c => c.Status?.toLowerCase().includes('expired')).length;
    const totalAnnualValue = contractors.reduce((sum, c) => sum + (c["Annual Value (OMR)"] || 0), 0);

    const stats = [
        {
            label: "TOTAL CONTRACTORS",
            value: totalContractors.toString(),
            subtitle: "All registered providers",
            icon: Building2,
            variant: "primary" as const
        },
        {
            label: "ACTIVE CONTRACTS",
            value: activeContractors.toString(),
            subtitle: "Currently valid",
            icon: Users,
            variant: "success" as const
        },
        {
            label: "EXPIRED",
            value: expiredContractors.toString(),
            subtitle: "Action required",
            icon: AlertCircle,
            variant: "danger" as const
        },
        {
            label: "ANNUAL VALUE",
            value: `${totalAnnualValue.toLocaleString()} OMR`,
            subtitle: "Total commitments",
            icon: DollarSign,
            variant: "success" as const
        }
    ];

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Contractor Tracker"
                    description="Monitor AMC service providers, contracts, and renewal plans"
                    action={{ label: "Add Contractor", icon: Plus }}
                />
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${dataSource === 'supabase' ? 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success-hover' : 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning'}`}>
                        {dataSource === 'supabase' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {dataSource === 'supabase' ? 'Connected to Supabase' : 'No Data Connection'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Toolbar */}
            <div className="space-y-4">
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search contractors..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>

                    <MultiSelectDropdown
                        label="Status"
                        options={uniqueStatuses}
                        selected={selectedStatuses}
                        onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }}
                    />

                    <MultiSelectDropdown
                        label="Contract Type"
                        options={uniqueContractTypes}
                        selected={selectedTypes}
                        onChange={(s) => { setSelectedTypes(s); setCurrentPage(1); }}
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredContractors.length}</span>
                        {filteredContractors.length !== contractors.length && (
                            <span> of {contractors.length}</span>
                        )} contractors
                    </div>
                </TableToolbar>

                {/* Active Filter Pills */}
                <ActiveFilterPills pills={[
                    ...(search ? [{
                        key: 'search',
                        label: `Search: "${search}"`,
                        onRemove: () => { setSearch(''); setCurrentPage(1); }
                    }] : []),
                    ...(selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length ? [{
                        key: 'statuses',
                        label: `${selectedStatuses.length} status${selectedStatuses.length !== 1 ? 'es' : ''}`,
                        colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                        onRemove: () => { setSelectedStatuses([...uniqueStatuses]); setCurrentPage(1); }
                    }] : []),
                    ...(selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length ? [{
                        key: 'types',
                        label: `${selectedTypes.length} type${selectedTypes.length !== 1 ? 's' : ''}`,
                        colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                        onRemove: () => { setSelectedTypes([...uniqueContractTypes]); setCurrentPage(1); }
                    }] : []),
                ]} />

                {/* Table */}
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {paginatedContractors.map((contractor, index) => (
                        <div key={`mobile-${contractor.Contractor}-${index}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{contractor.Contractor || '-'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contractor["Service Provided"] || '-'}</p>
                                </div>
                                <Badge variant="secondary" className={`font-normal text-xs flex-shrink-0 ${getStatusColor(contractor.Status)}`}>
                                    {contractor.Status || 'N/A'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`font-normal text-xs ${getContractTypeColor(contractor["Contract Type"])}`}>
                                    {contractor["Contract Type"] || 'N/A'}
                                </Badge>
                                {contractor["Renewal Plan"] && (
                                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                        <RefreshCw className="h-3 w-3" />
                                        {contractor["Renewal Plan"]}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-400">Start:</span>{' '}
                                    <span className="text-slate-600 dark:text-slate-300">{contractor["Start Date"] || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">End:</span>{' '}
                                    <span className="text-slate-600 dark:text-slate-300">{contractor["End Date"] || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Monthly:</span>{' '}
                                    <span className="font-mono text-slate-700 dark:text-slate-300">{contractor["Contract (OMR)/Month"] || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Annual:</span>{' '}
                                    <span className="font-mono font-semibold text-primary">{contractor["Annual Value (OMR)"]?.toLocaleString() || '-'}</span>
                                </div>
                            </div>
                            {contractor.Note && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">{contractor.Note}</p>
                            )}
                        </div>
                    ))}
                    {filteredContractors.length === 0 && (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="h-8 w-8" />
                                <p>No contractors found matching your criteria.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('contractor')}>
                                    <div className="flex items-center gap-1.5">Contractor <SortIcon field="contractor" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('service')}>
                                    <div className="flex items-center gap-1.5">Service <SortIcon field="service" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1.5">Status <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('contractType')}>
                                    <div className="flex items-center gap-1.5">Type <SortIcon field="contractType" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell" onClick={() => handleSort('startDate')}>
                                    <div className="flex items-center gap-1.5">Start <SortIcon field="startDate" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell" onClick={() => handleSort('endDate')}>
                                    <div className="flex items-center gap-1.5">End <SortIcon field="endDate" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-right py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden xl:table-cell" onClick={() => handleSort('monthly')}>
                                    <div className="flex items-center justify-end gap-1.5">Monthly <SortIcon field="monthly" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-right py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('annual')}>
                                    <div className="flex items-center justify-end gap-1.5">Annual <SortIcon field="annual" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden xl:table-cell" onClick={() => handleSort('renewal')}>
                                    <div className="flex items-center gap-1.5">Renewal <SortIcon field="renewal" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 hidden xl:table-cell">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedContractors.map((contractor, index) => (
                                <tr key={`${contractor.Contractor}-${index}`} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                        {contractor.Contractor || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs">
                                        {contractor["Service Provided"] || '-'}
                                    </td>
                                    <td className="py-2 px-3">
                                        <Badge variant="secondary" className={`font-normal text-xs ${getStatusColor(contractor.Status)}`}>
                                            {contractor.Status || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td className="py-2 px-3">
                                        <Badge variant="outline" className={`font-normal text-xs ${getContractTypeColor(contractor["Contract Type"])}`}>
                                            {contractor["Contract Type"] || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {contractor["Start Date"] || '-'}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {contractor["End Date"] || '-'}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 hidden xl:table-cell">
                                        {contractor["Contract (OMR)/Month"] || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-xs font-semibold text-primary">
                                        {contractor["Annual Value (OMR)"]?.toLocaleString() || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-xs text-slate-600 dark:text-slate-400 hidden xl:table-cell">
                                        {contractor["Renewal Plan"] ? (
                                            <div className="flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3 text-blue-500" />
                                                <span>{contractor["Renewal Plan"]}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-500 max-w-[200px] truncate hidden xl:table-cell" title={contractor.Note || ''}>
                                        {contractor.Note || '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredContractors.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-8 w-8" />
                                            <p>No contractors found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredContractors.length > 0 && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredContractors.length}
                        pageSize={pageSize}
                        startIndex={startIndex}
                        endIndex={Math.min(startIndex + effectivePageSize, filteredContractors.length)}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                )}
            </div>
        </div>
    );
}
