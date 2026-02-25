"use client";

import { useEffect, useState, useMemo } from "react";
import { getAssets, Asset } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchAssetsAction } from "@/actions/assets";
import { StatsGrid } from "@/components/shared/stats-grid";
import { StatsGridSkeleton, TableBodySkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Boxes, MapPin, DollarSign, Wrench, Search, Plus, Database, AlertCircle, Download, X } from "lucide-react";
import { format } from "date-fns";
import { MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills, TableToolbar, type PageSizeOption } from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";

// Mapping from UI sort field to Supabase column
const SORT_FIELD_MAP: Record<string, string> = {
    name: 'Asset_Name',
    serial: 'Asset_Tag',
    category: 'Discipline',
    location: 'Location_Name',
    status: 'Status',
};

const STATUS_OPTIONS = ['Active', 'Under Maintenance', 'Decommissioned', 'In Storage'];

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...STATUS_OPTIONS]);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
    const [error, setError] = useState<string | null>(null);

    // Sorting state
    const [sortField, setSortField] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);
    const [totalCount, setTotalCount] = useState(0);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    async function loadData() {
        setLoading(true);
        const effectivePageSize = pageSize === 'All' ? 9999 : pageSize;
        const supabaseSort = SORT_FIELD_MAP[sortField] || 'Asset_Name';
        const statusFilterForServer = selectedStatuses.length < STATUS_OPTIONS.length ? selectedStatuses : undefined;

        try {
            if (!isSupabaseConfigured()) {
                const mockData = await getAssets();
                setAssets(mockData);
                setTotalCount(mockData.length);
                setDataSource('mock');
                setError("Supabase not configured. Using demo data.");
                setLoading(false);
                return;
            }

            const { data, count, error: fetchError } = await fetchAssetsAction(
                currentPage,
                effectivePageSize,
                debouncedSearch,
                supabaseSort,
                sortDirection,
                statusFilterForServer
            );

            if (fetchError) {
                throw new Error(fetchError);
            }

            if (data) {
                setAssets(data);
                setTotalCount(count);
                setDataSource('supabase');
            } else {
                setAssets([]);
                setTotalCount(0);
            }
        } catch (e) {
            console.error("Supabase fetch failed:", e);
            setError("Connection failed (check extensions/adblock). Using demo data.");
            const mockData = await getAssets();
            setAssets(mockData);
            setTotalCount(mockData.length);
            setDataSource('mock');
        } finally {
            setLoading(false);
        }
    }

    // Reload when page, size, search, sort, or status changes
    useEffect(() => {
        loadData();
    }, [currentPage, pageSize, debouncedSearch, sortField, sortDirection, selectedStatuses]); // eslint-disable-line react-hooks/exhaustive-deps

    // Client-side filtering for mock data only
    const filteredAssets = useMemo(() => {
        if (dataSource === 'supabase') return assets; // Already filtered server-side

        let result = [...assets];

        if (search) {
            const term = search.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term) ||
                item.serialNumber.toLowerCase().includes(term)
            );
        }

        if (selectedStatuses.length < STATUS_OPTIONS.length) {
            result = result.filter(item => selectedStatuses.includes(item.status));
        }

        // Client-side sort for mock data
        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';

                switch (sortField) {
                    case 'name': aVal = a.name; bVal = b.name; break;
                    case 'serial': aVal = a.serialNumber; bVal = b.serialNumber; break;
                    case 'category': aVal = a.type; bVal = b.type; break;
                    case 'location': aVal = a.location; bVal = b.location; break;
                    case 'status': aVal = a.status; bVal = b.status; break;
                    case 'value': aVal = a.value; bVal = b.value; break;
                }

                if (typeof aVal === 'string') {
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                }
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }

        return result;
    }, [assets, search, selectedStatuses, sortField, sortDirection, dataSource]);

    const effectivePageSize = pageSize === 'All' ? totalCount : (pageSize as number);
    const totalPages = Math.ceil(totalCount / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;

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
        const data = filteredAssets.map(a => ({
            'Asset Name': a.name,
            'Serial Number': a.serialNumber,
            'Category': a.type,
            'Location': a.location,
            'Status': a.status,
            'Last Service': a.lastService && !isNaN(new Date(a.lastService).getTime())
                ? format(new Date(a.lastService), "MMM d, yyyy") : '-',
            'Value (OMR)': a.value,
        }));
        exportToCSV(data, `assets-${getDateForFilename()}`);
    };

    const hasActiveFilters = search || selectedStatuses.length < STATUS_OPTIONS.length;

    const clearFilters = () => {
        setSearch('');
        setSelectedStatuses([...STATUS_OPTIONS]);
        setCurrentPage(1);
    };

    const stats = useMemo(() => {
        const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
        const activeCount = assets.filter(a => a.status === 'Active').length;
        const maintenanceCount = assets.filter(a => a.status === 'Under Maintenance').length;
        const totalItems = totalCount > 0 ? totalCount : assets.length;

        return [
            {
                label: "TOTAL ASSETS",
                value: totalItems.toString(),
                subtitle: dataSource === 'supabase' ? "Across all pages" : "All Items",
                icon: Boxes,
                variant: "water" as const
            },
            {
                label: "TOTAL VALUE",
                value: totalValue > 0 ? `OMR ${totalValue.toLocaleString('en-US')}` : 'N/A',
                subtitle: dataSource === 'supabase' && totalValue === 0 ? "Not in database" : "On this page",
                icon: DollarSign,
                variant: "success" as const
            },
            {
                label: "ACTIVE ASSETS",
                value: activeCount.toString(),
                subtitle: "On this page",
                icon: MapPin,
                variant: "success" as const
            },
            {
                label: "IN MAINTENANCE",
                value: maintenanceCount.toString(),
                subtitle: "On this page",
                icon: Wrench,
                variant: "warning" as const
            }
        ];
    }, [assets, totalCount, dataSource]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success-hover';
            case 'Under Maintenance': return 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning';
            case 'Decommissioned': return 'bg-mb-danger-light text-mb-danger dark:bg-mb-danger-light/20 dark:text-mb-danger-hover';
            case 'In Storage': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Assets Management"
                description="Track and manage all company assets and equipment"
                action={{ label: "Register Asset", icon: Plus }}
            />

            {/* Data source indicator */}
            <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                <span className="text-muted-foreground">Data source:</span>
                <Badge variant={dataSource === 'supabase' ? 'default' : 'secondary'} className="gap-2 pl-2">
                    {dataSource === 'supabase' ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mb-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-mb-success"></span>
                            </span>
                            Supabase (Live)
                        </>
                    ) : (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-mb-danger"></span>
                            </span>
                            Demo Data
                        </>
                    )}
                </Badge>
                {error && (
                    <span className="text-mb-warning flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </span>
                )}
            </div>

            <StatsGrid stats={stats} />

            <div className="space-y-4">
                {/* Toolbar */}
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, location or serial..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>

                    <MultiSelectDropdown
                        label="Status"
                        options={STATUS_OPTIONS}
                        selected={selectedStatuses}
                        onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }}
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
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> assets
                    </div>
                </TableToolbar>

                {/* Active Filter Pills */}
                <ActiveFilterPills pills={[
                    ...(search ? [{
                        key: 'search',
                        label: `Search: "${search}"`,
                        onRemove: () => { setSearch(''); setCurrentPage(1); }
                    }] : []),
                    ...(selectedStatuses.length < STATUS_OPTIONS.length ? [{
                        key: 'statuses',
                        label: `${selectedStatuses.length} status${selectedStatuses.length !== 1 ? 'es' : ''}`,
                        colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                        onRemove: () => { setSelectedStatuses([...STATUS_OPTIONS]); setCurrentPage(1); }
                    }] : []),
                ]} />

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                    <Skeleton className="h-4 w-32" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="h-8 w-8" />
                                <p>No assets found</p>
                            </div>
                        </div>
                    ) : (
                        filteredAssets.map((asset, idx) => (
                            <div key={asset.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{asset.serialNumber}</p>
                                    </div>
                                    <Badge variant="outline" className={`${getStatusBadge(asset.status)} border-transparent text-xs flex-shrink-0`}>
                                        {asset.status}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Boxes className="w-3 h-3" />
                                        {asset.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {asset.location}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400">
                                        Service: {asset.lastService && !isNaN(new Date(asset.lastService).getTime())
                                            ? format(new Date(asset.lastService), "MMM d, yyyy")
                                            : '-'}
                                    </span>
                                    <span className="font-mono font-semibold text-primary">
                                        {asset.value > 0 ? `${asset.value.toLocaleString('en-US')} OMR` : '-'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1.5">Asset Name <SortIcon field="name" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell" onClick={() => handleSort('serial')}>
                                    <div className="flex items-center gap-1.5">Serial # <SortIcon field="serial" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1.5">Category <SortIcon field="category" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('location')}>
                                    <div className="flex items-center gap-1.5">Location <SortIcon field="location" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1.5">Status <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 hidden xl:table-cell">Last Service</th>
                                <th className="text-right py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('value')}>
                                    <div className="flex items-center justify-end gap-1.5">Value (OMR) <SortIcon field="value" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableBodySkeleton columns={7} rows={10} />
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">No assets found</td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset, idx) => (
                                    <tr key={asset.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{asset.name}</td>
                                        <td className="py-2 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">{asset.serialNumber}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs">{asset.type}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs">{asset.location}</td>
                                        <td className="py-2 px-3">
                                            <Badge variant="outline" className={`${getStatusBadge(asset.status)} border-transparent text-xs`}>
                                                {asset.status}
                                            </Badge>
                                        </td>
                                        <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                                            {asset.lastService && !isNaN(new Date(asset.lastService).getTime())
                                                ? format(new Date(asset.lastService), "MMM d, yyyy")
                                                : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{asset.value.toLocaleString('en-US')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        startIndex={startIndex}
                        endIndex={Math.min(startIndex + effectivePageSize, totalCount)}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                )}
            </div>
        </div>
    );
}
