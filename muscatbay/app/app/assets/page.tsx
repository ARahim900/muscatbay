"use client";

import { useEffect, useState, useMemo, useCallback, useRef, type ReactNode } from "react";
import { getAssets } from "@/lib/mock-data";
import type { Asset } from "@/entities/asset";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
    fetchAssetsAction, fetchAssetSummaryAction, fetchAssetDistributionsAction,
} from "@/actions/assets";
import type { AssetDistributions, AssetSummary } from "@/functions/api/assets";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TableBodySkeleton, Skeleton, StatsGridSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
    Boxes, MapPin, Wrench, Search, Download, X, Layers,
    ClipboardCheck, ShieldAlert, LayoutDashboard,
    Calendar, Clock, FileText, Settings, DollarSign, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    MultiSelectDropdown, SortableTableHead, TablePagination,
    ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption,
} from "@/components/shared/data-table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useVirtualTableRows } from "@/hooks/useVirtualTableRows";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { sortAssets, type AssetSortField } from "./sort";
import { AssetAttention, AssetRegisterProfile } from "./asset-charts";
import { TruncatedText } from "./truncated-text";

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
    // Was missing: the Lifecycle tab renders field="warranty" and drew a sort
    // arrow while the query silently fell back to asset_name.
    warranty:     'warranty_expiry_date',
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
const DISCIPLINE_OPTIONS = [
    'STP Equipment', 'Electrical', 'Mechanical & Plumbing', 'HVAC',
    'Civil', 'Painting', 'Village Square Assets', 'Lifts & Transport', 'Hotel Assets (JMB)',
];

/**
 * Largest page the register fetch will actually return. The page-size selector
 * offers no "All" option because the query is ranged — offering "All" while
 * fetching 500 made the footer claim "1–3061 of 3061" with 500 rows rendered.
 */
const MAX_PAGE_ROWS = 500;
const PAGE_SIZE_OPTIONS: PageSizeOption[] = [25, 50, 100, 250, MAX_PAGE_ROWS];

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

/** Drop the server action's `error` field so only the payload is cached/stored. */
function stripError<T extends object>(res: T & { error?: string }): T {
    const clone = { ...res };
    delete clone.error;
    return clone;
}

const EMPTY_SUMMARY: AssetSummary = {
    total: 0, workingStatus: 0, toVerify: 0, highCriticality: 0,
    amcCovered: 0, endOfLifeSoon: 0, highCriticalityNoAmc: 0, boqCoverage: 0,
};

// Session cache for the default landing view — see lib/page-cache.ts.
// Key is versioned: the cached `summary` shape changed when the KPI queries
// were corrected, and a stale entry must not be read back into the new shape.
const ASSETS_CACHE_KEY = "assets:default-view:v2";
interface AssetsPageCache {
    assets: Asset[];
    totalCount: number;
    summary: AssetSummary;
    lastUpdated: Date;
}
const ASSETS_PROFILE_CACHE_KEY = "assets:distributions:v1";

function CritBadge({ level }: { level?: string }) {
    if (!level) return <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>;
    const colors: Record<string, string> = {
        High:   'bg-mb-danger-light text-mb-danger-text',
        Medium: 'bg-mb-warning-light text-mb-warning-text',
        Low:    'bg-mb-success-light text-mb-success-text',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[level] || 'bg-muted text-muted-foreground'}`}>
            {level}
        </span>
    );
}

function PctBar({ pct }: { pct?: number | null }) {
    if (pct === null || pct === undefined) return <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>;
    const color = pct >= 80
        ? 'bg-[var(--status-danger)]'
        : pct >= 60 ? 'bg-[var(--status-warning)]' : 'bg-secondary';
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 bg-border dark:bg-muted rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
    );
}

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    // Seed the DEFAULT view (page 1, name asc, no filters) from the session
    // cache so revisits render instantly; the mount fetch refreshes silently.
    const [cached] = useState(() => getPageCache<AssetsPageCache>(ASSETS_CACHE_KEY));
    const [summary, setSummary] = useState<AssetSummary>(cached?.summary ?? EMPTY_SUMMARY);
    const [assets, setAssets] = useState<Asset[]>(cached?.assets ?? []);
    const [distributions, setDistributions] = useState<AssetDistributions | null>(
        () => getPageCache<AssetDistributions>(ASSETS_PROFILE_CACHE_KEY) ?? null
    );
    const [distributionsLoading, setDistributionsLoading] = useState(false);
    const [loading, setLoading] = useState(!cached);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...STATUS_OPTIONS]);
    const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([...DISCIPLINE_OPTIONS]);
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>(cached ? 'supabase' : 'mock');
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
    const [sortField, setSortField] = useState<AssetSortField>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);
    const [totalCount, setTotalCount] = useState(cached?.totalCount ?? 0);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    // True for the first loadData() run after a cache seed — that run
    // refreshes silently instead of re-showing skeletons.
    const seededRef = useRef(Boolean(cached));

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

    const effectivePageSize = pageSize === 'All' ? MAX_PAGE_ROWS : pageSize;

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const requestedRows = pageSize === 'All' ? MAX_PAGE_ROWS : pageSize;
        const supabaseSort = SORT_FIELD_MAP[sortField] || 'asset_name';
        const statusFilter = selectedStatuses.length < STATUS_OPTIONS.length ? selectedStatuses : undefined;
        const disciplineFilter = selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? selectedDisciplines : undefined;
        // Only the default landing view is session-cached — it's the one every
        // sidebar navigation lands on.
        const isDefaultView = currentPage === 1 && pageSize === 25 && !debouncedSearch
            && supabaseSort === 'asset_name' && sortDirection === 'asc'
            && !statusFilter && !disciplineFilter;

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
                fetchAssetsAction(currentPage, requestedRows, debouncedSearch, supabaseSort, sortDirection, statusFilter, disciplineFilter),
                fetchAssetSummaryAction(),
            ]);

            if (fetchError) throw new Error(fetchError);

            setAssets(data ?? []);
            setTotalCount(count ?? 0);
            setDataSource('supabase');
            setError(null);
            const now = new Date();
            setLastUpdated(now);
            if (!summaryRes.error) {
                const summaryData = stripError(summaryRes);
                setSummary(summaryData);
                if (isDefaultView) {
                    setPageCache<AssetsPageCache>(ASSETS_CACHE_KEY, {
                        assets: data ?? [],
                        totalCount: count ?? 0,
                        summary: summaryData,
                        lastUpdated: now,
                    });
                }
            }
        } catch (e) {
            if (silent) {
                // Background refresh failed — keep showing the cached view.
                console.warn("Assets silent refresh failed:", e);
                return;
            }
            console.error("Supabase fetch failed:", e);
            setError("Unable to load live data — showing demo data.");
            const mockData = await getAssets();
            setAssets(mockData);
            setTotalCount(mockData.length);
            setDataSource('mock');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearch, sortField, sortDirection, selectedStatuses, selectedDisciplines]);

    // Runs on mount AND whenever a fetch param changes (loadData identity).
    // The first run after a cache seed refreshes silently; param changes load
    // normally (in-place table skeletons).
    useEffect(() => {
        loadData(seededRef.current);
        seededRef.current = false;
    }, [loadData]);

    // Register-wide distributions power the Overview charts. They describe the
    // whole table (not the current page), so they're fetched once per visit.
    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        if (getPageCache<AssetDistributions>(ASSETS_PROFILE_CACHE_KEY)) return;
        let cancelled = false;
        setDistributionsLoading(true);
        fetchAssetDistributionsAction()
            .then(res => {
                if (cancelled) return;
                if (res.error) {
                    console.warn("Asset distributions unavailable:", res.error);
                    return;
                }
                const profile = stripError(res);
                setDistributions(profile);
                setPageCache<AssetDistributions>(ASSETS_PROFILE_CACHE_KEY, profile);
            })
            .catch(e => console.warn("Asset distributions failed:", e))
            .finally(() => { if (!cancelled) setDistributionsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const { isLive } = useSupabaseRealtime({
        table: 'master_assets_register',
        channelName: 'master-assets-rt',
        // Realtime rows arriving shouldn't blank the table — refresh silently.
        onChanged: () => loadData(true),
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

    const totalPages = Math.ceil(totalCount / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;

    // Toggling direction must not happen inside a state updater — with
    // reactStrictMode the updater double-invokes in dev and the direction
    // flipped twice, cancelling itself out.
    const handleSort = useCallback((field: string) => {
        if (sortField === field) {
            setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field as AssetSortField);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    }, [sortField]);

    const hasActiveFilters = !!(search || selectedStatuses.length < STATUS_OPTIONS.length || selectedDisciplines.length < DISCIPLINE_OPTIONS.length);

    // First fetch still in flight (nothing resolved yet). Used to keep the
    // status bar neutral ("Connecting…") and the KPIs skeletoned instead of
    // flashing a false "Demo Data / OFFLINE / all zeros" state before the
    // live dataset arrives.
    const firstLoad = loading && assets.length === 0 && totalCount === 0;

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

    // Every KPI below is ONE query against ONE condition (see
    // functions/api/assets.ts) — the label and the predicate say the same thing.
    const stats = useMemo(() => {
        const live = dataSource === 'supabase';
        const totalItems = live ? (summary.total || totalCount) : totalCount;
        return [
            { label: "TOTAL ASSETS",       value: totalItems.toString(), subtitle: "Rows in the master register", icon: Boxes, variant: "water" as const },
            { label: "ACTIVE / WORKING",   value: (live ? summary.workingStatus : assets.filter(a => ['Active', 'Working'].includes(a.status)).length).toString(), subtitle: "Status = Working / Active", icon: ClipboardCheck, variant: "success" as const },
            { label: "HIGH CRITICALITY",   value: (live ? summary.highCriticality : assets.filter(a => a.criticalityLevel === 'High').length).toString(), subtitle: "Criticality = High", icon: AlertTriangle, variant: "danger" as const },
            { label: "WITH AMC CONTRACTOR", value: (live ? summary.amcCovered : assets.filter(a => a.amcContractor).length).toString(), subtitle: "AMC contractor recorded", icon: Wrench, variant: "water" as const },
            { label: "RESERVE FUND LINKED", value: (live ? summary.boqCoverage : assets.filter(a => a.boqProjectRef).length).toString(), subtitle: "Assets with BOQ reference", icon: FileText, variant: "success" as const },
            { label: "NEEDS VERIFICATION",  value: (live ? summary.toVerify : assets.filter(a => a.status === 'TO VERIFY').length).toString(), subtitle: "Status = TO VERIFY", icon: ShieldAlert, variant: "warning" as const },
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
        n === null || n === undefined ? 'text-muted-foreground' :
        n <= 2  ? 'text-[var(--mb-danger-text)]' :
        n <= 5  ? 'text-[var(--mb-warning-text)]' :
                  'text-secondary';

    // Apply client-side sort for mock/demo data (Supabase handles it server-side)
    const rows = dataSource === 'mock'
        ? sortAssets(filteredAssets, sortField, sortDirection)
        : filteredAssets;

    // Window-scroll row virtualization (spacer-row technique) — kicks in when a
    // large page size pulls more than 100 rows. Only one tab's table is mounted
    // at a time, so a single hook instance serves every tab.
    const { bodyRef, virtualItems, paddingTop, paddingBottom } = useVirtualTableRows({
        count: rows.length,
        enabled: rows.length > 100,
    });
    const spacerRow = (height: number, cols: number) => height > 0 ? (
        <tr aria-hidden="true"><td colSpan={cols} style={{ height, padding: 0, border: 0 }} /></tr>
    ) : null;
    // Zebra striping derives from the row's index in the full list (not DOM
    // position) so it stays stable when spacer rows shift nth-child parity
    const rowCls = (i: number) =>
        `hover:bg-secondary/5 dark:hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/40 dark:bg-muted/20' : ''}`;

    /** One body renderer for all five tables — skeleton / empty / virtual rows. */
    const tableBody = (cols: number, renderRow: (a: Asset, index: number) => ReactNode) => (
        <TableBody aria-busy={loading} ref={bodyRef}>
            {loading ? (
                <TableBodySkeleton columns={cols} rows={10} />
            ) : rows.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={cols}>
                        <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets found" description="Try adjusting your filters." />
                    </TableCell>
                </TableRow>
            ) : (
                <>
                    {spacerRow(paddingTop, cols)}
                    {virtualItems.map(vi => renderRow(rows[vi.index], vi.index))}
                    {spacerRow(paddingBottom, cols)}
                </>
            )}
        </TableBody>
    );

    /** One mobile card list for all five tabs — only the card body differs. */
    const mobileList = (renderCard: (a: Asset) => ReactNode) => (
        <div className="md:hidden ops-table-shell divide-y divide-border dark:divide-border">
            {loading ? (
                <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : rows.length === 0 ? (
                <EmptyState variant={hasActiveFilters ? "filter-empty" : "no-data"} title="No assets" description="Try adjusting filters." />
            ) : rows.map(a => (
                <div key={a.id} className="p-4 space-y-2">{renderCard(a)}</div>
            ))}
        </div>
    );

    const panelProps = (tab: ActiveTab) => ({
        id: `panel-${tab}`,
        role: "tabpanel" as const,
        "aria-labelledby": `tab-${tab}`,
        tabIndex: 0,
        className: "space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    });

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Assets Register"
                    description="Master asset register — lifecycle, maintenance and financial data across all disciplines"
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    error={error}
                    loading={firstLoad}
                />
            </div>

            {/* Tabs */}
            <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="space-y-4">
                {/* KPI cards — skeleton until the first fetch resolves so we never
                    flash all-zero KPIs. */}
                {activeTab === 'overview' && (
                    <SectionBoundary title="Register KPIs">
                        {firstLoad ? <StatsGridSkeleton count={6} /> : <StatsGrid stats={stats} />}
                    </SectionBoundary>
                )}

                {activeTab === 'overview' && dataSource === 'supabase' && !firstLoad && (
                    <SectionBoundary title="Needs attention">
                        <AssetAttention summary={summary} />
                    </SectionBoundary>
                )}

                {activeTab === 'overview' && dataSource === 'supabase' && (
                    <SectionBoundary title="Register profile">
                        <AssetRegisterProfile
                            distributions={distributions}
                            loading={distributionsLoading && !distributions}
                            total={summary.total}
                        />
                    </SectionBoundary>
                )}

                {/* Toolbar — search filter sits directly above the table */}
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            aria-label="Search assets"
                            placeholder="Search name, tag, zone, manufacturer…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
                        />
                    </div>
                    <MultiSelectDropdown label="Status" options={STATUS_OPTIONS} selected={selectedStatuses} onChange={s => { setSelectedStatuses(s); setCurrentPage(1); }} getOptionColor={getStatusColor} />
                    <MultiSelectDropdown label="Discipline" options={DISCIPLINE_OPTIONS} selected={selectedDisciplines} onChange={s => { setSelectedDisciplines(s); setCurrentPage(1); }} icon={Layers} />
                    {hasActiveFilters && (
                        <button onClick={clearFilters} aria-label="Clear filters" className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors">
                            <X className="w-3.5 h-3.5" /> Clear
                        </button>
                    )}
                    <button onClick={handleExportCSV} aria-label="Export CSV" className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto">
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        <span className="font-semibold text-foreground">{firstLoad ? '—' : totalCount}</span> assets
                    </div>
                </TableToolbar>

                <ActiveFilterPills pills={[
                    ...(search ? [{ key: 'search', label: `"${search}"`, onRemove: () => { setSearch(''); setCurrentPage(1); } }] : []),
                    ...(selectedStatuses.length < STATUS_OPTIONS.length ? [{ key: 'status', label: `${selectedStatuses.length} statuses`, onRemove: () => { setSelectedStatuses([...STATUS_OPTIONS]); setCurrentPage(1); } }] : []),
                    ...(selectedDisciplines.length < DISCIPLINE_OPTIONS.length ? [{ key: 'disc', label: `${selectedDisciplines.length} disciplines`, onRemove: () => { setSelectedDisciplines([...DISCIPLINE_OPTIONS]); setCurrentPage(1); } }] : []),
                ]} />

                {/* ── TAB: OVERVIEW ─────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div {...panelProps('overview')}>
                        <SectionBoundary title="Asset register">
                            {mobileList(a => (
                                <>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{a.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{a.discipline} · {a.type}</p>
                                        </div>
                                        <CritBadge level={a.criticalityLevel} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.buildingArea || a.zone || a.location}</span>
                                        <StatusBadge label={a.status} color={getStatusColor(a.status)} />
                                    </div>
                                </>
                            ))}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky">Asset Name</SortableTableHead>
                                            <SortableTableHead field="tag" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Asset Tag</SortableTableHead>
                                            <SortableTableHead field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Discipline</SortableTableHead>
                                            <SortableTableHead field="category" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Category</SortableTableHead>
                                            <SortableTableHead field="zone" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Zone</SortableTableHead>
                                            <SortableTableHead field="building" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Building</SortableTableHead>
                                            <SortableTableHead field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                                            <SortableTableHead field="criticality" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Criticality</SortableTableHead>
                                        </TableRow>
                                    </TableHeader>
                                    {tableBody(8, (a, i) => (
                                        <TableRow key={a.id} className={rowCls(i)}>
                                            <TableCell className="col-sticky max-w-[220px] font-semibold text-foreground"><span className="line-clamp-2">{a.name}</span></TableCell>
                                            <TableCell className="meter whitespace-nowrap text-muted-foreground">{a.assetTag || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.discipline || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.type || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.zone || '-'}</TableCell>
                                            <TableCell className="max-w-[180px] text-muted-foreground">
                                                <TruncatedText text={a.buildingArea} label={`Building — ${a.name}`} lines={1} />
                                            </TableCell>
                                            <TableCell><StatusBadge label={a.status} color={getStatusColor(a.status)} /></TableCell>
                                            <TableCell><CritBadge level={a.criticalityLevel} /></TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </SectionBoundary>
                    </div>
                )}

                {/* ── TAB: LIFECYCLE ────────────────────────────────────────────── */}
                {activeTab === 'lifecycle' && (
                    <div {...panelProps('lifecycle')}>
                        <SectionBoundary title="Lifecycle">
                            {mobileList(a => (
                                <>
                                    <div className="flex items-center justify-between"><span className="meter text-xs text-muted-foreground">{a.assetTag || '-'}</span><CritBadge level={a.criticalityLevel} /></div>
                                    <p className="font-semibold text-sm text-foreground">{a.name}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Inst: {a.installYear ?? '-'}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />ERL: {fmtYrs(a.erlYears)}</span>
                                        <span>Life: {fmtYrs(a.lifeExpectancyYears)}</span>
                                    </div>
                                    <PctBar pct={a.pctLifeUsed} />
                                    {a.warrantyExpiryDate && <div className="text-xs text-muted-foreground">Warranty: {fmt(a.warrantyExpiryDate)}</div>}
                                </>
                            ))}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead field="tag" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky">Asset Tag</SortableTableHead>
                                            <SortableTableHead field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Asset Name</SortableTableHead>
                                            <SortableTableHead field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Discipline</SortableTableHead>
                                            <SortableTableHead field="installYear" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="center" className="text-center">Install Yr</SortableTableHead>
                                            <TableHead scope="col" className="text-center">Age (yrs)</TableHead>
                                            <SortableTableHead field="lifeExpect" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="center" className="text-center">Exp. Life</SortableTableHead>
                                            <SortableTableHead field="erlYears" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="center" className="text-center">ERL</SortableTableHead>
                                            <SortableTableHead field="pctLife" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>% Life Used</SortableTableHead>
                                            <SortableTableHead field="warranty" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Warranty Expiry</SortableTableHead>
                                            <SortableTableHead field="condition" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Condition</SortableTableHead>
                                            <SortableTableHead field="criticality" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Criticality</SortableTableHead>
                                        </TableRow>
                                    </TableHeader>
                                    {tableBody(11, (a, i) => (
                                        <TableRow key={a.id} className={rowCls(i)}>
                                            <TableCell className="col-sticky meter whitespace-nowrap text-muted-foreground">{a.assetTag || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] font-semibold text-foreground"><span className="line-clamp-2">{a.name}</span></TableCell>
                                            <TableCell className="text-muted-foreground">{a.discipline || '-'}</TableCell>
                                            <TableCell className="num text-center">{a.installYear ?? '-'}</TableCell>
                                            <TableCell className="num text-center">{fmtYrs(a.currentAgeYears)}</TableCell>
                                            <TableCell className="num text-center">{fmtYrs(a.lifeExpectancyYears)}</TableCell>
                                            <TableCell className={`num text-center font-semibold ${erlColor(a.erlYears)}`}>{fmtYrs(a.erlYears)}</TableCell>
                                            <TableCell><PctBar pct={a.pctLifeUsed} /></TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(a.warrantyExpiryDate)}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.condition || '-'}</TableCell>
                                            <TableCell><CritBadge level={a.criticalityLevel} /></TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </SectionBoundary>
                    </div>
                )}

                {/* ── TAB: MAINTENANCE ──────────────────────────────────────────── */}
                {activeTab === 'maintenance' && (
                    <div {...panelProps('maintenance')}>
                        <SectionBoundary title="Maintenance">
                            {mobileList(a => (
                                <>
                                    <div className="flex items-center justify-between"><span className="meter text-xs text-muted-foreground">{a.assetTag || '-'}</span>{a.ppmFrequency && <span className="text-xs font-medium text-primary">{a.ppmFrequency}</span>}</div>
                                    <p className="font-semibold text-sm text-foreground">{a.name}</p>
                                    {a.amcContractor && <div className="text-xs text-muted-foreground"><Wrench className="w-3 h-3 inline mr-1" />{a.amcContractor}</div>}
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                        {a.lastPpmDate && <span>Last: {fmt(a.lastPpmDate)}</span>}
                                        {a.nextPpmDate && <span>Next: {fmt(a.nextPpmDate)}</span>}
                                    </div>
                                    {a.amcNotes && <p className="text-xs text-muted-foreground break-words">{a.amcNotes}</p>}
                                    {a.maintenanceRequirements && <p className="text-xs text-muted-foreground break-words">{a.maintenanceRequirements}</p>}
                                </>
                            ))}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead field="tag" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky">Asset Tag</SortableTableHead>
                                            <SortableTableHead field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Asset Name</SortableTableHead>
                                            <SortableTableHead field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Discipline</SortableTableHead>
                                            <TableHead scope="col">Zone / Building</TableHead>
                                            <SortableTableHead field="ppmFreq" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>PPM Frequency</SortableTableHead>
                                            <TableHead scope="col" className="text-center">Interval (mo)</TableHead>
                                            <SortableTableHead field="amcContractor" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>AMC Contractor</SortableTableHead>
                                            <SortableTableHead field="lastPpm" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Last PPM</SortableTableHead>
                                            <SortableTableHead field="nextPpm" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Next PPM</SortableTableHead>
                                            <TableHead scope="col">AMC Notes</TableHead>
                                            <TableHead scope="col">Maintenance Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    {tableBody(11, (a, i) => (
                                        <TableRow key={a.id} className={rowCls(i)}>
                                            <TableCell className="col-sticky meter whitespace-nowrap text-muted-foreground">{a.assetTag || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] font-semibold text-foreground"><span className="line-clamp-2">{a.name}</span></TableCell>
                                            <TableCell className="text-muted-foreground">{a.discipline || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.buildingArea || a.zone || '-'}</TableCell>
                                            <TableCell className="font-medium text-primary">{a.ppmFrequency || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="num text-center">{a.ppmIntervalMonths ?? '-'}</TableCell>
                                            <TableCell className="text-foreground">{a.amcContractor || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(a.lastPpmDate)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(a.nextPpmDate)}</TableCell>
                                            <TableCell className="max-w-[200px] text-muted-foreground">
                                                <TruncatedText text={a.amcNotes} label={`AMC notes — ${a.name}`} />
                                            </TableCell>
                                            <TableCell className="max-w-[220px] text-muted-foreground">
                                                <TruncatedText text={a.maintenanceRequirements} label={`Maintenance notes — ${a.name}`} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </SectionBoundary>
                    </div>
                )}

                {/* ── TAB: TECHNICAL ────────────────────────────────────────────── */}
                {activeTab === 'technical' && (
                    <div {...panelProps('technical')}>
                        <SectionBoundary title="Technical">
                            {mobileList(a => (
                                <>
                                    <span className="meter text-xs text-muted-foreground">{a.assetTag || '-'}</span>
                                    <p className="font-semibold text-sm text-foreground">{a.name}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                                        {a.manufacturer && <span>Brand: <span className="font-medium text-foreground">{a.manufacturer}</span></span>}
                                        {a.model && <span>Model: {a.model}</span>}
                                        {a.countryOfOrigin && <span>Origin: {a.countryOfOrigin}</span>}
                                        {a.powerCapacity && <span className="break-words">Cap: {a.powerCapacity}</span>}
                                    </div>
                                </>
                            ))}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead field="tag" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky">Asset Tag</SortableTableHead>
                                            <SortableTableHead field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Asset Name</SortableTableHead>
                                            <SortableTableHead field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Discipline</SortableTableHead>
                                            <TableHead scope="col">Sub-category</TableHead>
                                            <SortableTableHead field="manufacturer" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Manufacturer</SortableTableHead>
                                            <SortableTableHead field="model" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Model</SortableTableHead>
                                            <SortableTableHead field="country" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Country</SortableTableHead>
                                            <TableHead scope="col">Power / Capacity</TableHead>
                                            <TableHead scope="col">Serial No.</TableHead>
                                            <TableHead scope="col">Reg. Authority</TableHead>
                                            <TableHead scope="col">Data Source</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    {tableBody(11, (a, i) => (
                                        <TableRow key={a.id} className={rowCls(i)}>
                                            <TableCell className="col-sticky meter whitespace-nowrap text-muted-foreground">{a.assetTag || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] font-semibold text-foreground"><span className="line-clamp-2">{a.name}</span></TableCell>
                                            <TableCell className="text-muted-foreground">{a.discipline || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.subcategory || '-'}</TableCell>
                                            <TableCell className="font-medium text-foreground">{a.manufacturer || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.model || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.countryOfOrigin || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="max-w-[160px] text-muted-foreground">
                                                <TruncatedText text={a.powerCapacity} label={`Power / capacity — ${a.name}`} lines={1} />
                                            </TableCell>
                                            <TableCell className="meter text-muted-foreground">{a.serialNo || <span className="text-muted-foreground/70 dark:text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="max-w-[170px] text-muted-foreground">
                                                <TruncatedText text={a.registrationAuthority} label={`Registration authority — ${a.name}`} lines={1} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{a.dataSource || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </SectionBoundary>
                    </div>
                )}

                {/* ── TAB: FINANCIAL ────────────────────────────────────────────── */}
                {activeTab === 'financial' && (
                    <div {...panelProps('financial')}>
                        <SectionBoundary title="Financial">
                            {mobileList(a => (
                                <>
                                    <span className="meter text-xs text-muted-foreground">{a.assetTag || '-'}</span>
                                    <p className="font-semibold text-sm text-foreground">{a.name}</p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Original: <span className="font-mono font-semibold text-foreground">{fmtOMR(a.boqUnitCost)}</span></span>
                                        <span className="text-muted-foreground">Replace: <span className="font-mono font-semibold text-primary">{fmtOMR(a.replacementCost)}</span></span>
                                    </div>
                                    {a.boqProjectRef && <div className="text-xs text-muted-foreground flex items-center gap-1 break-words"><FileText className="w-3 h-3 shrink-0" />{a.boqProjectRef}</div>}
                                    {a.notes && <p className="text-xs text-muted-foreground break-words">{a.notes}</p>}
                                </>
                            ))}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead field="tag" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky">Asset Tag</SortableTableHead>
                                            <SortableTableHead field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Asset Name</SortableTableHead>
                                            <SortableTableHead field="discipline" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Discipline</SortableTableHead>
                                            <TableHead scope="col">Zone / Building</TableHead>
                                            <SortableTableHead field="origCost" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Original Cost (OMR)</SortableTableHead>
                                            <SortableTableHead field="replCost" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Replace Cost (OMR)</SortableTableHead>
                                            <SortableTableHead field="boqRef" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>BOQ Reference</SortableTableHead>
                                            <SortableTableHead field="boqLife" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="center" className="text-center">BOQ Design Life</SortableTableHead>
                                            <TableHead scope="col">Supplier</TableHead>
                                            <TableHead scope="col">Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    {tableBody(10, (a, i) => (
                                        <TableRow key={a.id} className={rowCls(i)}>
                                            <TableCell className="col-sticky meter whitespace-nowrap text-muted-foreground">{a.assetTag || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] font-semibold text-foreground"><span className="line-clamp-2">{a.name}</span></TableCell>
                                            <TableCell className="text-muted-foreground">{a.discipline || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.buildingArea || a.zone || '-'}</TableCell>
                                            <TableCell className="num whitespace-nowrap">{fmtOMR(a.boqUnitCost)}</TableCell>
                                            <TableCell className="num whitespace-nowrap font-semibold text-primary">{fmtOMR(a.replacementCost)}</TableCell>
                                            <TableCell className="max-w-[200px] text-muted-foreground">
                                                <TruncatedText text={a.boqProjectRef} label={`BOQ reference — ${a.name}`} lines={1} />
                                            </TableCell>
                                            <TableCell className="num text-center">{a.boqDesignLife ? `${a.boqDesignLife}y` : '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{a.responsibilityOwner || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] text-muted-foreground">
                                                <TruncatedText text={a.notes} label={`Notes — ${a.name}`} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </div>
                        </SectionBoundary>
                    </div>
                )}

                {/* Pagination — endIndex counts the rows actually rendered, so the
                    footer can never claim more than the fetch returned. */}
                {totalCount > 0 && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        startIndex={startIndex}
                        endIndex={Math.min(startIndex + rows.length, totalCount)}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
                    />
                )}
            </div>
        </div>
    );
}
