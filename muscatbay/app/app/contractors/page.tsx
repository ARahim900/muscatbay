"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    getContractorTrackerData,
    getContractorContracts,
    getContractorYearlyCosts,
    getContractorExpiry,
    getContractorDetails,
    getContractorPricing,
    updateContractPdfUrl,
    isSupabaseConfigured,
    type ContractorTracker,
    type ContractorContract,
    type ContractorYearlyCost,
} from "@/lib/supabase";
import type {
    AmcContractorDetails, AmcContractorExpiry, AmcContractorPricing,
} from "@/entities/contractor";
import { StatsGridSkeleton, TableSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
    Search, Users, DollarSign, Download, Calendar,
    Building2, FileText, RefreshCw, X, TrendingUp, ArrowRightLeft, BarChart3, List,
    ExternalLink, FileWarning, Link, Pencil, Check, Loader2, AlertCircle, CalendarClock, ScrollText,
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import {
    MultiSelectDropdown, TablePagination, ActiveFilterPills,
    TableToolbar, StatusBadge, SortableTableHead, ExportButton,
    type PageSizeOption, type ExportColumn
} from "@/components/shared/data-table";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useVirtualTableRows } from "@/hooks/useVirtualTableRows";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { ExpiryBadge, expiryStatus } from "./contract-dates";
import { RenewalsPanel } from "./renewals";
import { TermsPanel } from "./terms";
import { PricingPanel } from "./pricing";
import { YearlyCostChart } from "./yearly-chart";

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

// Full Contractor_Tracker column set for the AMC Tracker database export
const TRACKER_EXPORT_COLUMNS: ExportColumn<ContractorTracker>[] = [
    { key: 'Contractor', header: 'Contractor' },
    { key: 'Service Provided', header: 'Service Provided' },
    { key: 'Status', header: 'Status' },
    { key: 'Contract Type', header: 'Contract Type' },
    { key: 'Start Date', header: 'Start Date' },
    { key: 'End Date', header: 'End Date' },
    { key: 'Contract (OMR)/Month', header: 'Contract (OMR)/Month' },
    { key: 'Contract Total (OMR)/Year', header: 'Contract Total (OMR)/Year' },
    { key: 'Annual Value (OMR)', header: 'Annual Value (OMR)' },
    { key: 'Renewal Plan', header: 'Renewal Plan' },
    { key: 'Note', header: 'Note' },
];

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit).
// Key is versioned: the cached payload grew when the expiry / terms / pricing
// tables were wired in, and a stale entry must not seed the new shape.
const CONTRACTORS_CACHE_KEY = "contractors:page:v2";
interface ContractorsPageCache {
    contracts: ContractorContract[];
    yearlyCosts: ContractorYearlyCost[];
    trackerData: ContractorTracker[];
    expiry: AmcContractorExpiry[];
    details: AmcContractorDetails[];
    pricing: AmcContractorPricing[];
    lastUpdated: Date;
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default function ContractorsPage() {
    // Seed from the session cache so revisits render instantly (silent refresh below)
    const [cached] = useState(() => getPageCache<ContractorsPageCache>(CONTRACTORS_CACHE_KEY));
    const [loading, setLoading] = useState(!cached);
    const [activeTab, setActiveTab] = useState("tracker");

    // Data
    const [contracts, setContracts] = useState<ContractorContract[]>(cached?.contracts ?? []);
    const [yearlyCosts, setYearlyCosts] = useState<ContractorYearlyCost[]>(cached?.yearlyCosts ?? []);
    const [trackerData, setTrackerData] = useState<ContractorTracker[]>(cached?.trackerData ?? []);
    const [expiry, setExpiry] = useState<AmcContractorExpiry[]>(cached?.expiry ?? []);
    const [details, setDetails] = useState<AmcContractorDetails[]>(cached?.details ?? []);
    const [pricing, setPricing] = useState<AmcContractorPricing[]>(cached?.pricing ?? []);
    const [dataSource, setDataSource] = useState<'supabase' | 'none'>(cached ? 'supabase' : 'none');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
    // A failed load must never look like an empty database.
    const [error, setError] = useState<string | null>(null);

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

    // PDF modal
    const [pdfModal, setPdfModal] = useState<{
        isOpen: boolean;
        contractId: number | null;
        contractorName: string;
        contractRef: string;
        pdfUrl: string | null | undefined;
    }>({ isOpen: false, contractId: null, contractorName: '', contractRef: '', pdfUrl: null });
    const [pdfLinkInput, setPdfLinkInput] = useState('');
    const [pdfLinkSaving, setPdfLinkSaving] = useState(false);
    const [pdfLinkEditing, setPdfLinkEditing] = useState(false);
    const [pdfLinkError, setPdfLinkError] = useState<string | null>(null);

    const openPdfModal = useCallback((id: number | null, name: string, ref: string, url: string | null | undefined) => {
        setPdfModal({ isOpen: true, contractId: id, contractorName: name, contractRef: ref, pdfUrl: url });
        setPdfLinkInput(url || '');
        setPdfLinkEditing(!url);
        setPdfLinkError(null);
    }, []);

    const closePdfModal = useCallback(() => {
        setPdfModal(prev => ({ ...prev, isOpen: false }));
        setPdfLinkEditing(false);
        setPdfLinkError(null);
    }, []);

    const savePdfLink = useCallback(async () => {
        if (!pdfModal.contractId) return;
        setPdfLinkSaving(true);
        setPdfLinkError(null);
        const url = pdfLinkInput.trim() || null;
        // The write used to be fire-and-forget: a rejected update left the
        // dialog looking exactly like a successful save.
        const result = await updateContractPdfUrl(pdfModal.contractId, url);
        if (result.ok) {
            setPdfModal(prev => ({ ...prev, pdfUrl: url }));
            setContracts(prev => prev.map(c =>
                c.id === pdfModal.contractId ? { ...c, contract_pdf_url: url } : c
            ));
            setPdfLinkEditing(false);
        } else {
            setPdfLinkError(result.error ?? 'The link could not be saved. Please try again.');
        }
        setPdfLinkSaving(false);
    }, [pdfModal.contractId, pdfLinkInput]);

    const flowsInitRef = useRef(false);
    const statusInitRef = useRef(false);
    const typeInitRef = useRef(false);

    // ── Data loading ─────────────────────────────────────────────────────────
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        if (!isSupabaseConfigured()) {
            if (!silent) {
                setDataSource('none');
                setError("Not connected to Supabase — no contractor data can be loaded.");
                setLoading(false);
            }
            return;
        }
        try {
            const [contractsRes, yearlyRes, trackerRes, expiryRes, detailsRes, pricingRes] = await Promise.all([
                getContractorContracts(),
                getContractorYearlyCosts(),
                getContractorTrackerData(),
                getContractorExpiry(),
                getContractorDetails(),
                getContractorPricing(),
            ]);
            setContracts(contractsRes);
            setYearlyCosts(yearlyRes);
            setTrackerData(trackerRes);
            setExpiry(expiryRes);
            setDetails(detailsRes);
            setPricing(pricingRes);
            setError(null);
            const hasData = contractsRes.length > 0 || trackerRes.length > 0;
            setDataSource(hasData ? 'supabase' : 'none');
            if (hasData) {
                const now = new Date();
                setLastUpdated(now);
                setPageCache<ContractorsPageCache>(CONTRACTORS_CACHE_KEY, {
                    contracts: contractsRes,
                    yearlyCosts: yearlyRes,
                    trackerData: trackerRes,
                    expiry: expiryRes,
                    details: detailsRes,
                    pricing: pricingRes,
                    lastUpdated: now,
                });
            }
        } catch (e) {
            console.error("Failed to load contractors data", e);
            if (silent) return; // keep the cached view on a failed background refresh
            setDataSource('none');
            setError(e instanceof Error ? e.message : "Unable to load contractor data.");
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

    // Cache hit → already rendering last data; refresh silently in background.
    useEffect(() => { loadData(Boolean(cached)); }, [loadData, cached]);

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

    // Window-scroll row virtualization (spacer-row technique) — kicks in past 100 rows
    const contractsVirtual = useVirtualTableRows({
        count: paginatedContracts.length,
        enabled: paginatedContracts.length > 100,
    });

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
                    // Sort by real days-to-expiry; unreadable dates sink to the end.
                    case 'expiry':
                        aV = expiryStatus(a["End Date"]).days ?? Number.MAX_SAFE_INTEGER;
                        bV = expiryStatus(b["End Date"]).days ?? Number.MAX_SAFE_INTEGER;
                        break;
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

    // Same treatment for the tracker table — virtualize past 100 rows
    const trackerVirtual = useVirtualTableRows({
        count: paginatedTracker.length,
        enabled: paginatedTracker.length > 100,
    });

    // ── Yearly matrix ────────────────────────────────────────────────────────
    const matrix = useMemo(() => buildYearlyMatrix(yearlyCosts), [yearlyCosts]);

    // ── Shared handlers ──────────────────────────────────────────────────────
    // Direction is toggled outside the field updater: with reactStrictMode the
    // updater double-invokes in dev, which flipped the direction twice and
    // cancelled the toggle out.
    const handleSort = useCallback((field: string) => {
        if (sortField === field) {
            setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    }, [sortField]);

    const handleTrackerSort = useCallback((field: string) => {
        if (trackerSortField === field) {
            setTrackerSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setTrackerSortField(field);
            setTrackerSortDir('asc');
        }
        setTrackerPage(1);
    }, [trackerSortField]);

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
        return v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

    // ── Stats ────────────────────────────────────────────────────────────────
    // NOTE: no early `if (loading) return …` — replacing the whole page with a
    // skeleton unmounted the tab strip and reset the active tab on every
    // refresh. Sections below render their own in-place skeletons instead.
    const expenseContracts = contracts.filter(c => c.flow === 'Expense');
    const revenueContracts = contracts.filter(c => c.flow === 'Revenue');
    const totalContractValue = expenseContracts.reduce((s, c) => s + (c.total_value_omr ?? 0), 0);
    const currentYearExpense = matrix.rows.length > 0 ? matrix.rows[0].total : 0;

    // Counted from the SAME parsed end dates the Renewals tab renders, so the
    // KPI and the list can never disagree.
    const renewalCounts = (() => {
        const dates = expiry.length > 0
            ? expiry.map(e => e.end_date)
            : trackerData.map(t => t["End Date"]);
        let expired = 0;
        let dueWithin90 = 0;
        for (const raw of dates) {
            const severity = expiryStatus(raw).severity;
            if (severity === 'critical') expired++;
            else if (severity === 'high' || severity === 'watch') dueWithin90++;
        }
        return { expired, dueWithin90 };
    })();

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
            value: totalContractValue.toLocaleString('en-US', { maximumFractionDigits: 1 }),
            unit: "OMR",
            subtitle: `Year 1 expense: ${currentYearExpense.toLocaleString('en-US', { maximumFractionDigits: 1 })} OMR`,
            icon: DollarSign,
            variant: "warning" as const,
        },
        {
            label: "EXPIRED CONTRACTS",
            value: renewalCounts.expired.toString(),
            subtitle: "End date already passed",
            icon: CalendarClock,
            variant: "danger" as const,
        },
        {
            label: "DUE WITHIN 90 DAYS",
            value: renewalCounts.dueWithin90.toString(),
            subtitle: "Renewal decision window",
            icon: RefreshCw,
            variant: "warning" as const,
        },
    ];

    // First load with nothing on screen yet — sections show in-place skeletons.
    const firstLoad = loading && contracts.length === 0 && trackerData.length === 0;

    const hasContractFilters = search || (selectedFlows.length > 0 && selectedFlows.length < uniqueFlows.length);
    const hasTrackerFilters = trackerSearch ||
        (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length) ||
        (selectedTypes.length > 0 && selectedTypes.length < uniqueContractTypes.length);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header + Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* No primary action: the app has no contractor-creation flow, and
                    a button wired to nothing is worse than no button. */}
                <PageHeader
                    title="Contractor Management"
                    description="Contracts, renewals, commercial terms and year-by-year costs"
                />
                {/* There is no demo dataset for contractors — say "no live data"
                    rather than implying a local fallback that does not exist. */}
                <PageStatusBar
                    isConnected={dataSource === 'supabase'}
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    error={error}
                    loading={firstLoad}
                    disconnectedLabel="No Live Data"
                />
            </div>

            {/* A failed load is reported as a failure — never as an empty database. */}
            {error && !firstLoad && (
                <div role="alert" className="flex items-start gap-2 rounded-[10.5px] border border-border bg-mb-danger-light p-4 text-mb-danger-text">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-semibold">Contractor data could not be loaded</p>
                        <p className="mt-0.5 text-xs">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            {firstLoad ? <StatsGridSkeleton count={6} /> : <StatsGrid stats={stats} />}

            {/* Tabs */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { key: 'tracker', label: 'AMC Tracker', icon: List },
                    { key: 'renewals', label: 'Renewals', icon: CalendarClock },
                    { key: 'contracts', label: 'Contracts', icon: FileText },
                    { key: 'terms', label: 'Terms & SLA', icon: ScrollText },
                    { key: 'yearly', label: 'Yearly Costs', icon: BarChart3 },
                ]}
            />

            {/* ═══════════════════ TAB: RENEWALS ═══════════════════ */}
            {activeTab === 'renewals' && (
                <SectionBoundary title="Contract renewals">
                    <RenewalsPanel expiry={expiry} tracker={trackerData} loading={firstLoad} />
                </SectionBoundary>
            )}

            {/* ═══════════════════ TAB: TERMS & SLA ═══════════════════ */}
            {activeTab === 'terms' && (
                <SectionBoundary title="Commercial terms & SLA">
                    <TermsPanel details={details} loading={firstLoad} />
                </SectionBoundary>
            )}

            {/* ═══════════════════ TAB 1: CONTRACTS ═══════════════════ */}
            {activeTab === 'contracts' && firstLoad && (
                <div className="rounded-[10.5px] border border-border bg-card p-4 sm:p-6">
                    <TableSkeleton columns={8} rows={8} />
                </div>
            )}
            {activeTab === 'contracts' && !firstLoad && (
                <SectionBoundary title="Contracts">
                <div className="space-y-4">
                    <TableToolbar>
                        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                aria-label="Search contracts"
                                placeholder="Search contracts..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 dark:border-border/80 bg-white dark:bg-muted text-foreground dark:text-muted-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                            />
                        </div>

                        <MultiSelectDropdown
                            label="Flow"
                            options={uniqueFlows}
                            selected={selectedFlows}
                            onChange={(s) => { setSelectedFlows(s); setCurrentPage(1); }}
                            getOptionColor={getFlowDotColor}
                        />

                        {hasContractFilters && (
                            <button onClick={() => { setSearch(''); setSelectedFlows([...uniqueFlows]); setCurrentPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}

                        <button onClick={handleExportContracts}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto">
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>

                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            <span className="font-semibold text-foreground dark:text-muted-foreground/70">{filteredContracts.length}</span>
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
                            <div key={c.id} className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        {/* Wrap instead of truncate — touch devices have no hover tooltip */}
                                        <p className="font-semibold text-sm text-foreground dark:text-muted-foreground break-words">{c.contractor}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{c.service || '-'}</p>
                                    </div>
                                    <StatusBadge label={c.flow} color={getFlowDotColor(c.flow)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-muted-foreground">Ref:</span> <span className="text-muted-foreground">{c.contract_ref || '-'}</span></div>
                                    <div><span className="text-muted-foreground">Years:</span> <span className="text-muted-foreground">{c.contract_years ?? '-'}</span></div>
                                    <div><span className="text-muted-foreground">Annual:</span> <span className="font-mono text-foreground dark:text-muted-foreground/70">{c.annual_value_omr ? fmtOMR(c.annual_value_omr) : (c.rate_note || 'Variable')}</span></div>
                                    <div><span className="text-muted-foreground">Total:</span> <span className="font-mono font-semibold text-primary">{c.total_value_omr ? fmtOMR(c.total_value_omr) : 'Variable'}</span></div>
                                </div>
                                {c.note && <p className="text-xs text-muted-foreground line-clamp-2">{c.note}</p>}
                                <button
                                    onClick={() => openPdfModal(c.id, c.contractor, c.contract_ref || '', c.contract_pdf_url)}
                                    className={`text-xs flex items-center gap-1 mt-2 ${c.contract_pdf_url ? 'text-secondary' : 'text-muted-foreground'}`}
                                >
                                    {c.contract_pdf_url ? <><FileText className="w-3 h-3" /> View Contract PDF</> : <><Link className="w-3 h-3" /> Add PDF Link</>}
                                </button>
                            </div>
                        ))}
                        {filteredContracts.length === 0 && (
                            <div className="bg-white dark:bg-muted rounded-xl border border-border dark:border-border">
                                <EmptyState variant={hasContractFilters ? "filter-empty" : "no-data"}
                                    title={hasContractFilters ? "No contracts match your filters" : "No contracts yet"}
                                    description={hasContractFilters ? "Try adjusting your search or filters." : "Contracts will appear once added to the system."} />
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead scope="col" className="w-8">#</TableHead>
                                    <SortableTableHead field="contractor" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Contractor</SortableTableHead>
                                    <TableHead scope="col" className="hidden lg:table-cell">Contract Ref</TableHead>
                                    <SortableTableHead field="service" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Service</SortableTableHead>
                                    <SortableTableHead field="flow" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Flow</SortableTableHead>
                                    <SortableTableHead field="years" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="center" className="text-center">Years</SortableTableHead>
                                    <SortableTableHead field="annual" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Annual (OMR)</SortableTableHead>
                                    <SortableTableHead field="total" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Total (OMR)</SortableTableHead>
                                    <TableHead scope="col" className="text-center w-16">Doc</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody ref={contractsVirtual.bodyRef}>
                                {/* Spacer row — keeps virtualized rows at their true scroll offset */}
                                {contractsVirtual.paddingTop > 0 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={9} style={{ height: contractsVirtual.paddingTop, padding: 0, border: 0 }} />
                                    </tr>
                                )}
                                {contractsVirtual.virtualItems.map(vi => {
                                    const c = paginatedContracts[vi.index];
                                    return (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-muted-foreground">{c.id}</TableCell>
                                        <TableCell className="text-foreground dark:text-muted-foreground">
                                            {/* Full name stays accessible: wraps to two lines before
                                                clamping, with the complete name on hover (title). */}
                                            <span className="block max-w-[240px] xl:max-w-[320px] line-clamp-2 break-words" title={c.contractor}>{c.contractor}</span>
                                            {c.note && <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate" title={c.note}>{c.note}</p>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden lg:table-cell meter max-w-[180px] truncate" title={c.contract_ref || ''}>{c.contract_ref || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground dark:text-muted-foreground max-w-[180px] truncate" title={c.service || ''}>{c.service || '-'}</TableCell>
                                        <TableCell>
                                            <StatusBadge label={c.flow} color={getFlowDotColor(c.flow)} />
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">{c.contract_years ?? '-'}</TableCell>
                                        <TableCell className="num">
                                            {c.annual_value_omr ? fmtOMR(c.annual_value_omr) : <span className="text-muted-foreground italic">{c.rate_note || 'Variable'}</span>}
                                        </TableCell>
                                        <TableCell className="num text-primary">
                                            {c.total_value_omr ? fmtOMR(c.total_value_omr) : <span className="text-muted-foreground italic font-normal">Variable</span>}
                                        </TableCell>
                                        <TableCell className="text-center px-3">
                                            <button
                                                onClick={() => openPdfModal(c.id, c.contractor, c.contract_ref || '', c.contract_pdf_url)}
                                                title={c.contract_pdf_url ? "View Contract PDF" : "Add PDF link"}
                                                className={`p-1.5 rounded-md transition-colors ${
                                                    c.contract_pdf_url
                                                        ? 'text-secondary hover:bg-secondary/10'
                                                        : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/60'
                                                }`}
                                            >
                                                {c.contract_pdf_url ? <FileText className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                                {contractsVirtual.paddingBottom > 0 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={9} style={{ height: contractsVirtual.paddingBottom, padding: 0, border: 0 }} />
                                    </tr>
                                )}
                                {filteredContracts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9}>
                                            <EmptyState variant={hasContractFilters ? "filter-empty" : "no-data"}
                                                title={hasContractFilters ? "No contracts match" : "No contracts yet"}
                                                description="Contracts will appear once added." />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredContracts.length > 0 && (
                        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredContracts.length}
                            pageSize={pageSize} startIndex={startIdx} endIndex={Math.min(startIdx + effectivePageSize, filteredContracts.length)}
                            onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
                    )}
                </div>
                </SectionBoundary>
            )}

            {/* ═══════════════════ TAB 2: YEARLY COSTS ═══════════════════ */}
            {activeTab === 'yearly' && firstLoad && (
                <div className="rounded-[10.5px] border border-border bg-card p-4 sm:p-6">
                    <TableSkeleton columns={8} rows={6} />
                </div>
            )}
            {activeTab === 'yearly' && !firstLoad && (
                <SectionBoundary title="Yearly costs">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground dark:text-muted-foreground">Year-by-Year Expense Breakdown</h2>
                            <p className="text-xs text-muted-foreground mt-1">All values in OMR. Blank cells indicate no cost in that year.</p>
                        </div>
                        <button onClick={handleExportYearly}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                    </div>

                    {/* Chart first: the shape of the spend before the detail matrix. */}
                    <YearlyCostChart rows={matrix.rows.map(r => ({ year: r.year, label: r.label, total: r.total }))} />

                    {yearlyCosts.length === 0 ? (
                        <div className="bg-white dark:bg-muted rounded-xl border border-border dark:border-border">
                            <EmptyState variant="no-data" title="No yearly cost data" description="Run the contractor-contracts-data.sql script in Supabase to populate yearly costs." />
                        </div>
                    ) : (
                        <>
                            {/* Mobile: stacked cards per year */}
                            <div className="md:hidden space-y-4">
                                {matrix.rows.map(row => (
                                    <div key={row.year} className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm text-foreground dark:text-muted-foreground">Year {row.year}</p>
                                                <p className="text-xs text-muted-foreground">{row.label}</p>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-primary">{fmtOMR(row.total)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                            {matrix.contractors.map(cn => {
                                                const val = row.costs[cn];
                                                if (val == null) return null;
                                                return (
                                                    <div key={cn} className="flex justify-between">
                                                        <span className="text-muted-foreground truncate mr-2" title={cn}>{shortName(cn)}</span>
                                                        <span className="font-mono text-foreground dark:text-muted-foreground/70">{fmtOMR(val)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: matrix table */}
                            <div className="ops-table-shell hidden md:block">
                                <table className="ops-table whitespace-nowrap">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="text-left py-3 px-4 font-semibold text-xs col-sticky z-10">Year</th>
                                            {matrix.contractors.map(cn => (
                                                <th key={cn} scope="col" className="text-right py-3 px-3 font-semibold text-xs" title={cn}>
                                                    {shortName(cn)}
                                                </th>
                                            ))}
                                            <th scope="col" className="text-right py-3 px-4 font-semibold text-xs">Year Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrix.rows.map(row => (
                                            <tr key={row.year} className="border-b border-border/80 dark:border-border/80 hover:bg-secondary/5 dark:hover:bg-muted/40 transition-colors even:bg-muted/40 dark:even:bg-muted/20">
                                                <td className="py-4 px-4 font-semibold col-sticky z-10">
                                                    <span className="text-xs text-muted-foreground mr-1.5">Y{row.year}</span>
                                                    {row.label}
                                                </td>
                                                {matrix.contractors.map(cn => {
                                                    const val = row.costs[cn];
                                                    return (
                                                        <td key={cn} className="py-4 px-3 num font-semibold text-sm">
                                                            {val != null ? (
                                                                <span className="text-foreground dark:text-muted-foreground/70">{fmtOMR(val)}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-4 px-4 num font-bold text-sm text-primary bg-muted/40 dark:bg-muted/20">
                                                    {fmtOMR(row.total)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals row */}
                                        <tr className="bg-muted/80 dark:bg-muted/50 font-semibold border-t-2 border-border dark:border-border">
                                            <td className="py-4 px-4 col-sticky z-10">Contract Total</td>
                                            {matrix.contractors.map(cn => (
                                                <td key={cn} className="py-4 px-3 num text-sm text-foreground dark:text-muted-foreground/70">
                                                    {fmtOMR(matrix.contractorTotals[cn])}
                                                </td>
                                            ))}
                                            <td className="py-4 px-4 num font-bold text-sm text-primary bg-muted/60 dark:bg-muted/30">
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

                    {/* AMC pricing schedule — amc_contractor_pricing, previously unrendered */}
                    <div className="pt-2">
                        <h2 className="text-base font-semibold text-foreground dark:text-muted-foreground">AMC Pricing Schedule</h2>
                        <p className="mb-3 mt-1 text-xs text-muted-foreground">Per-contract-year rates as recorded for each contractor.</p>
                        <PricingPanel pricing={pricing} loading={false} />
                    </div>
                </div>
                </SectionBoundary>
            )}

            {/* ═══════════════════ TAB 3: AMC TRACKER (legacy) ═══════════════════ */}
            {activeTab === 'tracker' && firstLoad && (
                <div className="rounded-[10.5px] border border-border bg-card p-4 sm:p-6">
                    <TableSkeleton columns={9} rows={8} />
                </div>
            )}
            {activeTab === 'tracker' && !firstLoad && (
                <SectionBoundary title="AMC tracker">
                <div className="space-y-4">
                    <TableToolbar>
                        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" aria-label="Search tracker" placeholder="Search tracker..." value={trackerSearch}
                                onChange={(e) => { setTrackerSearch(e.target.value); setTrackerPage(1); }}
                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 dark:border-border/80 bg-white dark:bg-muted text-foreground dark:text-muted-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow" />
                        </div>
                        <MultiSelectDropdown label="Status" options={uniqueStatuses} selected={selectedStatuses}
                            onChange={(s) => { setSelectedStatuses(s); setTrackerPage(1); }}
                            getOptionColor={getStatusDotColor} />
                        <MultiSelectDropdown label="Type" options={uniqueContractTypes} selected={selectedTypes}
                            onChange={(s) => { setSelectedTypes(s); setTrackerPage(1); }} />
                        {hasTrackerFilters && (
                            <button onClick={() => { setTrackerSearch(''); setSelectedStatuses([...uniqueStatuses]); setSelectedTypes([...uniqueContractTypes]); setTrackerPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                        <ExportButton rows={filteredTracker} filename="contractor-tracker" columns={TRACKER_EXPORT_COLUMNS} className="ml-auto" />
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            <span className="font-semibold text-foreground dark:text-muted-foreground/70">{filteredTracker.length}</span>
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
                                <div key={`m-${rowKey}`} className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            {/* Wrap instead of truncate — touch devices have no hover tooltip */}
                                            <p className="font-semibold text-sm text-foreground dark:text-muted-foreground break-words">{c.Contractor || '-'}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{c["Service Provided"] || '-'}</p>
                                        </div>
                                        <StatusBadge label={c.Status || 'N/A'} color={getStatusDotColor(c.Status)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-muted-foreground">Start:</span> <span className="text-muted-foreground">{c["Start Date"] || '-'}</span></div>
                                        <div><span className="text-muted-foreground">End:</span> <span className="text-muted-foreground">{c["End Date"] || '-'}</span></div>
                                        <div><span className="text-muted-foreground">Monthly:</span> <span className="font-mono text-foreground dark:text-muted-foreground/70">{c["Contract (OMR)/Month"] || '-'}</span></div>
                                        <div><span className="text-muted-foreground">Annual:</span> <span className="font-mono font-semibold text-primary">{c["Annual Value (OMR)"]?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '-'}</span></div>
                                    </div>
                                    <ExpiryBadge raw={c["End Date"]} showDetail />
                                    {c["Renewal Plan"] && (
                                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><RefreshCw className="h-3 w-3" />{c["Renewal Plan"]}</span>
                                    )}
                                    {c.contract_pdf_url && (
                                        <button
                                            onClick={() => openPdfModal(null, c.Contractor || '', c["Service Provided"] || '', c.contract_pdf_url)}
                                            className="text-xs text-secondary flex items-center gap-1 mt-2"
                                        >
                                            <FileText className="w-3 h-3" /> View Contract PDF
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {filteredTracker.length === 0 && (
                            <div className="bg-white dark:bg-muted rounded-xl border border-border dark:border-border">
                                <EmptyState variant={hasTrackerFilters ? "filter-empty" : "no-data"}
                                    title={hasTrackerFilters ? "No entries match" : "No tracker data"}
                                    description="Adjust filters or add data to the Contractor_Tracker table." />
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead field="contractor" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} onSort={handleTrackerSort}>Contractor</SortableTableHead>
                                    <SortableTableHead field="service" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} onSort={handleTrackerSort}>Service</SortableTableHead>
                                    <SortableTableHead field="status" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} onSort={handleTrackerSort}>Status</SortableTableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="hidden lg:table-cell">Start</TableHead>
                                    <TableHead className="hidden lg:table-cell">End</TableHead>
                                    <SortableTableHead field="expiry" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} onSort={handleTrackerSort}>Expiry</SortableTableHead>
                                    <SortableTableHead field="annual" currentSortField={trackerSortField} currentSortDirection={trackerSortDir} onSort={handleTrackerSort} align="right" className="text-right">Annual</SortableTableHead>
                                    <TableHead className="text-center w-16">Doc</TableHead>
                                    <TableHead className="hidden xl:table-cell">Renewal</TableHead>
                                    <TableHead className="hidden xl:table-cell">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody ref={trackerVirtual.bodyRef}>
                                {/* Spacer row — keeps virtualized rows at their true scroll offset */}
                                {trackerVirtual.paddingTop > 0 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={11} style={{ height: trackerVirtual.paddingTop, padding: 0, border: 0 }} />
                                    </tr>
                                )}
                                {trackerVirtual.virtualItems.map(vi => {
                                    const c = paginatedTracker[vi.index];
                                    return (
                                    <TableRow key={`${c.Contractor ?? ''}--${c["Service Provided"] ?? ''}`}>
                                        {/* line-clamp needs an inner block element — -webkit-box display
                                            on the <td> itself would break table layout. */}
                                        <TableCell className="text-foreground dark:text-muted-foreground">
                                            <span className="block max-w-[240px] xl:max-w-[320px] line-clamp-2 break-words" title={c.Contractor || ''}>{c.Contractor || '-'}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground dark:text-muted-foreground max-w-[180px] truncate" title={c["Service Provided"] || ''}>{c["Service Provided"] || '-'}</TableCell>
                                        <TableCell><StatusBadge label={c.Status || 'N/A'} color={getStatusDotColor(c.Status)} /></TableCell>
                                        <TableCell className="text-muted-foreground">{c["Contract Type"] || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground hidden lg:table-cell">
                                            {c["Start Date"] ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c["Start Date"]}</span> : '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden lg:table-cell">
                                            {c["End Date"] ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c["End Date"]}</span> : '-'}
                                        </TableCell>
                                        {/* Parsed end date compared to today — a contract that has run
                                            out now says so instead of printing an inert string. */}
                                        <TableCell className="whitespace-nowrap"><ExpiryBadge raw={c["End Date"]} /></TableCell>
                                        <TableCell className="num text-primary">{c["Annual Value (OMR)"]?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '-'}</TableCell>
                                        <TableCell className="text-center px-3">
                                            <button
                                                onClick={() => openPdfModal(null, c.Contractor || '', c["Service Provided"] || '', c.contract_pdf_url)}
                                                title={c.contract_pdf_url ? "View Contract PDF" : "No PDF uploaded"}
                                                className={`p-1.5 rounded-md transition-colors ${
                                                    c.contract_pdf_url
                                                        ? 'text-secondary hover:bg-secondary/10'
                                                        : 'text-muted-foreground/70 dark:text-muted-foreground cursor-not-allowed'
                                                }`}
                                                disabled={!c.contract_pdf_url}
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground dark:text-muted-foreground hidden xl:table-cell">
                                            {c["Renewal Plan"] ? <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 text-blue-500" />{c["Renewal Plan"]}</span> : '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[200px] truncate hidden xl:table-cell" title={c.Note || ''}>{c.Note || '-'}</TableCell>
                                    </TableRow>
                                    );
                                })}
                                {trackerVirtual.paddingBottom > 0 && (
                                    <tr aria-hidden="true">
                                        <td colSpan={11} style={{ height: trackerVirtual.paddingBottom, padding: 0, border: 0 }} />
                                    </tr>
                                )}
                                {filteredTracker.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={11}>
                                            <EmptyState variant={hasTrackerFilters ? "filter-empty" : "no-data"}
                                                title={hasTrackerFilters ? "No entries match" : "No tracker data"}
                                                description="Adjust filters or add data." />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredTracker.length > 0 && (
                        <TablePagination currentPage={trackerPage} totalPages={trackerTotalPages} totalItems={filteredTracker.length}
                            pageSize={trackerPageSize} startIndex={trackerStartIdx} endIndex={Math.min(trackerStartIdx + trackerEffPageSize, filteredTracker.length)}
                            onPageChange={setTrackerPage} onPageSizeChange={(s) => { setTrackerPageSize(s); setTrackerPage(1); }} />
                    )}
                </div>
                </SectionBoundary>
            )}

            {/* ═══════════════════ CONTRACT PDF MODAL ═══════════════════ */}
            <Dialog open={pdfModal.isOpen} onOpenChange={(open) => { if (!open) closePdfModal(); }}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-base text-foreground dark:text-muted-foreground">
                            {pdfModal.contractorName}
                        </DialogTitle>
                        <DialogDescription>
                            {pdfModal.contractRef && (
                                <span className="font-mono text-xs">{pdfModal.contractRef}</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* PDF link editor */}
                    {pdfLinkEditing && pdfModal.contractId && (
                        <div className="flex flex-col gap-3 p-4 bg-muted dark:bg-muted/50 rounded-xl">
                            <label className="text-sm font-medium text-foreground dark:text-muted-foreground/70 flex items-center gap-2">
                                <Link className="w-4 h-4" />
                                {pdfModal.pdfUrl ? 'Edit PDF Link' : 'Paste Google Drive PDF Link'}
                            </label>
                            <input
                                type="url"
                                aria-label="PDF link URL"
                                value={pdfLinkInput}
                                onChange={(e) => setPdfLinkInput(e.target.value)}
                                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
                            />
                            <p className="text-xs text-muted-foreground">Right-click PDF in Drive &rarr; Share &rarr; Copy link (set to &quot;Anyone with the link&quot;)</p>
                            {pdfLinkError && (
                                <p role="alert" className="flex items-start gap-2 rounded-[7px] bg-mb-danger-light p-2.5 text-xs text-mb-danger-text">
                                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span><span className="font-semibold">Not saved.</span> {pdfLinkError}</span>
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={savePdfLink}
                                    disabled={pdfLinkSaving || !pdfLinkInput.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-secondary text-primary-foreground hover:bg-secondary/90 transition-colors disabled:opacity-50"
                                >
                                    {pdfLinkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {pdfLinkSaving ? 'Saving...' : 'Save Link'}
                                </button>
                                {pdfModal.pdfUrl && (
                                    <button
                                        onClick={() => setPdfLinkEditing(false)}
                                        className="px-4 py-2 text-sm rounded-lg border border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PDF viewer */}
                    {pdfModal.pdfUrl && !pdfLinkEditing ? (() => {
                        const previewUrl = pdfModal.pdfUrl.includes('drive.google.com')
                            ? pdfModal.pdfUrl.replace(/\/view(\?.*)?$/, '/preview')
                            : pdfModal.pdfUrl;
                        return (
                        <div className="flex flex-col gap-3">
                            <iframe
                                src={previewUrl}
                                className="w-full h-[65vh] rounded-lg border border-border dark:border-border"
                                title="Contract PDF"
                                allow="autoplay"
                            />
                        </div>
                        );
                    })() : !pdfLinkEditing && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/70">
                            <FileWarning className="w-12 h-12 mb-3" />
                            <p className="text-sm font-medium">No contract document linked yet</p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {pdfModal.pdfUrl && !pdfLinkEditing && pdfModal.contractId && (
                            <button
                                onClick={() => setPdfLinkEditing(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted/60 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Link
                            </button>
                        )}
                        {pdfModal.pdfUrl && !pdfLinkEditing && (
                            <a
                                href={pdfModal.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-secondary text-primary-foreground hover:bg-secondary/90 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in Drive
                            </a>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
