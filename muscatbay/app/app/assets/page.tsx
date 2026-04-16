"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getAssets } from "@/lib/mock-data";
import type { Asset } from "@/entities/asset";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchAssetsAction, fetchAssetSummaryAction } from "@/actions/assets";
import { StatsGrid } from "@/components/shared/stats-grid";
import { StatsGridSkeleton, TableBodySkeleton, Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Boxes, MapPin, Wrench, Search, Plus, Download, X, Layers, ClipboardCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption } from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

// Mapping from UI sort field to Supabase column
const SORT_FIELD_MAP: Record<string, string> = {
    name: 'Asset_Name',
    serial: 'Asset_Tag',
    category: 'Category',
    manufacturer: 'Manufacturer_Brand',
    installYear: 'Install_Year',
    location: 'Location_Name',
    status: 'Status',
    discipline: 'Discipline',
    risk: 'ERL_Years',
};

const STATUS_OPTIONS = ['Working', 'Active', 'Under Maintenance', 'Decommissioned', 'In Storage', 'TO VERIFY'];

const DISCIPLINE_OPTIONS = [
    'STP Equipment',
    'Electrical',
    'Mechanical & Plumbing',
    'HVAC',
    'Civil',
    'Painting',
    'Village Square Assets',
    'Lifts & Transport',
    'Hotel Assets (JMB)',
];

export default function AssetsPage() {
    const [summary, setSummary] = useState<{
        total: number;
        activeFlagged: number;
        workingStatus: number;
        toVerify: number;
        criticalLifecycle: number;
        disciplines: number;
    }>({
        total: 0,
        activeFlagged: 0,
        workingStatus: 0,
        toVerify: 0,
        criticalLifecycle: 0,
        disciplines: 0,
    });
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...STATUS_OPTIONS]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([...DISCIPLINE_OPTIONS]);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

    const loadData = useCallback(async () => {
        setLoading(true);
        const effectivePageSize = pageSize === 'All' ? 9999 : pageSize;
        const supabaseSort = SORT_FIELD_MAP[sortField] || 'Asset_Name';
        const statusFilterForServer = selectedStatuses.length < STATUS_OPTIONS.length ? selectedStatuses : undefined;
        const disciplineFilterForServer = selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? selectedDisciplines : undefined;

        try {
            if (!isSupabaseConfigured()) {
                const mockData = await getAssets();
                setAssets(mockData);
                setTotalCount(mockData.length);
                setDataSource('mock');
                setError("Live data unavailable — showing demo data.");
                setLoading(false);
                return;
            }

            const { data, count, error: fetchError } = await fetchAssetsAction(
                currentPage,
                effectivePageSize,
                debouncedSearch,
                supabaseSort,
                sortDirection,
                statusFilterForServer,
                disciplineFilterForServer
            );

            if (fetchError) {
                throw new Error(fetchError);
            }

            if (data) {
                setAssets(data);
                setTotalCount(count);
                setDataSource('supabase');
                setLastUpdated(new Date());
                const summaryRes = await fetchAssetSummaryAction();
                if (!summaryRes.error) {
                    setSummary(summaryRes);
                }
            } else {
                setAssets([]);
                setTotalCount(0);
            }
        } catch (e) {
            console.error("Supabase fetch failed:", e);
            setError("Unable to load live data — showing demo data. Try disabling ad blockers if the issue persists.");
            const mockData = await getAssets();
            setAssets(mockData);
            setTotalCount(mockData.length);
            setDataSource('mock');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearch, sortField, sortDirection, selectedStatuses, selectedDisciplines]);

    // Reload when page, size, search, sort, status, or discipline changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Supabase real-time subscription for Assets_Register_Database table
    const { isLive } = useSupabaseRealtime({
        table: 'Assets_Register_Database',
        channelName: 'assets-register-rt',
        onChanged: () => loadData(),
        enabled: dataSource === 'supabase',
    });

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

        if (selectedDisciplines.length < DISCIPLINE_OPTIONS.length) {
            result = result.filter(item => selectedDisciplines.includes(item.discipline));
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
                    case 'manufacturer': aVal = a.manufacturer; bVal = b.manufacturer; break;
                    case 'installYear': aVal = a.installYear ?? 0; bVal = b.installYear ?? 0; break;
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
    }, [assets, search, selectedStatuses, selectedDisciplines, sortField, sortDirection, dataSource]);

    const effectivePageSize = pageSize === 'All' ? totalCount : (pageSize as number);
    const totalPages = Math.ceil(totalCount / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;

    const handleSort = useCallback((field: string) => {
        setSortField(prev => {
            if (prev === field) {
                setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            } else {
                setSortDirection('asc');
            }
            return prev === field ? prev : field;
        });
        setCurrentPage(1);
    }, []);

    const handleExportCSV = () => {
        const data = filteredAssets.map(a => ({
            'Asset Name': a.name,
            'Serial Number': a.serialNumber,
            'Discipline': a.discipline,
            'Category': a.type,
            'Manufacturer': a.manufacturer || '-',
            'Install Year': a.installYear ?? '-',
            'Location': a.location,
            'Status': a.status,
            'Condition': a.condition || '-',
            'Last Service': a.lastService && !isNaN(new Date(a.lastService).getTime())
                ? format(new Date(a.lastService), "MMM d, yyyy") : '-',
            'Value (OMR)': a.value,
        }));
        exportToCSV(data, `assets-${getDateForFilename()}`);
    };

    const hasActiveFilters = search || selectedStatuses.length < STATUS_OPTIONS.length || selectedDisciplines.length < DISCIPLINE_OPTIONS.length;

    const clearFilters = () => {
        setSearch('');
        setSelectedStatuses([...STATUS_OPTIONS]);
        setSelectedDisciplines([...DISCIPLINE_OPTIONS]);
        setCurrentPage(1);
    };

    const stats = useMemo(() => {
        const uniqueDisciplines = new Set(assets.map(a => a.discipline).filter(Boolean)).size;
        const activeCount = assets.filter(a => a.status === 'Active' || a.status === 'Working').length;
        const verifyCount = assets.filter(a => a.status === 'TO VERIFY').length;
        const criticalCount = assets.filter(a => a.lifecycleRisk === 'Critical').length;
        const totalItems = dataSource === 'supabase' ? (summary.total || totalCount) : (totalCount > 0 ? totalCount : assets.length);
        const disciplineCount = dataSource === 'supabase' ? summary.disciplines : uniqueDisciplines;
        const activeByFlagCount = dataSource === 'supabase'
            ? summary.activeFlagged
            : assets.filter(a => a.isAssetActive !== false).length;
        const workingCount = dataSource === 'supabase' ? summary.workingStatus : activeCount;
        const needsVerifyCount = dataSource === 'supabase' ? summary.toVerify : verifyCount;
        const criticalLifecycleCount = dataSource === 'supabase' ? summary.criticalLifecycle : criticalCount;

        return [
            {
                label: "TOTAL ASSETS",
                value: totalItems.toString(),
                subtitle: dataSource === 'supabase' ? "Across all pages" : "All Items",
                icon: Boxes,
                variant: "water" as const
            },
            {
                label: "DISCIPLINES",
                value: disciplineCount.toString(),
                subtitle: dataSource === 'supabase' ? "Portfolio-wide" : "In current dataset",
                icon: Layers,
                variant: "success" as const
            },
            {
                label: "ACTIVE ASSETS",
                value: activeByFlagCount.toString(),
                subtitle: dataSource === 'supabase' ? "Is_Asset_Active = Y" : "On this page",
                icon: MapPin,
                variant: "success" as const
            },
            {
                label: "WORKING STATUS",
                value: workingCount.toString(),
                subtitle: "Status = Working/Active",
                icon: ClipboardCheck,
                variant: "water" as const
            },
            {
                label: "NEEDS VERIFICATION",
                value: needsVerifyCount.toString(),
                subtitle: "TO VERIFY status",
                icon: ShieldAlert,
                variant: "warning" as const
            },
            {
                label: "CRITICAL LIFECYCLE RISK",
                value: criticalLifecycleCount.toString(),
                subtitle: "ERL <= 2y or flagged status",
                icon: ShieldAlert,
                variant: "danger" as const
            }
        ];
    }, [assets, totalCount, dataSource, summary]);

    const getStatusDotColor = (status: string): 'green' | 'orange' | 'red' | 'slate' | 'amber' => {
        switch (status) {
            case 'Active':
            case 'Working':
                return 'green';
            case 'Under Maintenance': return 'orange';
            case 'Decommissioned': return 'red';
            case 'In Storage': return 'slate';
            case 'TO VERIFY': return 'amber';
            default: return 'slate';
        }
    };

    const getStatusBorderClass = (status: string): string => {
        switch (status) {
            case 'Active':
            case 'Working':
                return 'border-s-emerald-500';
            case 'Under Maintenance': return 'border-s-amber-500';
            case 'Decommissioned': return 'border-s-red-400';
            case 'In Storage': return 'border-s-slate-400';
            case 'TO VERIFY': return 'border-s-yellow-500';
            default: return 'border-s-slate-300';
        }
    };

    const totalColumns = 10;

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Assets Management"
                    description="Operations-standard asset register with lifecycle, compliance, and portfolio controls"
                    action={{ label: "Register Asset", icon: Plus }}
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    error={error}
                />
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
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                        />
                    </div>

                    <MultiSelectDropdown
                        label="Status"
                        options={STATUS_OPTIONS}
                        selected={selectedStatuses}
                        onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }}
                    />

                    <MultiSelectDropdown
                        label="Discipline"
                        options={DISCIPLINE_OPTIONS}
                        selected={selectedDisciplines}
                        onChange={(s) => { setSelectedDisciplines(s); setCurrentPage(1); }}
                        icon={Layers}
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
                    ...(selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? [{
                        key: 'disciplines',
                        label: `${selectedDisciplines.length} discipline${selectedDisciplines.length !== 1 ? 's' : ''}`,
                        colorClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
                        onRemove: () => { setSelectedDisciplines([...DISCIPLINE_OPTIONS]); setCurrentPage(1); }
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
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <EmptyState
                                variant={search || selectedStatuses.length < STATUS_OPTIONS.length || selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? "filter-empty" : "no-data"}
                                title={search ? "No assets match your search" : "No assets found"}
                                description={search || selectedStatuses.length < STATUS_OPTIONS.length || selectedDisciplines.length < DISCIPLINE_OPTIONS.length
                                    ? "Try adjusting your search or filters to see more results."
                                    : "Assets will appear here once they are added to the system."}
                            />
                        </div>
                    ) : (
                        filteredAssets.map((asset) => (
                            <div key={asset.id} className={`rounded-xl border border-slate-200 dark:border-slate-700 border-s-4 ${getStatusBorderClass(asset.status)} bg-white dark:bg-slate-900 p-4 space-y-3`}>
                                {/* Discipline badge */}
                                {asset.discipline && (
                                    <div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-300 ring-1 ring-primary/20">
                                            {asset.discipline}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{asset.serialNumber}</p>
                                    </div>
                                    <StatusBadge label={asset.status} color={getStatusDotColor(asset.status)} />
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
                                    {asset.manufacturer && (
                                        <span className="flex items-center gap-1">
                                            <Wrench className="w-3 h-3" />
                                            {asset.manufacturer}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400">
                                        {asset.installYear ? `Installed: ${asset.installYear}` : (
                                            asset.lastService && !isNaN(new Date(asset.lastService).getTime())
                                                ? `Service: ${format(new Date(asset.lastService), "MMM d, yyyy")}`
                                                : ''
                                        )}
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
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80">
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1.5">Asset Name <SortIcon field="name" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors hidden lg:table-cell" onClick={() => handleSort('serial')}>
                                    <div className="flex items-center gap-1.5">Serial # <SortIcon field="serial" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('discipline')}>
                                    <div className="flex items-center gap-1.5">Discipline <SortIcon field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1.5">Category <SortIcon field="category" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors hidden xl:table-cell" onClick={() => handleSort('manufacturer')}>
                                    <div className="flex items-center gap-1.5">Manufacturer <SortIcon field="manufacturer" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors hidden xl:table-cell" onClick={() => handleSort('installYear')}>
                                    <div className="flex items-center gap-1.5">Install Year <SortIcon field="installYear" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('location')}>
                                    <div className="flex items-center gap-1.5">Location <SortIcon field="location" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1.5">Status <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors hidden 2xl:table-cell" onClick={() => handleSort('risk')}>
                                    <div className="flex items-center gap-1.5">Lifecycle Risk <SortIcon field="risk" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" onClick={() => handleSort('value')}>
                                    <div className="flex items-center justify-end gap-1.5">Value (OMR) <SortIcon field="value" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableBodySkeleton columns={totalColumns} rows={10} />
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={totalColumns}>
                                        <EmptyState
                                            variant={search ? "filter-empty" : "no-data"}
                                            title={search ? "No assets match your search" : "No assets found"}
                                            description={search ? "Try a different search term." : "Assets will appear here once added."}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-[#00d2b3]/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-4 px-5 font-medium text-slate-800 dark:text-slate-200">{asset.name}</td>
                                        <td className="py-4 px-5 font-mono text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{asset.serialNumber}</td>
                                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.discipline || '-'}</td>
                                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.type}</td>
                                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm hidden xl:table-cell">
                                            {asset.manufacturer || <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm hidden xl:table-cell">
                                            {asset.installYear ?? <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.location}</td>
                                        <td className="py-4 px-5">
                                            <StatusBadge label={asset.status} color={getStatusDotColor(asset.status)} />
                                        </td>
                                        <td className="py-4 px-5 text-sm hidden 2xl:table-cell">
                                            <StatusBadge
                                                label={asset.lifecycleRisk || 'Normal'}
                                                color={asset.lifecycleRisk === 'Critical' ? 'red' : asset.lifecycleRisk === 'Watch' ? 'amber' : 'green'}
                                            />
                                        </td>
                                        <td className="py-4 px-5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{asset.value.toLocaleString('en-US')}</td>
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
