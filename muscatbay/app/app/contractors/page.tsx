"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    getContractorTrackerData,
    getContractorContracts,
    getContractorYearlyCosts,
    isSupabaseConfigured,
    ContractorTracker,
    ContractorContract,
    ContractorYearlyCost
} from "@/lib/supabase";
import { StatsGridSkeleton, TableSkeleton, Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Search, Plus, Users, DollarSign, AlertCircle, Download, Calendar, Building2, RefreshCw, X, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { MultiSelectDropdown, SortIcon, TablePagination, ActiveFilterPills, TableToolbar, StatusBadge, type PageSizeOption } from "@/components/shared/data-table";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { PageStatusBar } from "@/components/shared/page-status-bar";

type ActiveTab = 'tracker' | 'contracts' | 'yearly';

export default function ContractorsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('contracts');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedFlow, setSelectedFlow] = useState<string[]>([]);

    // Sorting and pagination state
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    // Data state
    const [contractors, setContractors] = useState<ContractorTracker[]>([]);
    const [contracts, setContracts] = useState<ContractorContract[]>([]);
    const [yearlyCosts, setYearlyCosts] = useState<ContractorYearlyCost[]>([]);
    const [dataSource, setDataSource] = useState<'supabase' | 'none'>('none');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const statusesInitializedRef = useRef(false);
    const typesInitializedRef = useRef(false);
    const flowInitializedRef = useRef(false);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);

        if (!isSupabaseConfigured()) {
            if (!silent) { setDataSource('none'); setLoading(false); }
            return;
        }

        try {
            const [trackerData, contractsData, yearlyData] = await Promise.all([
                getContractorTrackerData(),
                getContractorContracts(),
                getContractorYearlyCosts(),
            ]);
            setContractors(trackerData);
            setContracts(contractsData);
            setYearlyCosts(yearlyData);
            const hasData = trackerData.length > 0 || contractsData.length > 0;
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

    const getContractTypeDotColor = (type: string | null): 'blue' | 'green' | 'orange' | 'slate' => {
        const t = type?.toLowerCase() || '';
        if (t.includes('contract')) return 'blue';
        if (t.includes('po') || t.includes('purchase')) return 'green';
        if (t.includes('quotation')) return 'orange';
        return 'slate';
    };

    // ── Tracker filters ──────────────────────────────────────────────────────
    const uniqueStatuses = useMemo(() =>
        [...new Set(contractors.map(c => c.Status).filter(Boolean))] as string[], [contractors]);
    const uniqueContractTypes = useMemo(() =>
        [...new Set(contractors.map(c => c["Contract Type"]).filter(Boolean))] as string[], [contractors]);

    useEffect(() => {
        if (!statusesInitializedRef.current && uniqueStatuses.length > 0) {
            setSelectedStatuses([...uniqueStatuses]);
            statusesInitializedRef.current = true;
        }
    }, [uniqueStatuses]);

    useEffect(() => {
        if (!typesInitializedRef.current && uniqueContractTypes.length > 0) {
            setSelectedTypes([...uniqueContractTypes]);
            typesInitializedRef.current = true;
        }
    }, [uniqueContractTypes]);

    // ── Contracts filters ────────────────────────────────────────────────────
    const uniqueFlows = useMemo(() =>
        [...new Set(contracts.map(c => c.flow).filter(Boolean))] as string[], [contracts]);

    useEffect(() => {
        if (!flowInitializedRef.current && uniqueFlows.length > 0) {
            setSelectedFlow([...uniqueFlows]);
            flowInitializedRef.current = true;
        }
    }, [uniqueFlows]);

    // ── Filtered tracker ─────────────────────────────────────────────────────
    const filteredContractors = useMemo(() => {
        let result = [...contractors];
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(c =>
                c.Contractor?.toLowerCase().includes(term) ||
                c["Service Provided"]?.toLowerCase().includes(term) ||
                c.Note?.toLowerCase().includes(term)
            );
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length)
            result = result.filter(c => c.Status && selectedStatuses.includes(c.Status));
        if (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length)
            result = result.filter(c => c["Contract Type"] && selectedTypes.includes(c["Contract Type"]));
        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '', bVal: string | number = '';
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
                }
                if (typeof aVal === 'string') return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }
        return result;
    }, [contractors, search, selectedStatuses, uniqueStatuses, selectedTypes, uniqueContractTypes, sortField, sortDirection]);

    // ── Filtered contracts ───────────────────────────────────────────────────
    const filteredContracts = useMemo(() => {
        let result = [...contracts];
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(c =>
                c.contractor?.toLowerCase().includes(term) ||
                c.service?.toLowerCase().includes(term) ||
                c.contract_ref?.toLowerCase().includes(term)
            );
        }
        if (selectedFlow.length > 0 && selectedFlow.length < uniqueFlows.length)
            result = result.filter(c => selectedFlow.includes(c.flow));
        return result;
    }, [contracts, search, selectedFlow, uniqueFlows]);

    // ── Yearly costs pivot ───────────────────────────────────────────────────
    const yearLabels = useMemo(() =>
        [...new Set(yearlyCosts.map(y => y.year_label))].sort(), [yearlyCosts]);

    const yearlyPivot = useMemo(() => {
        const map = new Map<string, Record<string, number>>();
        for (const row of yearlyCosts) {
            if (!map.has(row.contractor)) map.set(row.contractor, {});
            map.get(row.contractor)![row.year_label] = row.amount_omr ?? 0;
        }
        return Array.from(map.entries())
            .map(([contractor, years]) => ({ contractor, years }))
            .sort((a, b) => a.contractor.localeCompare(b.contractor));
    }, [yearlyCosts]);

    const filteredYearly = useMemo(() => {
        if (!search) return yearlyPivot;
        const term = search.toLowerCase();
        return yearlyPivot.filter(r => r.contractor.toLowerCase().includes(term));
    }, [yearlyPivot, search]);

    // ── Pagination (tracker) ──────────────────────────────────────────────────
    const effectivePageSize = pageSize === 'All' ? filteredContractors.length : pageSize;
    const totalPages = Math.ceil(filteredContractors.length / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;
    const paginatedContractors = filteredContractors.slice(startIndex, startIndex + effectivePageSize);

    const handleSort = useCallback((field: string) => {
        setSortField(prev => {
            if (prev === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            else setSortDirection('asc');
            return prev === field ? prev : field;
        });
        setCurrentPage(1);
    }, []);

    const handleExportCSV = () => {
        if (activeTab === 'tracker') {
            exportToCSV(
                filteredContractors.map(c => ({
                    'Contractor': c.Contractor || '',
                    'Service Provided': c["Service Provided"] || '',
                    'Status': c.Status || '',
                    'Contract Type': c["Contract Type"] || '',
                    'Start Date': c["Start Date"] || '',
                    'End Date': c["End Date"] || '',
                    'Monthly (OMR)': c["Contract (OMR)/Month"] || '',
                    'Annual Value': c["Annual Value (OMR)"] || '',
                    'Renewal Plan': c["Renewal Plan"] || '',
                    'Note': c.Note || ''
                })),
                `contractor-tracker-${getDateForFilename()}`
            );
        } else if (activeTab === 'contracts') {
            exportToCSV(
                filteredContracts.map(c => ({
                    'Contractor': c.contractor,
                    'Ref': c.contract_ref || '',
                    'Service': c.service || '',
                    'Flow': c.flow,
                    'Status': c.status,
                    'Years': c.contract_years ?? '',
                    'Annual (OMR)': c.annual_value_omr ?? '',
                    'Total (OMR)': c.total_value_omr ?? '',
                    'Rate Note': c.rate_note || '',
                    'Note': c.note || ''
                })),
                `contractor-contracts-${getDateForFilename()}`
            );
        } else {
            exportToCSV(
                yearlyCosts.map(y => ({
                    'Contractor': y.contractor,
                    'Year': y.year_label,
                    'Contract Year': y.contract_year,
                    'Amount (OMR)': y.amount_omr ?? ''
                })),
                `contractor-yearly-costs-${getDateForFilename()}`
            );
        }
    };

    const hasActiveFilters = search ||
        (activeTab === 'tracker' && (
            (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) ||
            (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length)
        )) ||
        (activeTab === 'contracts' && selectedFlow.length > 0 && selectedFlow.length < uniqueFlows.length);

    const clearFilters = () => {
        setSearch('');
        setSelectedStatuses([...uniqueStatuses]);
        setSelectedTypes([...uniqueContractTypes]);
        setSelectedFlow([...uniqueFlows]);
        setCurrentPage(1);
    };

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

    // ── Stats ─────────────────────────────────────────────────────────────────
    const activeContracts = contracts.filter(c => c.status?.toLowerCase().includes('active')).length;
    const expenseContracts = contracts.filter(c => c.flow === 'Expense');
    const revenueContracts = contracts.filter(c => c.flow === 'Revenue');
    const totalAnnualExpense = expenseContracts.reduce((s, c) => s + (c.annual_value_omr ?? 0), 0);

    const stats = [
        {
            label: "TOTAL CONTRACTS",
            value: contracts.length.toString(),
            subtitle: "All registered contracts",
            icon: FileText,
            variant: "primary" as const
        },
        {
            label: "ACTIVE CONTRACTS",
            value: activeContracts.toString(),
            subtitle: "Currently valid",
            icon: Users,
            variant: "success" as const
        },
        {
            label: "EXPENSE CONTRACTS",
            value: expenseContracts.length.toString(),
            subtitle: `${totalAnnualExpense > 0 ? totalAnnualExpense.toLocaleString() + ' OMR/yr' : 'Variable rates'}`,
            icon: TrendingDown,
            variant: "danger" as const
        },
        {
            label: "REVENUE CONTRACTS",
            value: revenueContracts.length.toString(),
            subtitle: "Income generating",
            icon: TrendingUp,
            variant: "success" as const
        }
    ];

    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'contracts', label: 'Contracts' },
        { id: 'yearly', label: 'Yearly Costs' },
        { id: 'tracker', label: 'Tracker' },
    ];

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Contractor Management"
                    description="Monitor AMC service providers, contracts, and cost breakdowns"
                    action={{ label: "Add Contractor", icon: Plus }}
                />
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                />
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearch(''); setCurrentPage(1); }}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-slate-900 border border-b-white dark:border-slate-700 dark:border-b-slate-900 text-primary -mb-px'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table Card */}
            <div className="space-y-4">
                <TableToolbar>
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                        />
                    </div>

                    {activeTab === 'tracker' && (
                        <>
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
                        </>
                    )}

                    {activeTab === 'contracts' && (
                        <MultiSelectDropdown
                            label="Flow"
                            options={uniqueFlows}
                            selected={selectedFlow}
                            onChange={(s) => { setSelectedFlow(s); setCurrentPage(1); }}
                        />
                    )}

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
                </TableToolbar>

                {/* ── Contracts Tab ────────────────────────────────────────── */}
                {activeTab === 'contracts' && (
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                    {['Contractor', 'Ref', 'Service', 'Flow', 'Status', 'Years', 'Annual (OMR)', 'Total (OMR)', 'Note'].map(h => (
                                        <th key={h} className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContracts.map((c) => (
                                    <tr key={c.id} className={`border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors border-s-4 ${c.flow === 'Revenue' ? 'border-s-emerald-500' : 'border-s-slate-300 dark:border-s-slate-600'}`}>
                                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.contractor}</td>
                                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.contract_ref || '-'}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{c.service || '-'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.flow === 'Revenue' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                                {c.flow === 'Revenue' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                {c.flow}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge label={c.status} color={getStatusDotColor(c.status)} />
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs text-slate-600 dark:text-slate-400">{c.contract_years ?? '-'}</td>
                                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-primary">
                                            {c.annual_value_omr != null ? c.annual_value_omr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (c.rate_note || '-')}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {c.total_value_omr != null ? c.total_value_omr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-500 max-w-[200px] truncate" title={c.note || ''}>
                                            {c.note || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredContracts.length === 0 && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState variant="no-data" title="No contracts found" description="Contracts will appear here once added." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Mobile contracts */}
                {activeTab === 'contracts' && (
                    <div className="md:hidden space-y-3">
                        {filteredContracts.map((c) => (
                            <div key={c.id} className={`rounded-xl border border-slate-200 dark:border-slate-700 border-s-4 ${c.flow === 'Revenue' ? 'border-s-emerald-500' : 'border-s-slate-400'} bg-white dark:bg-slate-900 p-4 space-y-3`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.contractor}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.service || '-'}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.flow === 'Revenue' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                        {c.flow}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-slate-400">Ref:</span> <span className="text-slate-600 dark:text-slate-300">{c.contract_ref || '-'}</span></div>
                                    <div><span className="text-slate-400">Years:</span> <span className="text-slate-600 dark:text-slate-300">{c.contract_years ?? '-'}</span></div>
                                    <div><span className="text-slate-400">Annual:</span> <span className="font-mono font-semibold text-primary">{c.annual_value_omr != null ? c.annual_value_omr.toLocaleString() : (c.rate_note || '-')}</span></div>
                                    <div><span className="text-slate-400">Total:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{c.total_value_omr != null ? c.total_value_omr.toLocaleString() : '-'}</span></div>
                                </div>
                                {c.note && <p className="text-xs text-slate-500 line-clamp-2">{c.note}</p>}
                            </div>
                        ))}
                        {filteredContracts.length === 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <EmptyState variant="no-data" title="No contracts found" description="Contracts will appear here once added." />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Yearly Costs Tab ─────────────────────────────────────── */}
                {activeTab === 'yearly' && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                    <th className="text-left py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50/70 dark:bg-slate-800/50 whitespace-nowrap">Contractor</th>
                                    {yearLabels.map(yr => (
                                        <th key={yr} className="text-right py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{yr}</th>
                                    ))}
                                    <th className="text-right py-3 px-4 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredYearly.map(({ contractor, years }) => {
                                    const rowTotal = yearLabels.reduce((s, yr) => s + (years[yr] ?? 0), 0);
                                    return (
                                        <tr key={contractor} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900">{contractor}</td>
                                            {yearLabels.map(yr => (
                                                <td key={yr} className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    {years[yr] != null ? years[yr].toLocaleString(undefined, { minimumFractionDigits: 2 }) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </td>
                                            ))}
                                            <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-primary">
                                                {rowTotal > 0 ? rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Totals row */}
                                {filteredYearly.length > 0 && (
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 font-semibold">
                                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50/70 dark:bg-slate-800/50">Total</td>
                                        {yearLabels.map(yr => {
                                            const colTotal = filteredYearly.reduce((s, r) => s + (r.years[yr] ?? 0), 0);
                                            return (
                                                <td key={yr} className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    {colTotal > 0 ? colTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                                                </td>
                                            );
                                        })}
                                        <td className="py-3 px-4 text-right font-mono text-xs text-primary">
                                            {filteredYearly.reduce((s, r) => s + yearLabels.reduce((ss, yr) => ss + (r.years[yr] ?? 0), 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                                {filteredYearly.length === 0 && (
                                    <tr>
                                        <td colSpan={yearLabels.length + 2}>
                                            <EmptyState variant="no-data" title="No yearly cost data" description="Yearly breakdown will appear here once added." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Tracker Tab ──────────────────────────────────────────── */}
                {activeTab === 'tracker' && (
                    <>
                        <ActiveFilterPills pills={[
                            ...(search ? [{ key: 'search', label: `Search: "${search}"`, onRemove: () => { setSearch(''); setCurrentPage(1); } }] : []),
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

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {paginatedContractors.map((contractor, index) => (
                                <div key={`mobile-${contractor.Contractor}-${index}`} className={`rounded-xl border border-slate-200 dark:border-slate-700 border-s-4 ${getStatusBorderClass(contractor.Status)} bg-white dark:bg-slate-900 p-4 space-y-3`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{contractor.Contractor || '-'}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contractor["Service Provided"] || '-'}</p>
                                        </div>
                                        <StatusBadge label={contractor.Status || 'N/A'} color={getStatusDotColor(contractor.Status)} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge label={contractor["Contract Type"] || 'N/A'} color={getContractTypeDotColor(contractor["Contract Type"])} />
                                        {contractor["Renewal Plan"] && (
                                            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                <RefreshCw className="h-3 w-3" />
                                                {contractor["Renewal Plan"]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-slate-400">Start:</span> <span className="text-slate-600 dark:text-slate-300">{contractor["Start Date"] || '-'}</span></div>
                                        <div><span className="text-slate-400">End:</span> <span className="text-slate-600 dark:text-slate-300">{contractor["End Date"] || '-'}</span></div>
                                        <div><span className="text-slate-400">Monthly:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{contractor["Contract (OMR)/Month"] || '-'}</span></div>
                                        <div><span className="text-slate-400">Annual:</span> <span className="font-mono font-semibold text-primary">{contractor["Annual Value (OMR)"]?.toLocaleString() || '-'}</span></div>
                                    </div>
                                    {contractor.Note && <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">{contractor.Note}</p>}
                                </div>
                            ))}
                            {filteredContractors.length === 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <EmptyState
                                        variant={search ? "filter-empty" : "no-data"}
                                        title={search ? "No contractors match your filters" : "No contractors yet"}
                                        description={search ? "Try adjusting your search or removing some filters." : "Contractors will appear here once added."}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/50">
                                        {[['contractor', 'Contractor'], ['service', 'Service'], ['status', 'Status'], ['contractType', 'Type']].map(([f, label]) => (
                                            <th key={f} className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort(f)}>
                                                <div className="flex items-center gap-1.5">{label} <SortIcon field={f} currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                            </th>
                                        ))}
                                        <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell" onClick={() => handleSort('startDate')}>
                                            <div className="flex items-center gap-1.5">Start <SortIcon field="startDate" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                        </th>
                                        <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell" onClick={() => handleSort('endDate')}>
                                            <div className="flex items-center gap-1.5">End <SortIcon field="endDate" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden xl:table-cell" onClick={() => handleSort('monthly')}>
                                            <div className="flex items-center justify-end gap-1.5">Monthly <SortIcon field="monthly" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                        </th>
                                        <th className="text-right py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('annual')}>
                                            <div className="flex items-center justify-end gap-1.5">Annual <SortIcon field="annual" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                        </th>
                                        <th className="text-left py-3 px-5 font-medium text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 hidden xl:table-cell">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedContractors.map((contractor, index) => (
                                        <tr key={`${contractor.Contractor}-${index}`} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">{contractor.Contractor || '-'}</td>
                                            <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 text-xs">{contractor["Service Provided"] || '-'}</td>
                                            <td className="py-3.5 px-5"><StatusBadge label={contractor.Status || 'N/A'} color={getStatusDotColor(contractor.Status)} /></td>
                                            <td className="py-3.5 px-5"><StatusBadge label={contractor["Contract Type"] || 'N/A'} color={getContractTypeDotColor(contractor["Contract Type"])} /></td>
                                            <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                                <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{contractor["Start Date"] || '-'}</div>
                                            </td>
                                            <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                                <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{contractor["End Date"] || '-'}</div>
                                            </td>
                                            <td className="py-3.5 px-5 text-right font-mono text-xs text-slate-700 dark:text-slate-300 hidden xl:table-cell">{contractor["Contract (OMR)/Month"] || '-'}</td>
                                            <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-primary">{contractor["Annual Value (OMR)"]?.toLocaleString() || '-'}</td>
                                            <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-500 max-w-[200px] truncate hidden xl:table-cell" title={contractor.Note || ''}>{contractor.Note || '-'}</td>
                                        </tr>
                                    ))}
                                    {filteredContractors.length === 0 && (
                                        <tr>
                                            <td colSpan={9}>
                                                <EmptyState
                                                    variant={search ? "filter-empty" : "no-data"}
                                                    title={search ? "No contractors match your search" : "No contractors yet"}
                                                    description={search ? "Try a different search term." : "Contractors will appear here once added."}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

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
                    </>
                )}
            </div>
        </div>
    );
}
