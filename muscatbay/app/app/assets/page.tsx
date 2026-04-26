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
    Calendar, Clock, FileText, Settings, DollarSign, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import {
    MultiSelectDropdown, SortIcon, TablePagination,
    ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption,
} from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

type ActiveTab = 'overview' | 'lifecycle' | 'maintenance' | 'technical' | 'financial';

const TABS = [
    { key: 'overview',     label: 'Overview',     icon: LayoutDashboard },
    { key: 'lifecycle',    label: 'Lifecycle',     icon: Clock },
    { key: 'maintenance',  label: 'Maintenance',   icon: Wrench },
    { key: 'technical',    label: 'Technical',     icon: Settings },
    { key: 'financial',    label: 'Financial',     icon: DollarSign },
];

const SORT_FIELD_MAP: Record<string, string> = {
    name:         'asset_name',
    tag:          'asset_tag',
    category:     'category',
    discipline:   'discipline',
    zone:         'zone',
    building:     'building_area',
    status:       'status',
    criticality:  'criticality',
    installYear:  'install_year',
    lifeExpect:   'life_expectancy_years',
    erlYears:     'erl_years',
    pctLife:      'pct_life_used',
    condition:    'condition',
    ppmFreq:      'ppm_frequency',
    amcContractor:'amc_contractor',
    lastPpm:      'last_ppm_date',
    nextPpm:      'next_ppm_date',
    manufacturer: 'manufacturer',
    model:        'model',
    country:      'country_of_origin',
    origCost:     'original_unit_cost_omr',
    replCost:     'current_replacement_cost_omr',
    boqRef:       'boq_project_ref',
    boqLife:      'boq_category_design_life',
};

const STATUS_OPTIONS = ['Working', 'Active', 'Under Maintenance', 'Decommissioned', 'In Storage', 'TO VERIFY'];
const CRITICALITY_OPTIONS = ['High', 'Medium', 'Low'];
const DISCIPLINE_OPTIONS = [
    'STP Equipment', 'Electrical', 'Mechanical & Plumbing', 'HVAC',
    'Civil', 'Painting', 'Village Square Assets', 'Lifts & Transport', 'Hotel Assets (JMB)',
];

function fmt(val: string | null | undefined): string {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return format(d, 'dd MMM yyyy');
}

function fmtYrs(n: number | null | undefined): string {
    if (n === null || n === undefined) return '-';
    return `${n}y`;
}

function fmtOMR(n: number | null | undefined): string {
    if (n === null || n === undefined || n === 0) return '-';
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' OMR';
}

function CritBadge({ level }: { level?: string }) {
    if (!level) return <span className="text-slate-300 dark:text-slate-600">-</span>;
    const colors: Record<string, string> = {
        High:   'bg-mb-danger-light text-mb-danger-text',
        Medium: 'bg-mb-warning-light text-mb-warning-text',
        Low:    'bg-mb-success-light text-mb-success-text',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[level] || 'bg-slate-100 text-slate-600'}`}>
            {level}
        </span>
    );
}

function PctBar({ pct }: { pct?: number | null }) {
    if (pct === null || pct === undefined) return <span className="text-slate-300 dark:text-slate-600">-</span>;
    const color = pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-secondary';
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{pct.toFixed(0)}%</span>
        </div>
    );
}

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [summary, setSummary] = useState({
        total: 0, activeFlagged: 0, workingStatus: 0, toVerify: 0,
        criticalLifecycle: 0, disciplines: 0, boqCoverage: 0,
    });
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
        const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
        return () => clearTimeout(t);
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
        const supabaseSort = SORT_FIELD_MAP[sortField] || 'asset_name';
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
                fetchAssetsAction(currentPage, effectivePageSize, debouncedSearch, supabaseSort, sortDirection, statusFilter, disciplineFilter),
                fetchAssetSummaryAction(),
            ]);

            if (fetchError) throw new Error(fetchError);

            setAssets(data ?? []);
            setTotalCount(count ?? 0);
            setDataSource('supabase');
            setLastUpdated(new Date());
            if (!summaryRes.error) setSummary(summaryRes);
        } catch (e) {
            console.error("Supabase fetch failed:", e);
            setError("Unable to load live data — showing demo data.");
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
        table: 'master_assets_register',
        channelName: 'master-assets-rt',
        onChanged: () => loadData(),
        enabled: dataSource === 'supabase',
    });

    const filteredAssets = useMemo(() => {
        if (dataSource === 'supabase') return assets;
        let result = [...assets];
        if (search) {
            const t = search.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(t) ||
                a.location.toLowerCase().includes(t) ||
                (a.serialNumber || '').toLowerCase().includes(t)
            );
        }
        if (selectedStatuses.length < STATUS_OPTIONS.length)
            result = result.filter(a => selectedStatuses.includes(a.status));
        if (selectedDisciplines.length < DISCIPLINE_OPTIONS.length)
            result = result.filter(a => selectedDisciplines.includes(a.discipline));
        return result;
    }, [assets, search, selectedStatuses, selectedDisciplines, dataSource]);

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

    const hasActiveFilters = !!(search || selectedStatuses.length < STATUS_OPTIONS.length || selectedDisciplines.length < DISCIPLINE_OPTIONS.length);

    const clearFilters = () => {
        setSearch(''); setSelectedStatuses([...STATUS_OPTIONS]);
        setSelectedDisciplines([...DISCIPLINE_OPTIONS]); setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const rows = filteredAssets.map(a => {
            switch (activeTab) {
                case 'lifecycle': return {
                    'Asset Tag': a.assetTag || a.serialNumber,
                    'Asset Name': a.name,
                    'Install Year': a.installYear ?? '-',
                    'Age (yrs)': a.currentAgeYears ?? '-',
                    'Exp. Life (yrs)': a.lifeExpectancyYears ?? '-',
                    'ERL (yrs)': a.erlYears ?? '-',
                    '% Life Used': a.pctLifeUsed != null ? `${a.pctLifeUsed.toFixed(0)}%` : '-',
                    'Warranty Expiry': a.warrantyExpiryDate || '-',
                    'Condition': a.condition || '-',
                    'Criticality': a.criticalityLevel || '-',
                };
                case 'maintenance': return {
                    'Asset Tag': a.assetTag || a.serialNumber,
                    'Asset Name': a.name,
                    'PPM Frequency': a.ppmFrequency || '-',
                    'PPM Interval (months)': a.ppmIntervalMonths ?? '-',
                    'AMC Contractor': a.amcContractor || '-',
                    'Last PPM': a.lastPpmDate || '-',
                    'Next PPM': a.nextPpmDate || '-',
                    'Maintenance Requirements': a.maintenanceRequirements || '-',
                };
                case 'technical': return {
                    'Asset Tag': a.assetTag || a.serialNumber,
                    'Asset Name': a.name,
                    'Manufacturer': a.manufacturer || '-',
                    'Model': a.model || '-',
                    'Country of Origin': a.countryOfOrigin || '-',
                    'Power / Capacity': a.powerCapacity || '-',
                    'Serial No.': a.serialNo || '-',
                };
                case 'financial': return {
                    'Asset Tag': a.assetTag || a.serialNumber,
                    'Asset Name': a.name,
                    'Original Cost (OMR)': a.boqUnitCost ?? '-',
                    'Replacement Cost (OMR)': a.replacementCost ?? '-',
                    'BOQ Reference': a.boqProjectRef || '-',
                    'BOQ Design Life (yrs)': a.boqDesignLife ?? '-',
                };
                default: return {
                    'Asset Name': a.name,
                    'Discipline': a.discipline,
                    'Category': a.type,
                    'Zone': a.zone || '-',
                    'Building': a.buildingArea || '-',
                    'Status': a.status,
                    'Criticality': a.criticalityLevel || '-',
                };
            }
        });
        exportToCSV(rows, `assets-${activeTab}-${getDateForFilename()}`);
    };

    const stats = useMemo(() => {
        const totalItems = dataSource === 'supabase' ? (summary.total || totalCount) : totalCount;
        return [
            { label: "TOTAL ASSETS",            value: totalItems.toString(),                     subtitle: "Across all disciplines",       icon: Boxes,       variant: "water"   as const },
            { label: "DISCIPLINES",              value: (dataSource === 'supabase' ? summary.disciplines : new Set(assets.map(a => a.discipline)).size).toString(), subtitle: "Portfolio-wide",   icon: Layers,       variant: "success" as const },
            { label: "ACTIVE / WORKING",         value: (dataSource === 'supabase' ? summary.workingStatus : assets.filter(a => ['Active','Working'].includes(a.status)).length).toString(), subtitle: "Status = Working / Active", icon: ClipboardCheck, variant: "success" as const },
            { label: "HIGH CRITICALITY",         value: (dataSource === 'supabase' ? summary.criticalLifecycle : assets.filter(a => a.criticalityLevel === 'High').length).toString(), subtitle: "Requires priority attention", icon: AlertTriangle, variant: "danger"  as const },
            { label: "WITH AMC CONTRACTOR",      value: (dataSource === 'supabase' ? summary.activeFlagged  : assets.filter(a => a.amcContractor).length).toString(),   subtitle: "Contracted maintenance",       icon: Wrench,       variant: "water"   as const },
            { label: "RESERVE FUND LINKED",      value: (dataSource === 'supabase' ? summary.boqCoverage    : assets.filter(a => a.boqProjectRef).length).toString(),   subtitle: "Assets with BOQ reference",    icon: FileText,     variant: "success" as const },
            { label: "NEEDS VERIFICATION",       value: (dataSource === 'supabase' ? summary.toVerify       : assets.filter(a => a.status === 'TO VERIFY').length).toString(), subtitle: "TO VERIFY status", icon: ShieldAlert, variant: "warning" as const },
        ];
    }, [assets, totalCount, dataSource, summary]);

    const getStatusColor = (s: string): 'green' | 'orange' | 'red' | 'slate' | 'amber' => {
        switch (s) {
            case 'Active': case 'Working': return 'green';
            case 'Under Maintenance': return 'orange';
            case 'Decommissioned': return 'red';
            case 'In Storage': return 'slate';
            default: return 'amber';
        }
    };

    const erlColor = (n: number | null | undefined) =>
        n === null || n === undefined ? 'text-slate-400' :
        n <= 2  ? 'text-red-600 dark:text-red-400' :
        n <= 5  ? 'text-amber-500 dark:text-amber-400' :
                  'text-secondary';

    // ── Shared column header helper ────────────────────────────────────────────
    const Th = ({ label, field, right }: { label: string; field?: string; right?: boolean }) => (
        <th
            scope="col"
            className={`py-3.5 px-4 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 whitespace-nowrap ${field ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60' : ''} ${right ? 'text-right' : 'text-left'}`}
            aria-sort={field && sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            onClick={field ? () => handleSort(field) : undefined}
        >
            <div className={`flex items-center gap-1.5 ${right ? 'justify-end' : ''}`}>
                {label}
                {field && <SortIcon field={field} currentSortField={sortField} currentSortDirection={sortDirection} />}
            </div>
        </th>
    );

    const loadingRows = (cols: number) => loading ? <TableBodySkeleton columns={cols} rows={10} /> : null;
    const emptyRow = (cols: number) => (
        <tr><td colSpan={cols}><EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." /></td></tr>
    );
    const rows = filteredAssets;

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Assets Register"
                    description="Master asset register — 3,061 assets across all disciplines with lifecycle, maintenance, and financial data"
                    action={{ label: "Register Asset", icon: Plus }}
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    error={error}
                />
            </div>

            {/* Tabs */}
            <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="space-y-4">
                {/* Toolbar */}
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            aria-label="Search assets"
                            placeholder="Search name, tag, zone, manufacturer…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
                        />
                    </div>
                    <MultiSelectDropdown label="Status" options={STATUS_OPTIONS} selected={selectedStatuses} onChange={s => { setSelectedStatuses(s); setCurrentPage(1); }} getOptionColor={getStatusColor} />
                    <MultiSelectDropdown label="Discipline" options={DISCIPLINE_OPTIONS} selected={selectedDisciplines} onChange={s => { setSelectedDisciplines(s); setCurrentPage(1); }} icon={Layers} />
                    {hasActiveFilters && (
                        <button onClick={clearFilters} aria-label="Clear filters" className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                            <X className="w-3.5 h-3.5" /> Clear
                        </button>
                    )}
                    <button onClick={handleExportCSV} aria-label="Export CSV" className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto">
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> assets
                    </div>
                </TableToolbar>

                <ActiveFilterPills pills={[
                    ...(search ? [{ key: 'search', label: `"${search}"`, onRemove: () => { setSearch(''); setCurrentPage(1); } }] : []),
                    ...(selectedStatuses.length < STATUS_OPTIONS.length ? [{ key: 'status', label: `${selectedStatuses.length} statuses`, colorClass: 'bg-secondary/20 text-slate-700 dark:bg-secondary/10 dark:text-secondary', onRemove: () => { setSelectedStatuses([...STATUS_OPTIONS]); setCurrentPage(1); } }] : []),
                    ...(selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? [{ key: 'disc', label: `${selectedDisciplines.length} disciplines`, colorClass: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-300', onRemove: () => { setSelectedDisciplines([...DISCIPLINE_OPTIONS]); setCurrentPage(1); } }] : []),
                ]} />

                {/* ── TAB: OVERVIEW ─────────────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0} className="space-y-4">
                    <StatsGrid stats={stats} />
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <div className="p-4 space-y-3">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                            ) : rows.length === 0 ? (
                                <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets" description="Try adjusting filters." />
                            ) : rows.map(a => (
                                <div key={a.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{a.discipline} · {a.type}</p>
                                        </div>
                                        <CritBadge level={a.criticalityLevel} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.buildingArea || a.zone || a.location}</span>
                                        <StatusBadge label={a.status} color={getStatusColor(a.status)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop table */}
                        <table className="hidden md:table w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                    <Th label="Asset Name"  field="name" />
                                    <Th label="Asset Tag"   field="tag" />
                                    <Th label="Discipline"  field="discipline" />
                                    <Th label="Category"    field="category" />
                                    <Th label="Zone"        field="zone" />
                                    <Th label="Building"    field="building" />
                                    <Th label="Status"      field="status" />
                                    <Th label="Criticality" field="criticality" />
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {loading ? loadingRows(8) : rows.length === 0 ? emptyRow(8) : rows.map(a => (
                                    <tr key={a.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[220px]"><span className="line-clamp-2">{a.name}</span></td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{a.assetTag || '-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{a.discipline || '-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{a.type || '-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{a.zone || '-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-[160px]"><span className="truncate block">{a.buildingArea || '-'}</span></td>
                                        <td className="py-3.5 px-4"><StatusBadge label={a.status} color={getStatusColor(a.status)} /></td>
                                        <td className="py-3.5 px-4"><CritBadge level={a.criticalityLevel} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </div>
                )}

                {/* ── TAB: LIFECYCLE ────────────────────────────────────────────────────── */}
                {activeTab === 'lifecycle' && (
                    <div id="panel-lifecycle" role="tabpanel" aria-labelledby="tab-lifecycle" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? <div className="p-4 space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-20 w-full"/>)}</div>
                            : rows.length === 0 ? <EmptyState variant={hasActiveFilters?"filter-empty":"no-data"} title="No assets" description="Adjust filters." />
                            : rows.map(a => (
                                <div key={a.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-400">{a.assetTag||'-'}</span><CritBadge level={a.criticalityLevel}/></div>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>Inst: {a.installYear??'-'}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>ERL: {fmtYrs(a.erlYears)}</span>
                                        <span>Life: {fmtYrs(a.lifeExpectancyYears)}</span>
                                    </div>
                                    <PctBar pct={a.pctLifeUsed}/>
                                    {a.warrantyExpiryDate && <div className="text-xs text-slate-500">Warranty: {fmt(a.warrantyExpiryDate)}</div>}
                                </div>
                            ))}
                        </div>
                        <table className="hidden md:table w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                    <Th label="Asset Tag"      field="tag" />
                                    <Th label="Asset Name"     field="name" />
                                    <Th label="Discipline"     field="discipline" />
                                    <Th label="Install Yr"     field="installYear" />
                                    <Th label="Age (yrs)"      />
                                    <Th label="Exp. Life"      field="lifeExpect" />
                                    <Th label="ERL"            field="erlYears" />
                                    <Th label="% Life Used"    field="pctLife" />
                                    <Th label="Warranty Expiry" field="warranty" />
                                    <Th label="Condition"      field="condition" />
                                    <Th label="Criticality"    field="criticality" />
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {loading ? loadingRows(11) : rows.length === 0 ? emptyRow(11) : rows.map(a => (
                                    <tr key={a.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">{a.assetTag||'-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]"><span className="line-clamp-2">{a.name}</span></td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.discipline||'-'}</td>
                                        <td className="py-3.5 px-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">{a.installYear??'-'}</td>
                                        <td className="py-3.5 px-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">{fmtYrs(a.currentAgeYears)}</td>
                                        <td className="py-3.5 px-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">{fmtYrs(a.lifeExpectancyYears)}</td>
                                        <td className={`py-3.5 px-4 text-center font-mono text-sm font-semibold ${erlColor(a.erlYears)}`}>{fmtYrs(a.erlYears)}</td>
                                        <td className="py-3.5 px-4"><PctBar pct={a.pctLifeUsed}/></td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{fmt(a.warrantyExpiryDate)}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm">{a.condition||'-'}</td>
                                        <td className="py-3.5 px-4"><CritBadge level={a.criticalityLevel}/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── TAB: MAINTENANCE ─────────────────────────────────────────────────── */}
                {activeTab === 'maintenance' && (
                    <div id="panel-maintenance" role="tabpanel" aria-labelledby="tab-maintenance" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? <div className="p-4 space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-20 w-full"/>)}</div>
                            : rows.length === 0 ? <EmptyState variant={hasActiveFilters?"filter-empty":"no-data"} title="No assets" description="Adjust filters." />
                            : rows.map(a => (
                                <div key={a.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-400">{a.assetTag||'-'}</span>{a.ppmFrequency && <span className="text-xs font-medium text-primary">{a.ppmFrequency}</span>}</div>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                                    {a.amcContractor && <div className="text-xs text-slate-500"><Wrench className="w-3 h-3 inline mr-1"/>{a.amcContractor}</div>}
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        {a.lastPpmDate && <span>Last: {fmt(a.lastPpmDate)}</span>}
                                        {a.nextPpmDate && <span>Next: {fmt(a.nextPpmDate)}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <table className="hidden md:table w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                    <Th label="Asset Tag"          field="tag" />
                                    <Th label="Asset Name"         field="name" />
                                    <Th label="Discipline"         field="discipline" />
                                    <Th label="Zone / Building"    />
                                    <Th label="PPM Frequency"      field="ppmFreq" />
                                    <Th label="Interval (mo)"      />
                                    <Th label="AMC Contractor"     field="amcContractor" />
                                    <Th label="Last PPM"           field="lastPpm" />
                                    <Th label="Next PPM"           field="nextPpm" />
                                    <Th label="AMC Notes"          />
                                    <Th label="Maintenance Notes"  />
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {loading ? loadingRows(11) : rows.length === 0 ? emptyRow(11) : rows.map(a => (
                                    <tr key={a.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">{a.assetTag||'-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]"><span className="line-clamp-2">{a.name}</span></td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.discipline||'-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.buildingArea||a.zone||'-'}</td>
                                        <td className="py-3.5 px-4 text-sm font-medium text-primary">{a.ppmFrequency||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">{a.ppmIntervalMonths??'-'}</td>
                                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-sm">{a.amcContractor||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{fmt(a.lastPpmDate)}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{fmt(a.nextPpmDate)}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[180px]"><span className="line-clamp-2">{a.amcNotes||<span className="text-slate-300 dark:text-slate-600">-</span>}</span></td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px]"><span className="line-clamp-2">{a.maintenanceRequirements||<span className="text-slate-300 dark:text-slate-600">-</span>}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── TAB: TECHNICAL ───────────────────────────────────────────────────── */}
                {activeTab === 'technical' && (
                    <div id="panel-technical" role="tabpanel" aria-labelledby="tab-technical" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? <div className="p-4 space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-20 w-full"/>)}</div>
                            : rows.length === 0 ? <EmptyState variant={hasActiveFilters?"filter-empty":"no-data"} title="No assets" description="Adjust filters." />
                            : rows.map(a => (
                                <div key={a.id} className="p-4 space-y-2">
                                    <span className="font-mono text-xs text-slate-400">{a.assetTag||'-'}</span>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                                        {a.manufacturer && <span>Brand: <span className="font-medium text-slate-700 dark:text-slate-300">{a.manufacturer}</span></span>}
                                        {a.model && <span>Model: {a.model}</span>}
                                        {a.countryOfOrigin && <span>Origin: {a.countryOfOrigin}</span>}
                                        {a.powerCapacity && <span>Cap: {a.powerCapacity}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <table className="hidden md:table w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                    <Th label="Asset Tag"      field="tag" />
                                    <Th label="Asset Name"     field="name" />
                                    <Th label="Discipline"     field="discipline" />
                                    <Th label="Sub-category"   />
                                    <Th label="Manufacturer"   field="manufacturer" />
                                    <Th label="Model"          field="model" />
                                    <Th label="Country"        field="country" />
                                    <Th label="Power / Capacity" />
                                    <Th label="Serial No."     />
                                    <Th label="Reg. Authority" />
                                    <Th label="Data Source"    />
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {loading ? loadingRows(11) : rows.length === 0 ? emptyRow(11) : rows.map(a => (
                                    <tr key={a.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">{a.assetTag||'-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]"><span className="line-clamp-2">{a.name}</span></td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.discipline||'-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.subcategory||'-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">{a.manufacturer||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm">{a.model||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm">{a.countryOfOrigin||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs max-w-[140px]"><span className="truncate block">{a.powerCapacity||<span className="text-slate-300 dark:text-slate-600">-</span>}</span></td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{a.serialNo||<span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[150px]"><span className="truncate block">{a.registrationAuthority||<span className="text-slate-300 dark:text-slate-600">-</span>}</span></td>
                                        <td className="py-3.5 px-4 text-xs text-slate-400">{a.dataSource||'-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── TAB: FINANCIAL ───────────────────────────────────────────────────── */}
                {activeTab === 'financial' && (
                    <div id="panel-financial" role="tabpanel" aria-labelledby="tab-financial" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? <div className="p-4 space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-20 w-full"/>)}</div>
                            : rows.length === 0 ? <EmptyState variant={hasActiveFilters?"filter-empty":"no-data"} title="No assets" description="Adjust filters." />
                            : rows.map(a => (
                                <div key={a.id} className="p-4 space-y-2">
                                    <span className="font-mono text-xs text-slate-400">{a.assetTag||'-'}</span>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Original: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{fmtOMR(a.boqUnitCost)}</span></span>
                                        <span className="text-slate-500">Replace: <span className="font-mono font-semibold text-primary">{fmtOMR(a.replacementCost)}</span></span>
                                    </div>
                                    {a.boqProjectRef && <div className="text-xs text-slate-500 flex items-center gap-1"><FileText className="w-3 h-3"/>{a.boqProjectRef}</div>}
                                </div>
                            ))}
                        </div>
                        <table className="hidden md:table w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                    <Th label="Asset Tag"           field="tag" />
                                    <Th label="Asset Name"          field="name" />
                                    <Th label="Discipline"          field="discipline" />
                                    <Th label="Zone / Building"     />
                                    <Th label="Original Cost (OMR)" field="origCost" right />
                                    <Th label="Replace Cost (OMR)"  field="replCost" right />
                                    <Th label="BOQ Reference"       field="boqRef" />
                                    <Th label="BOQ Design Life"     field="boqLife" />
                                    <Th label="Supplier"            />
                                    <Th label="Notes"               />
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {loading ? loadingRows(10) : rows.length === 0 ? emptyRow(10) : rows.map(a => (
                                    <tr key={a.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-secondary/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">{a.assetTag||'-'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]"><span className="line-clamp-2">{a.name}</span></td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.discipline||'-'}</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{a.buildingArea||a.zone||'-'}</td>
                                        <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmtOMR(a.boqUnitCost)}</td>
                                        <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-primary whitespace-nowrap">{fmtOMR(a.replacementCost)}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[180px]">{a.boqProjectRef ? <span className="truncate block" title={a.boqProjectRef}>{a.boqProjectRef}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                                        <td className="py-3.5 px-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">{a.boqDesignLife ? `${a.boqDesignLife}y` : '-'}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500">{a.responsibilityOwner||'-'}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[160px]"><span className="truncate block">{a.notes||'-'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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
                        onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
                    />
                )}
            </div>
        </div>
    );
}
