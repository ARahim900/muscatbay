"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getAssets } from "@/lib/mock-data";
import type { Asset } from "@/entities/asset";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchAssetsAction, fetchAssetSummaryAction } from "@/actions/assets";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TableBodySkeleton, Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import {
    Boxes, MapPin, Wrench, Search, Plus, Download, X, Layers,
    ClipboardCheck, ShieldAlert, LayoutDashboard, ClipboardList,
    Calendar, Clock, FileText,
} from "lucide-react";
import { format } from "date-fns";
import {
    MultiSelectDropdown, SortIcon, TablePagination,
    ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption,
} from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

type ActiveTab = 'overview' | 'details';

const TABS = [
    { key: 'overview', label: 'Assets Overview', icon: LayoutDashboard },
    { key: 'details', label: 'Details / Lifecycle', icon: ClipboardList },
];

const SORT_FIELD_MAP: Record<string, string> = {
    name: 'Asset_Name',
    serial: 'Asset_Tag',
    category: 'Category',
    discipline: 'Discipline',
    location: 'Location_Name',
    status: 'Status',
    risk: 'ERL_Years',
    systemArea: 'System_Area',
    installYear: 'Install_Year',
    installDate: 'Install_Date',
    lifeExpect: 'Life_Expectancy_Years',
    erlYears: 'ERL_Years',
    condition: 'Condition',
    ppmFreq: 'PPM_Frequency',
    boqDesignLife: 'BOQ_Category_Design_Life',
    boqRef: 'BOQ_Project_Ref',
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

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'MMM d, yyyy');
}

function formatYears(years: number | null | undefined): string {
    if (years === null || years === undefined) return '-';
    return `${years}y`;
}

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

    const [summary, setSummary] = useState<{
        total: number;
        activeFlagged: number;
        workingStatus: number;
        toVerify: number;
        criticalLifecycle: number;
        disciplines: number;
        boqCoverage: number;
    }>({ total: 0, activeFlagged: 0, workingStatus: 0, toVerify: 0, criticalLifecycle: 0, disciplines: 0, boqCoverage: 0 });

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...STATUS_OPTIONS]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([...DISCIPLINE_OPTIONS]);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [sortField, setSortField] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);
    const [totalCount, setTotalCount] = useState(0);

    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key as ActiveTab);
        setSortField('name');
        setSortDirection('asc');
        setCurrentPage(1);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        const effectivePageSize = pageSize === 'All' ? 500 : pageSize;
        const supabaseSort = SORT_FIELD_MAP[sortField] || 'Asset_Name';
        const statusFilter = selectedStatuses.length < STATUS_OPTIONS.length ? selectedStatuses : undefined;
        const disciplineFilter = selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? selectedDisciplines : undefined;

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

            const [{ data, count, error: fetchError }, summaryRes] = await Promise.all([
                fetchAssetsAction(
                    currentPage, effectivePageSize, debouncedSearch,
                    supabaseSort, sortDirection, statusFilter, disciplineFilter,
                ),
                fetchAssetSummaryAction(),
            ]);

            if (fetchError) throw new Error(fetchError);

            if (data) {
                setAssets(data);
                setTotalCount(count);
                setDataSource('supabase');
                setLastUpdated(new Date());
                if (!summaryRes.error) setSummary(summaryRes);
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

    useEffect(() => { loadData(); }, [loadData]);

    const { isLive } = useSupabaseRealtime({
        table: 'Assets_Register_Database',
        channelName: 'assets-register-rt',
        onChanged: () => loadData(),
        enabled: dataSource === 'supabase',
    });

    const filteredAssets = useMemo(() => {
        if (dataSource === 'supabase') return assets;

        let result = [...assets];
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(term) ||
                a.location.toLowerCase().includes(term) ||
                a.serialNumber.toLowerCase().includes(term),
            );
        }
        if (selectedStatuses.length < STATUS_OPTIONS.length)
            result = result.filter(a => selectedStatuses.includes(a.status));
        if (selectedDisciplines.length < DISCIPLINE_OPTIONS.length)
            result = result.filter(a => selectedDisciplines.includes(a.discipline));

        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';
                switch (sortField) {
                    case 'name':          aVal = a.name;                      bVal = b.name;                      break;
                    case 'serial':        aVal = a.serialNumber;              bVal = b.serialNumber;              break;
                    case 'category':      aVal = a.type;                      bVal = b.type;                      break;
                    case 'discipline':    aVal = a.discipline;                bVal = b.discipline;                break;
                    case 'location':      aVal = a.location;                  bVal = b.location;                  break;
                    case 'status':        aVal = a.status;                    bVal = b.status;                    break;
                    case 'value':         aVal = a.value;                     bVal = b.value;                     break;
                    case 'systemArea':    aVal = a.systemArea ?? '';          bVal = b.systemArea ?? '';          break;
                    case 'installYear':   aVal = a.installYear ?? 0;          bVal = b.installYear ?? 0;          break;
                    case 'installDate':   aVal = a.purchaseDate ?? '';        bVal = b.purchaseDate ?? '';        break;
                    case 'lifeExpect':    aVal = a.lifeExpectancyYears ?? 0; bVal = b.lifeExpectancyYears ?? 0; break;
                    case 'erlYears':      aVal = a.erlYears ?? 0;             bVal = b.erlYears ?? 0;             break;
                    case 'condition':     aVal = a.condition;                 bVal = b.condition;                 break;
                    case 'ppmFreq':       aVal = a.ppmFrequency ?? '';        bVal = b.ppmFrequency ?? '';        break;
                    case 'boqDesignLife': aVal = a.boqDesignLife ?? 0;        bVal = b.boqDesignLife ?? 0;        break;
                    case 'boqRef':        aVal = a.boqProjectRef ?? '';       bVal = b.boqProjectRef ?? '';       break;
                    case 'risk': {
                        const order = { Critical: 0, Watch: 1, Normal: 2 };
                        aVal = order[a.lifecycleRisk ?? 'Normal'];
                        bVal = order[b.lifecycleRisk ?? 'Normal'];
                        break;
                    }
                }
                if (typeof aVal === 'string')
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
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
            if (prev === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            else setSortDirection('asc');
            return prev === field ? prev : field;
        });
        setCurrentPage(1);
    }, []);

    const handleExportCSV = () => {
        const rows = filteredAssets.map(a => {
            if (activeTab === 'details') {
                return {
                    'Asset ID': a.serialNumber,
                    'Asset Name': a.name,
                    'System / Area': a.systemArea || '-',
                    'Install Year': a.installYear ?? '-',
                    'Expected Life (yrs)': a.lifeExpectancyYears ?? '-',
                    'BOQ Design Life (yrs)': a.boqDesignLife ?? '-',
                    'Remaining Life (yrs)': a.erlYears ?? '-',
                    'Lifecycle Risk': a.lifecycleRisk || 'Normal',
                    'PM Frequency': a.ppmFrequency || '-',
                    'BOQ Reference': a.boqProjectRef || '-',
                };
            }
            return {
                'Asset Name': a.name,
                'Discipline': a.discipline,
                'Category': a.type,
                'Location': a.location,
                'Status': a.status,
                'Value (OMR)': a.value > 0 ? a.value : '-',
            };
        });
        exportToCSV(rows, `assets-${activeTab}-${getDateForFilename()}`);
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
        const activeByFlagCount = dataSource === 'supabase' ? summary.activeFlagged : assets.filter(a => a.isAssetActive !== false).length;
        const workingCount = dataSource === 'supabase' ? summary.workingStatus : activeCount;
        const needsVerifyCount = dataSource === 'supabase' ? summary.toVerify : verifyCount;
        const criticalLifecycleCount = dataSource === 'supabase' ? summary.criticalLifecycle : criticalCount;

        const boqCount = dataSource === 'supabase' ? summary.boqCoverage : assets.filter(a => a.boqProjectRef).length;

        return [
            { label: "TOTAL ASSETS", value: totalItems.toString(), subtitle: dataSource === 'supabase' ? "Across all pages" : "All items", icon: Boxes, variant: "water" as const },
            { label: "DISCIPLINES", value: disciplineCount.toString(), subtitle: dataSource === 'supabase' ? "Portfolio-wide" : "In dataset", icon: Layers, variant: "success" as const },
            { label: "ACTIVE ASSETS", value: activeByFlagCount.toString(), subtitle: "Is_Asset_Active = Y", icon: MapPin, variant: "success" as const },
            { label: "WORKING STATUS", value: workingCount.toString(), subtitle: "Status = Working/Active", icon: ClipboardCheck, variant: "water" as const },
            { label: "RESERVE FUND LINKED", value: boqCount.toString(), subtitle: "Assets with BOQ reference", icon: FileText, variant: "success" as const },
            { label: "NEEDS VERIFICATION", value: needsVerifyCount.toString(), subtitle: "TO VERIFY status", icon: ShieldAlert, variant: "warning" as const },
            { label: "CRITICAL LIFECYCLE RISK", value: criticalLifecycleCount.toString(), subtitle: "ERL ≤ 2y or flagged", icon: ShieldAlert, variant: "danger" as const },
        ];
    }, [assets, totalCount, dataSource, summary]);

    const getStatusDotColor = (status: string): 'green' | 'orange' | 'red' | 'slate' | 'amber' => {
        switch (status) {
            case 'Active': case 'Working': return 'green';
            case 'Under Maintenance': return 'orange';
            case 'Decommissioned': return 'red';
            case 'In Storage': return 'slate';
            case 'TO VERIFY': return 'amber';
            default: return 'slate';
        }
    };

    const getRiskColor = (risk: string | undefined): 'red' | 'amber' | 'green' => {
        if (risk === 'Critical') return 'red';
        if (risk === 'Watch') return 'amber';
        return 'green';
    };

    // ── Shared header ──────────────────────────────────────────────────────────
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

            {/* Tab navigation */}
            <TabNavigation
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* KPIs — Overview only */}
            {activeTab === 'overview' && <StatsGrid stats={stats} />}

            {/* Shared table section */}
            <div className="space-y-4">
                {/* Toolbar */}
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            aria-label="Search assets"
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
                            aria-label="Clear all filters"
                            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}

                    <button
                        onClick={handleExportCSV}
                        aria-label="Export to CSV"
                        className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> assets
                    </div>
                </TableToolbar>

                <ActiveFilterPills pills={[
                    ...(search ? [{ key: 'search', label: `Search: "${search}"`, onRemove: () => { setSearch(''); setCurrentPage(1); } }] : []),
                    ...(selectedStatuses.length < STATUS_OPTIONS.length ? [{
                        key: 'statuses',
                        label: `${selectedStatuses.length} status${selectedStatuses.length !== 1 ? 'es' : ''}`,
                        colorClass: 'bg-secondary/20 text-slate-700 dark:bg-secondary/10 dark:text-secondary',
                        onRemove: () => { setSelectedStatuses([...STATUS_OPTIONS]); setCurrentPage(1); },
                    }] : []),
                    ...(selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? [{
                        key: 'disciplines',
                        label: `${selectedDisciplines.length} discipline${selectedDisciplines.length !== 1 ? 's' : ''}`,
                        colorClass: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-300',
                        onRemove: () => { setSelectedDisciplines([...DISCIPLINE_OPTIONS]); setCurrentPage(1); },
                    }] : []),
                ]} />

                {/* ── Overview tab ─────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <>
                        {/* Mobile cards — Overview */}
                        <div className="md:hidden space-y-3">
                            {loading ? (
                                <div role="status" aria-live="polite" aria-label="Loading assets" className="space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 motion-safe:animate-pulse">
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
                                    <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." />
                                </div>
                            ) : filteredAssets.map((asset) => (
                                <div key={asset.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                                    {asset.discipline && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-300 ring-1 ring-primary/20">
                                            {asset.discipline}
                                        </span>
                                    )}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{asset.type}</p>
                                        </div>
                                        <StatusBadge label={asset.status} color={getStatusDotColor(asset.status)} />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        {asset.location}
                                    </div>
                                    <div className="flex items-center justify-end text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="font-mono font-semibold text-primary">
                                            {asset.value > 0 ? `${asset.value.toLocaleString('en-US')} OMR` : '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table — Overview (lean columns) */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80">
                                        {[
                                            { label: 'Asset Name', field: 'name' },
                                            { label: 'Discipline', field: 'discipline' },
                                            { label: 'Category', field: 'category' },
                                            { label: 'Location', field: 'location' },
                                            { label: 'Status', field: 'status' },
                                        ].map(col => (
                                            <th
                                                key={col.field}
                                                className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                                                aria-sort={sortField === col.field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                                onClick={() => handleSort(col.field)}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {col.label}
                                                    <SortIcon field={col.field} currentSortField={sortField} currentSortDirection={sortDirection} />
                                                </div>
                                            </th>
                                        ))}
                                        <th
                                            className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                                            aria-sort={sortField === 'value' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                            onClick={() => handleSort('value')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                Value (OMR)
                                                <SortIcon field="value" currentSortField={sortField} currentSortDirection={sortDirection} />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody aria-busy={loading}>
                                    {loading ? (
                                        <TableBodySkeleton columns={6} rows={10} />
                                    ) : filteredAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." />
                                            </td>
                                        </tr>
                                    ) : filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                            <td className="py-4 px-5 font-medium text-slate-800 dark:text-slate-200">{asset.name}</td>
                                            <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.discipline || '-'}</td>
                                            <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.type || '-'}</td>
                                            <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-sm">{asset.location}</td>
                                            <td className="py-4 px-5">
                                                <StatusBadge label={asset.status} color={getStatusDotColor(asset.status)} />
                                            </td>
                                            <td className="py-4 px-5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                                                {asset.value > 0 ? asset.value.toLocaleString('en-US') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Details / Lifecycle tab ──────────────────────────────────── */}
                {activeTab === 'details' && (
                    <>
                        {/* Mobile cards — Details */}
                        <div className="md:hidden space-y-3">
                            {loading ? (
                                <div role="status" aria-live="polite" aria-label="Loading assets" className="space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 motion-safe:animate-pulse">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-5 w-48" />
                                            <div className="grid grid-cols-2 gap-2">
                                                {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredAssets.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." />
                                </div>
                            ) : filteredAssets.map((asset) => (
                                <div key={asset.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{asset.serialNumber || '-'}</span>
                                        <StatusBadge label={asset.lifecycleRisk || 'Normal'} color={getRiskColor(asset.lifecycleRisk)} />
                                    </div>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">{asset.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        {asset.systemArea && (
                                            <span className="col-span-2 flex items-center gap-1">
                                                <Wrench className="w-3 h-3 shrink-0" />
                                                {asset.systemArea}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 shrink-0" />
                                            {asset.installYear ?? formatDate(asset.purchaseDate)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 shrink-0" />
                                            ERL: {formatYears(asset.erlYears)}
                                        </span>
                                        {asset.lifeExpectancyYears !== null && (
                                            <span>Exp. Life: {formatYears(asset.lifeExpectancyYears)}</span>
                                        )}
                                        {asset.boqDesignLife !== null && asset.boqDesignLife !== undefined && (
                                            <span>BOQ Life: {formatYears(asset.boqDesignLife)}</span>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                        {asset.ppmFrequency && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                PM Plan: <span className="font-medium text-slate-700 dark:text-slate-300">{asset.ppmFrequency}</span>
                                            </div>
                                        )}
                                        {asset.boqProjectRef && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                                                <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                                                <span className="truncate" title={asset.boqProjectRef}>{asset.boqProjectRef}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table — Details / Lifecycle */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80">
                                        {[
                                            { label: 'Asset ID', field: 'serial' },
                                            { label: 'Asset Name', field: 'name' },
                                            { label: 'System / Area', field: 'systemArea' },
                                            { label: 'Install Yr', field: 'installYear' },
                                            { label: 'Exp. Life', field: 'lifeExpect' },
                                            { label: 'BOQ Life', field: 'boqDesignLife' },
                                            { label: 'Rem. Life (ERL)', field: 'erlYears' },
                                            { label: 'Criticality', field: 'risk' },
                                            { label: 'PM Plan', field: 'ppmFreq' },
                                            { label: 'BOQ Reference', field: 'boqRef' },
                                        ].map(col => (
                                            <th
                                                key={col.field}
                                                className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors whitespace-nowrap"
                                                aria-sort={sortField === col.field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
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
                                <tbody aria-busy={loading}>
                                    {loading ? (
                                        <TableBodySkeleton columns={10} rows={10} />
                                    ) : filteredAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan={10}>
                                                <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." />
                                            </td>
                                        </tr>
                                    ) : filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {asset.serialNumber || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]">
                                                <span className="line-clamp-2 leading-tight">{asset.name}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm">
                                                {asset.systemArea || <span className="text-slate-300 dark:text-slate-600">-</span>}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400 text-sm font-mono">
                                                {asset.installYear ?? '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400 text-sm font-mono">
                                                {formatYears(asset.lifeExpectancyYears)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400 text-sm font-mono">
                                                {formatYears(asset.boqDesignLife)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-sm font-semibold">
                                                <span className={
                                                    asset.erlYears === null || asset.erlYears === undefined ? 'text-slate-400' :
                                                    asset.erlYears <= 2 ? 'text-destructive' :
                                                    asset.erlYears <= 5 ? 'text-amber-500 dark:text-amber-400' :
                                                    'text-secondary'
                                                }>
                                                    {formatYears(asset.erlYears)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <StatusBadge
                                                    label={asset.lifecycleRisk || 'Normal'}
                                                    color={getRiskColor(asset.lifecycleRisk)}
                                                />
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
                                                {asset.ppmFrequency || <span className="text-slate-300 dark:text-slate-600">-</span>}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 text-xs max-w-[200px]">
                                                {asset.boqProjectRef
                                                    ? <span className="truncate block" title={asset.boqProjectRef}>{asset.boqProjectRef}</span>
                                                    : <span className="text-slate-300 dark:text-slate-600">-</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Shared pagination */}
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
