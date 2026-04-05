"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    getContractorTrackerData,
    getContractorContracts,
    getContractorYearlyCosts,
    isSupabaseConfigured,
    type ContractorTracker,
    type ContractorContract,
    type ContractorYearlyCost,
} from "@/lib/supabase";
import { StatsGridSkeleton, TableSkeleton, Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import {
    Search, Plus, Users, DollarSign, Download, Calendar,
    Building2, FileText, RefreshCw, X, TrendingUp, ArrowRightLeft, BarChart3, List
} from "lucide-react";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import {
    MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills,
    TableToolbar, StatusBadge, type PageSizeOption
} from "@/components/shared/data-table";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

// ─── Yearly cost matrix helpers ──────────────────────────────────────────────
interface YearRow {
    year: number;
    label: string;
    costs: Record<string, number | null>;
    total: number;
}

function buildYearlyMatrix(costs: ContractorYearlyCost[]): {
    contractors: string[];
    rows: YearRow[];
    contractorTotals: Record<string, number>;
    grandTotal: number;
} {
    // Unique contractors in a stable order (by first appearance, then alpha)
    const contractorSet = new Set<string>();
    costs.forEach(c => contractorSet.add(c.contractor));
    const contractors = [...contractorSet];

    // Unique years sorted
    const yearsMap = new Map<number, string>();
    costs.forEach(c => yearsMap.set(c.contract_year, c.year_label));
    const yearKeys = [...yearsMap.keys()].sort((a, b) => a - b);

    // Build rows
    const rows: YearRow[] = yearKeys.map(yr => {
        const costsForYear: Record<string, number | null> = {};
        contractors.forEach(cn => { costsForYear[cn] = null; });

        let total = 0;
        costs.filter(c => c.contract_year === yr).forEach(c => {
            costsForYear[c.contractor] = c.amount_omr;
            total += c.amount_omr ?? 0;
        });

        return { year: yr, label: yearsMap.get(yr)!, costs: costsForYear, total };
    });

    // Contractor totals
    const contractorTotals: Record<string, number> = {};
    contractors.forEach(cn => {
        contractorTotals[cn] = costs
            .filter(c => c.contractor === cn)
            .reduce((s, c) => s + (c.amount_omr ?? 0), 0);
    });

    const grandTotal = Object.values(contractorTotals).reduce((s, v) => s + v, 0);

    return { contractors, rows, contractorTotals, grandTotal };
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default function ContractorsPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("contracts");

    // Data
    const [contracts, setContracts] = useState<ContractorContract[]>([]);
    const [yearlyCosts, setYearlyCosts] = useState<ContractorYearlyCost[]>([]);
    const [trackerData, setTrackerData] = useState<ContractorTracker[]>([]);
    const [dataSource, setDataSource] = useState<'supabase' | 'none'>('none');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Contracts tab: search, sort, pagination
    const [search, setSearch] = useState("");
    const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    // Tracker tab: separate filters
    const [trackerSearch, setTrackerSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [trackerSortField, setTrackerSortField] = useState<string | null>(null);
    const [trackerSortDir, setTrackerSortDir] = useState<'asc' | 'desc'>('asc');
    const [trackerPage, setTrackerPage] = useState(1);
    const [trackerPageSize, setTrackerPageSize] = useState<PageSizeOption>(25);

    const flowsInitRef = useRef(false);
    const statusInitRef = useRef(false);
    const typeInitRef = useRef(false);

    // ── Data loading ─────────────────────────────────────────────────────────
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        if (!isSupabaseConfigured()) {
            if (!silent) { setDataSource('none'); setLoading(false); }
            return;
        }
        try {
            const [contractsRes, yearlyRes, trackerRes] = await Promise.all([
                getContractorContracts(),
                getContractorYearlyCosts(),
                getContractorTrackerData(),
            ]);
            setContracts(contractsRes);
            setYearlyCosts(yearlyRes);
            setTrackerData(trackerRes);
            const hasData = contractsRes.length > 0 || trackerRes.length > 0;
            setDataSource(hasData ? 'supabase' : 'none');
            if (hasData) setLastUpdated(new Date());
        } catch (e) {
            if (!silent) { console.error("Failed to load contractors data", e); setDataSource('none'); }
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const { isLive } = useSupabaseRealtime({
        table: 'contractor_contracts',
        channelName: 'contractor-contracts-rt',
        onChanged: () => loadData(true),
        enabled: dataSource === 'supabase',
    });

    useEffect(() => { loadData(); }, [loadData]);

    // ── Contracts tab: derived data ──────────────────────────────────────────
    const uniqueFlows = useMemo(() =>
        [...new Set(contracts.map(c => c.flow).filter(Boolean))],
        [contracts]
    );

    useEffect(() => {
        if (!flowsInitRef.current && uniqueFlows.length > 0) {
            setSelectedFlows([...uniqueFlows]);
            flowsInitRef.current = true;
        }
    }, [uniqueFlows]);

    const filteredContracts = useMemo(() => {
        let result = [...contracts];
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(c =>
                c.contractor.toLowerCase().includes(term) ||
                c.service?.toLowerCase().includes(term) ||
                c.contract_ref?.toLowerCase().includes(term)
            );
        }
        if (selectedFlows.length > 0 && selectedFlows.length < uniqueFlows.length) {
            result = result.filter(c => selectedFlows.includes(c.flow));
        }
        if (sortField) {
            result.sort((a, b) => {
                let aV: string | number = '';
                let bV: string | number = '';
                switch (sortField) {
                    case 'contractor': aV = a.contractor; bV = b.contractor; break;
                    case 'service': aV = a.service || ''; bV = b.service || ''; break;
                    case 'flow': aV = a.flow; bV = b.flow; break;
                    case 'years': aV = a.contract_years ?? 0; bV = b.contract_years ?? 0; break;
                    case 'annual': aV = a.annual_value_omr ?? 0; bV = b.annual_value_omr ?? 0; break;
                    case 'total': aV = a.total_value_omr ?? 0; bV = b.total_value_omr ?? 0; break;
                }
                if (typeof aV === 'string') return sortDirection === 'asc' ? aV.localeCompare(bV as string) : (bV as string).localeCompare(aV);
                return sortDirection === 'asc' ? (aV as number) - (bV as number) : (bV as number) - (aV as number);
            });
        }
        return result;
    }, [contracts, search, selectedFlows, uniqueFlows, sortField, sortDirection]);

    const effectivePageSize = pageSize === 'All' ? filteredContracts.length : pageSize;
    const totalPages = Math.ceil(filteredContracts.length / (effectivePageSize || 1));
    const startIdx = (currentPage - 1) * effectivePageSize;
    const paginatedContracts = filteredContracts.slice(startIdx, startIdx + effectivePageSize);

    // ── Tracker tab: derived data ────────────────────────────────────────────
    const uniqueStatuses = useMemo(() =>
        [...new Set(trackerData.map(c => c.Status).filter(Boolean))] as string[],
        [trackerData]
    );
    const uniqueContractTypes = useMemo(() =>
        [...new Set(trackerData.map(c => c["Contract Type"]).filter(Boolean))] as string[],
        [trackerData]
    );

    useEffect(() => {
        if (!statusInitRef.current && uniqueStatuses.length > 0) {
            setSelectedStatuses([...uniqueStatuses]);
            statusInitRef.current = true;
        }
    }, [uniqueStatuses]);

    useEffect(() => {
        if (!typeInitRef.current && uniqueContractTypes.length > 0) {
            setSelectedTypes([...uniqueContractTypes]);
            typeInitRef.current = true;
        }
    }, [uniqueContractTypes]);

    const filteredTracker = useMemo(() => {
        let result = [...trackerData];
        if (trackerSearch) {
            const term = trackerSearch.toLowerCase();
            result = result.filter(c =>
                c.Contractor?.toLowerCase().includes(term) ||
                c["Service Provided"]?.toLowerCase().includes(term)
            );
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) {
            result = result.filter(c => c.Status && selectedStatuses.includes(c.Status));
        }
        if (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length) {
            result = result.filter(c => c["Contract Type"] && selectedTypes.includes(c["Contract Type"]));
        }
        if (trackerSortField) {
            result.sort((a, b) => {
                let aV: string | number = '';
                let bV: string | number = '';
                switch (trackerSortField) {
                    case 'contractor': aV = a.Contractor || ''; bV = b.Contractor || ''; break;
                    case 'service': aV = a["Service Provided"] || ''; bV = b["Service Provided"] || ''; break;
                    case 'status': aV = a.Status || ''; bV = b.Status || ''; break;
                    case 'annual': aV = a["Annual Value (OMR)"] || 0; bV = b["Annual Value (OMR)"] || 0; break;
                }
                if (typeof aV === 'string') return trackerSortDir === 'asc' ? aV.localeCompare(bV as string) : (bV as string).localeCompare(aV);
                return trackerSortDir === 'asc' ? (aV as number) - (bV as number) : (bV as number) - (aV as number);
            });
        }
        return result;
    }, [trackerData, trackerSearch, selectedStatuses, uniqueStatuses, selectedTypes, uniqueContractTypes, trackerSortField, trackerSortDir]);

    const trackerEffPageSize = trackerPageSize === 'All' ? filteredTracker.length : trackerPageSize;
    const trackerTotalPages = Math.ceil(filteredTracker.length / (trackerEffPageSize || 1));
    const trackerStartIdx = (trackerPage - 1) * trackerEffPageSize;
    const paginatedTracker = filteredTracker.slice(trackerStartIdx, trackerStartIdx + trackerEffPageSize);

    // ── Yearly matrix ────────────────────────────────────────────────────────
    const matrix = useMemo(() => buildYearlyMatrix(yearlyCosts), [yearlyCosts]);

    // ── Shared handlers ──────────────────────────────────────────────────────
    const handleSort = useCallback((field: string) => {
        setSortField(prev => {
            if (prev === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            else setSortDirection('asc');
            return prev === field ? prev : field;
        });
        setCurrentPage(1);
    }, []);

    const handleTrackerSort = useCallback((field: string) => {
        setTrackerSortField(prev => {
            if (prev === field) setTrackerSortDir(d => d === 'asc' ? 'desc' : 'asc');
            else setTrackerSortDir('asc');
            return prev === field ? prev : field;
        });
        setTrackerPage(1);
    }, []);

    const getFlowDotColor = (flow: string): 'red' | 'green' | 'blue' | 'slate' => {
        if (flow === 'Revenue') return 'green';
        return 'blue';
    };

    const getStatusDotColor = (status: string | null): 'green' | 'red' | 'orange' | 'blue' | 'slate' => {
        const s = status?.toLowerCase() || '';
        if (s.includes('active')) return 'green';
        if (s.includes('expired')) return 'red';
        if (s.includes('retain')) return 'orange';
        return 'blue';
    };

    const getStatusBorderClass = (status: string | null): string => {
        const s = status?.toLowerCase() || '';
        if (s.includes('active')) return 'border-s-emerald-500';
        if (s.includes('expired')) return 'border-s-red-400';
        if (s.includes('retain')) return 'border-s-amber-500';
        return 'border-s-blue-400';
    };

    const handleExportContracts = () => {
        exportToCSV(
            filteredContracts.map(c => ({
                '#': c.id,
                Contractor: c.contractor,
                'Contract Ref': c.contract_ref || '',
                Service: c.service || '',
                Flow: c.flow,
                Years: c.contract_years ?? '',
                'Annual (OMR)': c.annual_value_omr ?? 'Variable',
                'Total Value (OMR)': c.total_value_omr ?? 'Variable',
                Note: c.note || '',
            })),
            `contractor-contracts-${getDateForFilename()}`
        );
    };

    const handleExportYearly = () => {
        const rows = matrix.rows.map(r => {
            const row: Record<string, string | number> = { Year: r.label };
            matrix.contractors.forEach(cn => {
                row[cn] = r.costs[cn] != null ? r.costs[cn]! : '';
            });
            row['Year Total (OMR)'] = r.total;
            return row;
        });
        exportToCSV(rows, `contractor-yearly-costs-${getDateForFilename()}`);
    };

    // ── Format helpers ───────────────────────────────────────────────────────
    const fmtOMR = (v: number | null | undefined): string => {
        if (v == null) return '-';
        return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const shortName = (name: string): string => {
        if (name.length <= 14) return name;
        // Abbreviate for the matrix header
        const abbrevMap: Record<string, string> = {
            'OWATCO': 'OWATCO',
            'Kalhat Services': 'Kalhat',
            'KONE Assarain LLC': 'KONE',
            'BEC (Fire)': 'BEC',
            'Gulf Expert (HVAC)': 'GE HVAC',
            'Gulf Expert (BMS)': 'GE BMS',
            'Muna Noor': 'Muna Noor',
            'Tadoom': 'Tadoom',
            'National Marine': 'Natl Marine',
            'Muscat Electronics': 'Muscat Elec',
            'Al Khalili': 'Al Khalili',
            'Iron Mountain': 'Iron Mtn',
        };
        return abbrevMap[name] || name.slice(0, 12) + '…';
    };

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <StatsGridSkeleton />
                <Skeleton className="h-12 w-80" />
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <TableSkeleton columns={7} rows={8} />
                </div>
            </div>
        );
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    const expenseContracts = contracts.filter(c => c.flow === 'Expense');
    const revenueContracts = contracts.filter(c => c.flow === 'Revenue');
    const totalContractValue = expenseContracts.reduce((s, c) => s + (c.total_value_omr ?? 0), 0);
    const currentYearExpense = matrix.rows.length > 0 ? matrix.rows[0].total : 0;

    const stats = [
        {
            label: "TOTAL CONTRACTS",
            value: contracts.length.toString(),
            subtitle: `${expenseContracts.length} expense, ${revenueContracts.length} revenue`,
            icon: Building2,
            variant: "primary" as const,
        },
        {
            label: "EXPENSE CONTRACTS",
            value: expenseContracts.length.toString(),
            subtitle: "Active service providers",
            icon: Users,
            variant: "info" as const,
        },
        {
            label: "REVENUE STREAMS",
            value: revenueContracts.length.toString(),
            subtitle: "Sewage tanker discharge",
            icon: ArrowRightLeft,
            variant: "success" as const,
        },
        {
            label: "TOTAL CONTRACT VALUE",
            value: `${totalContractValue.toLocaleString()} OMR`,
            subtitle: `Year 1 expense: ${currentYearExpense.toLocaleString()} OMR`,
            icon: DollarSign,
            variant: "warning" as const,
        },
    ];

    const hasContractFilters = search || (selectedFlows.length > 0 && selectedFlows.length < uniqueFlows.length);
    const hasTrackerFilters = trackerSearch ||
        (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) ||
        (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header + Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Contractor Management"
                    description="Contracts, year-by-year costs, and AMC service tracking"
                    action={{ label: "Add Contractor", icon: Plus }}
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                />
            </div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Tabs */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { key: 'contracts', label: 'Contracts', icon: FileText },
                    { key: 'yearly', label: 'Yearly Costs', icon: BarChart3 },
                    { key: 'tracker', label: 'AMC Tracker', icon: List },
                ]}
            />

            {/* ═══════════════════ TAB 1: CONTRACTS ═══════════════════ */}
            {activeTab === 'contracts' && (
                <div className="space-y-4">
                    <TableToolbar>
                        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search contracts..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                            />
                        </div>

                        <MultiSelectDropdown
                            label="Flow"
                            options={uniqueFlows}
                            selected={selectedFlows}
                            onChange={(s) => { setSelectedFlows(s); setCurrentPage(1); }}
                        />

                        {hasContractFilters && (
                            <button onClick={() => { setSearch(''); setSelectedFlows([...uniqueFlows]); setCurrentPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}

                        <button onClick={handleExportContracts}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors ml-auto">
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>

                        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredContracts.length}</span>
                            {filteredContracts.length !== contracts.length && <span> of {contracts.length}</span>} contracts
                        </div>
                    </TableToolbar>

                    {hasContractFilters && (
                        <ActiveFilterPills pills={[
                            ...(search ? [{ key: 'search', label: `Search: "${search}"`, onRemove: () => { setSearch(''); setCurrentPage(1); } }] : []),
                            ...(selectedFlows.length > 0 && selectedFlows.length < uniqueFlows.length ? [{
                                key: 'flow',
                                label: selectedFlows.join(', '),
                                colorClass: selectedFlows[0] === 'Revenue' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                                onRemove: () => { setSelectedFlows([...uniqueFlows]); setCurrentPage(1); }
                            }] : []),
                        ]} />
                    )}

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {paginatedContracts.map(c => (
                            <div key={c.id} className={`rounded-xl border border-slate-200 dark:border-slate-700 border-s-4 ${c.flow === 'Revenue' ? 'border-s-emerald-500' : 'border-s-blue-500'} bg-white dark:bg-slate-900 p-4 space-y-3`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{c.contractor}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.service || '-'}</p>
                                    </div>
                                    <StatusBadge label={c.flow} color={getFlowDotColor(c.flow)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-slate-400">Ref:</span> <span className="text-slate-600 dark:text-slate-300">{c.contract_ref || '-'}</span></div>
                                    <div><span className="text-slate-400">Years:</span> <span className="text-slate-600 dark:text-slate-300">{c.contract_years ?? '-'}</span></div>
                                    <div><span className="text-slate-400">Annual:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{c.annual_value_omr ? fmtOMR(c.annual_value_omr) : (c.rate_note || 'Variable')}</span></div>
                                    <div><span className="text-slate-400">Total:</span> <span className="font-mono font-semibold text-primary">{c.total_value_omr ? fmtOMR(c.total_value_omr) : 'Variable'}</span></div>
                                </div>
                                {c.note && <p className="text-xs text-slate-500 line-clamp-2">{c.note}</p>}
                            </div>
                        ))}
                        {filteredContracts.length === 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <EmptyState variant={hasContractFilters ? "filter-empty" : "no-data"}
                                    title={hasContractFilters ? "No contracts match your filters" : "No contracts yet"}
                                    description={hasContractFilters ? "Try adjusting your search or filters." : "Contracts will appear once added to the system."} />
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 w-8">#</th>
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('contractor')}>
                                        <div className="flex items-center gap-1.5">Contractor <SortIcon field="contractor" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden lg:table-cell">Contract Ref</th>
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('service')}>
                                        <div className="flex items-center gap-1.5">Service <SortIcon field="service" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('flow')}>
                                        <div className="flex items-center gap-1.5">Flow <SortIcon field="flow" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('years')}>
                                        <div className="flex items-center justify-center gap-1.5">Years <SortIcon field="years" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                    <th className="text-right py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('annual')}>
                                        <div className="flex items-center justify-end gap-1.5">Annual (OMR) <SortIcon field="annual" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                    <th className="text-right py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('total')}>
                                        <div className="flex items-center justify-end gap-1.5">Total (OMR) <SortIcon field="total" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContracts.map(c => (
                                    <tr key={c.id} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4 text-xs text-slate-400">{c.id}</td>
                                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                                            {c.contractor}
                                            {c.note && <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] truncate" title={c.note}>{c.note}</p>}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell font-mono">{c.contract_ref || '-'}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{c.service || '-'}</td>
                                        <td className="py-3 px-4">
                                            <StatusBadge label={c.flow} color={getFlowDotColor(c.flow)} />
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs text-slate-600 dark:text-slate-300">{c.contract_years ?? '-'}</td>
                                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {c.annual_value_omr ? fmtOMR(c.annual_value_omr) : <span className="text-slate-400 italic">{c.rate_note || 'Variable'}</span>}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-primary">
                                            {c.total_value_omr ? fmtOMR(c.total_value_omr) : <span className="text-slate-400 italic font-normal">Variable</span>}
                                        </td>
                                    </tr>
                                ))}
                                {filteredContracts.length === 0 && (
                                    <tr><td colSpan={8}>
                                        <EmptyState variant={hasContractFilters ? "filter-empty" : "no-data"}
                                            title={hasContractFilters ? "No contracts match" : "No contracts yet"}
                                            description="Contracts will appear once added." />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredContracts.length > 0 && (
                        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredContracts.length}
                            pageSize={pageSize} startIndex={startIdx} endIndex={Math.min(startIdx + effectivePageSize, filteredContracts.length)}
                            onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
                    )}
                </div>
            )}

            {/* ═══════════════════ TAB 2: YEARLY COSTS ═══════════════════ */}
            {activeTab === 'yearly' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Year-by-Year Expense Breakdown</h3>
                            <p className="text-xs text-slate-500 mt-1">All values in OMR. Blank cells indicate no cost in that year.</p>
                        </div>
                        <button onClick={handleExportYearly}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                    </div>

                    {yearlyCosts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <EmptyState variant="no-data" title="No yearly cost data" description="Run the contractor-contracts-data.sql script in Supabase to populate yearly costs." />
                        </div>
                    ) : (
                        <>
                            {/* Mobile: stacked cards per year */}
                            <div className="md:hidden space-y-4">
                                {matrix.rows.map(row => (
                                    <div key={row.year} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Year {row.year}</p>
                                                <p className="text-xs text-slate-500">{row.label}</p>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-primary">{fmtOMR(row.total)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                            {matrix.contractors.map(cn => {
                                                const val = row.costs[cn];
                                                if (val == null) return null;
                                                return (
                                                    <div key={cn} className="flex justify-between">
                                                        <span className="text-slate-500 truncate mr-2">{shortName(cn)}</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{fmtOMR(val)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: matrix table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                                <table className="w-full text-sm border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                            <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50/70 dark:bg-slate-800/50 z-10">Year</th>
                                            {matrix.contractors.map(cn => (
                                                <th key={cn} className="text-right py-3 px-3 font-medium text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700" title={cn}>
                                                    {shortName(cn)}
                                                </th>
                                            ))}
                                            <th className="text-right py-3 px-4 font-semibold text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-700/30">Year Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrix.rows.map(row => (
                                            <tr key={row.year} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10">
                                                    <span className="text-xs text-slate-400 mr-1.5">Y{row.year}</span>
                                                    {row.label}
                                                </td>
                                                {matrix.contractors.map(cn => {
                                                    const val = row.costs[cn];
                                                    return (
                                                        <td key={cn} className="py-3 px-3 text-right font-mono text-xs">
                                                            {val != null ? (
                                                                <span className="text-slate-700 dark:text-slate-300">{fmtOMR(val)}</span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-3 px-4 text-right font-mono text-xs font-bold text-primary bg-slate-50/40 dark:bg-slate-800/20">
                                                    {fmtOMR(row.total)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals row */}
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/50 font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50/80 dark:bg-slate-800/50 z-10">Contract Total</td>
                                            {matrix.contractors.map(cn => (
                                                <td key={cn} className="py-3 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    {fmtOMR(matrix.contractorTotals[cn])}
                                                </td>
                                            ))}
                                            <td className="py-3 px-4 text-right font-mono text-sm font-bold text-primary bg-slate-100/60 dark:bg-slate-700/30">
                                                {fmtOMR(matrix.grandTotal)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Revenue note */}
                            {revenueContracts.length > 0 && (
                                <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Revenue Contracts
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                                        {revenueContracts.map(c => c.contractor).join(' & ')} — Sewage tanker discharge at OMR 5.000 per load (Dec 2025 → Nov 2026). Revenue depends on number of loads delivered, tracked monthly.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════ TAB 3: AMC TRACKER (legacy) ═══════════════════ */}
            {activeTab === 'tracker' && (
                <div className="space-y-4">
                    <TableToolbar>
                        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search tracker..." value={trackerSearch}
                                onChange={(e) => { setTrackerSearch(e.target.value); setTrackerPage(1); }}
                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow" />
                        </div>
                        <MultiSelectDropdown label="Status" options={uniqueStatuses} selected={selectedStatuses}
                            onChange={(s) => { setSelectedStatuses(s); setTrackerPage(1); }} />
                        <MultiSelectDropdown label="Type" options={uniqueContractTypes} selected={selectedTypes}
                            onChange={(s) => { setSelectedTypes(s); setTrackerPage(1); }} />
                        {hasTrackerFilters && (
                            <button onClick={() => { setTrackerSearch(''); setSelectedStatuses([...uniqueStatuses]); setSelectedTypes([...uniqueContractTypes]); setTrackerPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap ml-auto">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredTracker.length}</span>
                            {filteredTracker.length !== trackerData.length && <span> of {trackerData.length}</span>} entries
                        </div>
                    </TableToolbar>

                    {hasTrackerFilters && (
                        <ActiveFilterPills pills={[
                            ...(trackerSearch ? [{ key: 'search', label: `"${trackerSearch}"`, onRemove: () => { setTrackerSearch(''); setTrackerPage(1); } }] : []),
                            ...(selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length ? [{
                                key: 'status', label: `${selectedStatuses.length} status${selectedStatuses.length !== 1 ? 'es' : ''}`,
                                colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                                onRemove: () => { setSelectedStatuses([...uniqueStatuses]); setTrackerPage(1); }
                            }] : []),
                            ...(selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length ? [{
                                key: 'type', label: `${selectedTypes.length} type${selectedTypes.length !== 1 ? 's' : ''}`,
                                colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                                onRemove: () => { setSelectedTypes([...uniqueContractTypes]); setTrackerPage(1); }
                            }] : []),
                        ]} />
                    )}

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {paginatedTracker.map(c => {
                            const rowKey = `${c.Contractor ?? 'unknown'}--${c["Service Provided"] ?? ''}`;
                            return (
                                <div key={`m-${rowKey}`} className={`rounded-xl border border-slate-200 dark:border-slate-700 border-s-4 ${getStatusBorderClass(c.Status)} bg-white dark:bg-slate-900 p-4 space-y-3`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{c.Contractor || '-'}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c["Service Provided"] || '-'}</p>
                                        </div>
                                        <StatusBadge label={c.Status || 'N/A'} color={getStatusDotColor(c.Status)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-slate-400">Start:</span> <span className="text-slate-600 dark:text-slate-300">{c["Start Date"] || '-'}</span></div>
                                        <div><span className="text-slate-400">End:</span> <span className="text-slate-600 dark:text-slate-300">{c["End Date"] || '-'}</span></div>
                                        <div><span className="text-slate-400">Monthly:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{c["Contract (OMR)/Month"] || '-'}</span></div>
                                        <div><span className="text-slate-400">Annual:</span> <span className="font-mono font-semibold text-primary">{c["Annual Value (OMR)"]?.toLocaleString() || '-'}</span></div>
                                    </div>
                                    {c["Renewal Plan"] && (
                                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><RefreshCw className="h-3 w-3" />{c["Renewal Plan"]}</span>
                                    )}
                                </div>
                            );
                        })}
                        {filteredTracker.length === 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <EmptyState variant={hasTrackerFilters ? "filter-empty" : "no-data"}
                                    title={hasTrackerFilters ? "No entries match" : "No tracker data"}
                                    description="Adjust filters or add data to the Contractor_Tracker table." />
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleTrackerSort('contractor')}>
                                        <div className="flex items-center gap-1.5">Contractor <SortIcon field="contractor" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} /></div>
                                    </th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleTrackerSort('service')}>
                                        <div className="flex items-center gap-1.5">Service <SortIcon field="service" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} /></div>
                                    </th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleTrackerSort('status')}>
                                        <div className="flex items-center gap-1.5">Status <SortIcon field="status" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} /></div>
                                    </th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Type</th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden lg:table-cell">Start</th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden lg:table-cell">End</th>
                                    <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleTrackerSort('annual')}>
                                        <div className="flex items-center justify-end gap-1.5">Annual <SortIcon field="annual" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} /></div>
                                    </th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden xl:table-cell">Renewal</th>
                                    <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden xl:table-cell">Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTracker.map(c => (
                                    <tr key={`${c.Contractor ?? ''}--${c["Service Provided"] ?? ''}`} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">{c.Contractor || '-'}</td>
                                        <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400">{c["Service Provided"] || '-'}</td>
                                        <td className="py-3.5 px-5"><StatusBadge label={c.Status || 'N/A'} color={getStatusDotColor(c.Status)} /></td>
                                        <td className="py-3.5 px-5 text-xs text-slate-500">{c["Contract Type"] || '-'}</td>
                                        <td className="py-3.5 px-5 text-xs text-slate-500 hidden lg:table-cell">
                                            {c["Start Date"] ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c["Start Date"]}</span> : '-'}
                                        </td>
                                        <td className="py-3.5 px-5 text-xs text-slate-500 hidden lg:table-cell">
                                            {c["End Date"] ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c["End Date"]}</span> : '-'}
                                        </td>
                                        <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-primary">{c["Annual Value (OMR)"]?.toLocaleString() || '-'}</td>
                                        <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400 hidden xl:table-cell">
                                            {c["Renewal Plan"] ? <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 text-blue-500" />{c["Renewal Plan"]}</span> : '-'}
                                        </td>
                                        <td className="py-3.5 px-5 text-xs text-slate-500 max-w-[200px] truncate hidden xl:table-cell" title={c.Note || ''}>{c.Note || '-'}</td>
                                    </tr>
                                ))}
                                {filteredTracker.length === 0 && (
                                    <tr><td colSpan={9}>
                                        <EmptyState variant={hasTrackerFilters ? "filter-empty" : "no-data"}
                                            title={hasTrackerFilters ? "No entries match" : "No tracker data"}
                                            description="Adjust filters or add data." />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredTracker.length > 0 && (
                        <TablePagination currentPage={trackerPage} totalPages={trackerTotalPages} totalItems={filteredTracker.length}
                            pageSize={trackerPageSize} startIndex={trackerStartIdx} endIndex={Math.min(trackerStartIdx + trackerEffPageSize, filteredTracker.length)}
                            onPageChange={setTrackerPage} onPageSizeChange={(s) => { setTrackerPageSize(s); setTrackerPage(1); }} />
                    )}
                </div>
            )}
        </div>
    );
}
