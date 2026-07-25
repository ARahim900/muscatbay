"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFireSafetyDataAction } from "@/actions/fire-safety";
import type {
    FireSafetyEquipment, FireIssue, FirePpmContact, FirePpmActivity,
} from "@/entities/fire-safety";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
    MultiSelectDropdown, SortableTableHead, TablePagination, TableToolbar, ExportButton,
    type PageSizeOption, type ExportColumn,
} from "@/components/shared/data-table";
import { PageSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { CHART_PALETTE } from "@/lib/tokens";
import {
    ShieldCheck, AlertTriangle, CheckCircle, Clock,
    Calendar, FileText, Info, Building2, LayoutGrid, Layers, Users,
    Phone, Mail, ClipboardList, Flame, Truck, History, Search, X,
} from "lucide-react";

// Programme + contract data live outside the component so they can be updated
// without touching page logic. See the module headers for provenance.
import {
    CYCLES, CYCLE_BY_KEY, PPM_ACTIVITIES, SYSTEM_LEGEND, ZONES, ZONE_BY_KEY,
    PPM_PROGRAMME_AS_OF, PPM_PROGRAMME_SOURCE,
    type PpmActivity, type PpmStatus,
} from "./ppm-programme";
import {
    AMC_CONTRACT_SUMMARY, AMC_SCOPE_COUNTS, INSURANCE_COVERAGE, REFERENCE_AS_OF,
    REFERENCE_NOTE, SLA_TIERS, TANKER_AGREEMENTS, TANKER_DISCHARGE_RATE,
} from "./contract-reference";
import {
    CARD_TITLE, CHART_TOOLTIP_STYLE, CycleBadge, EQUIP_STATUS_CHART_COLORS,
    PpmStatusBadge, ReferenceChip, SectionHeading, STATUS_CFG, SystemTag, ZoneBadge,
    equipZoneKey,
} from "./ui";
import { EquipmentRegister } from "./equipment-register";
import { IssuesRegister } from "./issues-register";

// Maintenance tracker filter option lists (dropdowns operate on display labels).
const CYCLE_OPTIONS = CYCLES.map((c) => c.label);
const ZONE_OPTIONS = ZONES.map((z) => z.label);
const PPM_STATUS_OPTIONS = (Object.keys(STATUS_CFG) as PpmStatus[]).map((s) => STATUS_CFG[s].label);

const PPM_EXPORT_COLUMNS: ExportColumn<PpmActivity>[] = [
    { key: "cycle", header: "Cycle", format: (a) => CYCLE_BY_KEY[a.cycle].label },
    { key: "zone", header: "Zone", format: (a) => ZONE_BY_KEY[a.zone].label },
    { key: "area", header: "Area / Asset" },
    { key: "systems", header: "Systems" },
    { key: "date", header: "Scheduled" },
    { key: "status", header: "Status", format: (a) => STATUS_CFG[a.status].label },
    { key: "notes", header: "Notes" },
];

// Tables the page subscribes to so the connection chip means something.
const FIRE_REALTIME_TABLES = [
    "fire_safety_equipment",
    "fire_issues_register",
    "fire_ppm_contacts",
    "fire_ppm_activities",
];

type TabKey = "overview" | "ppm" | "contract";

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit)
const FIREFIGHTING_CACHE_KEY = "firefighting:page";
interface FirefightingPageCache {
    equipment: FireSafetyEquipment[];
    issues: FireIssue[];
    contacts: FirePpmContact[];
    activityLog: FirePpmActivity[];
    lastUpdated: Date;
}

export default function FirefightingPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    // Seed from the session cache so revisits render instantly (silent refresh below)
    const [cached] = useState(() => getPageCache<FirefightingPageCache>(FIREFIGHTING_CACHE_KEY));
    const [loading, setLoading] = useState(!cached);
    const [connected, setConnected] = useState(Boolean(cached));
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
    const [error, setError] = useState<string | null>(null);

    const [equipment, setEquipment] = useState<FireSafetyEquipment[]>(cached?.equipment ?? []);
    const [issues, setIssues] = useState<FireIssue[]>(cached?.issues ?? []);
    const [contacts, setContacts] = useState<FirePpmContact[]>(cached?.contacts ?? []);
    const [activityLog, setActivityLog] = useState<FirePpmActivity[]>(cached?.activityLog ?? []);

    // Maintenance tracker — search, multi-select filters, sort & pagination
    const [search, setSearch] = useState("");
    const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    const loadData = useCallback(async (silent = false) => {
        const res = await fetchFireSafetyDataAction();
        if (res.error && (silent || cached)) {
            // A failed background refresh keeps the data already on screen
            // instead of wiping it with the empty error payload.
            console.warn("Fire-safety refresh failed; keeping existing data:", res.error);
            if (!silent) setLoading(false);
            return;
        }
        setEquipment(res.equipment);
        setIssues(res.issues);
        setContacts(res.contacts);
        setActivityLog(res.activities);
        if (res.error) {
            setError("Live data unavailable — showing the BEC PPM programme only.");
            setConnected(false);
        } else {
            setError(null);
            setConnected(true);
            const now = new Date();
            setLastUpdated(now);
            setPageCache<FirefightingPageCache>(FIREFIGHTING_CACHE_KEY, {
                equipment: res.equipment,
                issues: res.issues,
                contacts: res.contacts,
                activityLog: res.activities,
                lastUpdated: now,
            });
        }
        setLoading(false);
    }, [cached]);

    useEffect(() => {
        let active = true;
        (async () => {
            await loadData(false);
            if (!active) return;
        })();
        return () => { active = false; };
    }, [loadData]);

    // Realtime — the "Connected" chip now reflects a live subscription rather
    // than a value that was true once at mount and never re-checked.
    const { isLive } = useSupabaseRealtime({
        table: FIRE_REALTIME_TABLES,
        channelName: "fire-safety-rt",
        onChanged: () => loadData(true),
        enabled: connected,
    });

    // ── Derived ──
    const openIssues = useMemo(
        () => issues.filter((i) => !i.status.toLowerCase().includes("resolved")),
        [issues],
    );
    const completedCycles = useMemo(
        () => CYCLES.filter((c) => PPM_ACTIVITIES.filter((a) => a.cycle === c.key)
            .every((a) => a.status !== "upcoming" && a.status !== "scheduled")).length,
        [],
    );
    const openFaults = useMemo(
        () => PPM_ACTIVITIES.filter((a) => a.status === "fault" || a.status === "no_access"),
        [],
    );

    const equipmentByZone = useMemo(() => {
        const counts: Record<string, number> = { zone1: 0, zone3: 0, zone5: 0, vs: 0 };
        equipment.forEach((e) => {
            const k = equipZoneKey(e.zone);
            if (k) counts[k] += 1;
        });
        return counts;
    }, [equipment]);

    // Overview charts — equipment per zone (bar) + equipment per status (donut).
    const equipByZoneChart = useMemo(
        () => ZONES.map((z) => ({ zone: z.short, count: equipmentByZone[z.key] })),
        [equipmentByZone],
    );
    const equipByStatusChart = useMemo(() => {
        const counts: Record<string, number> = {};
        equipment.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }, [equipment]);

    const stats = useMemo(() => [
        { label: "DESIGNATED ZONES", value: String(ZONES.length), subtitle: "Z1 · Z3 · Z5 · Village Sq", icon: Layers, variant: "water" as const },
        { label: "PPM CYCLES / YEAR", value: String(CYCLES.length), subtitle: "BEC AMC · every ~4 months", icon: Calendar, variant: "primary" as const },
        { label: "CYCLES COMPLETE", value: `${completedCycles} / ${CYCLES.length}`, subtitle: "Year 1 · Dec & Apr done", icon: CheckCircle, variant: "success" as const },
        { label: "OPEN ISSUES", value: openIssues.length.toString(), subtitle: "Defects & access items", icon: AlertTriangle, variant: openIssues.length > 0 ? "danger" as const : "success" as const },
    ], [completedCycles, openIssues.length]);

    // ── Maintenance tracker filtering, sorting & pagination ──
    const sortValue = useCallback((a: PpmActivity, field: string): string => {
        switch (field) {
            case "cycle": return String(a.cycle);
            case "zone": return ZONE_BY_KEY[a.zone].label;
            case "area": return a.area;
            case "systems": return a.systems.join(", ");
            case "date": return a.date;
            case "status": return STATUS_CFG[a.status].label;
            case "notes": return a.notes || "";
            default: return "";
        }
    }, []);

    const filteredActivities = useMemo(() => {
        let result = [...PPM_ACTIVITIES];

        if (search) {
            const term = search.toLowerCase();
            result = result.filter((a) =>
                a.area.toLowerCase().includes(term) ||
                ZONE_BY_KEY[a.zone].label.toLowerCase().includes(term) ||
                a.systems.some((s) => s.toLowerCase().includes(term)) ||
                (a.notes?.toLowerCase().includes(term) ?? false)
            );
        }
        if (selectedCycles.length > 0 && selectedCycles.length < CYCLE_OPTIONS.length) {
            result = result.filter((a) => selectedCycles.includes(CYCLE_BY_KEY[a.cycle].label));
        }
        if (selectedZones.length > 0 && selectedZones.length < ZONE_OPTIONS.length) {
            result = result.filter((a) => selectedZones.includes(ZONE_BY_KEY[a.zone].label));
        }
        if (selectedStatuses.length > 0 && selectedStatuses.length < PPM_STATUS_OPTIONS.length) {
            result = result.filter((a) => selectedStatuses.includes(STATUS_CFG[a.status].label));
        }

        if (sortField) {
            result.sort((a, b) => {
                const cmp = sortValue(a, sortField).localeCompare(sortValue(b, sortField), undefined, { numeric: true });
                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [search, selectedCycles, selectedZones, selectedStatuses, sortField, sortDirection, sortValue]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        else { setSortField(field); setSortDirection("asc"); }
        setCurrentPage(1);
    };

    const effectivePageSize = pageSize === "All" ? filteredActivities.length : pageSize;
    const totalPages = Math.ceil(filteredActivities.length / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + effectivePageSize);

    const filtersActive = Boolean(search) ||
        (selectedCycles.length > 0 && selectedCycles.length < CYCLE_OPTIONS.length) ||
        (selectedZones.length > 0 && selectedZones.length < ZONE_OPTIONS.length) ||
        (selectedStatuses.length > 0 && selectedStatuses.length < PPM_STATUS_OPTIONS.length);
    const clearFilters = () => {
        setSearch(""); setSelectedCycles([]); setSelectedZones([]); setSelectedStatuses([]);
        setCurrentPage(1);
    };

    // ───────────────────────────────────────────────────────────────────────

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <PageHeader
                    title="Fire Safety Management"
                    description="BEC Annual Maintenance Contract (MIS-SBJ-25-077) · PPM 3× per year across 4 zones · Nov 2025 – Oct 2027"
                />
                <PageStatusBar isConnected={connected} isLive={isLive} lastUpdated={lastUpdated} error={error} />
            </div>

            {/* Tabs — mirrors the HVAC System module's 3-subsection structure */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={(k) => setActiveTab(k as TabKey)}
                tabs={[
                    { key: "overview", label: "Overview", icon: LayoutGrid },
                    { key: "ppm", label: "Maintenance", icon: ClipboardList },
                    { key: "contract", label: "Contract & Team", icon: FileText },
                ]}
            />

            {/* ══════════ OVERVIEW ══════════ */}
            {activeTab === "overview" && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    <StatsGrid stats={stats} />

                    {/* Charts — equipment by zone + by status (live register) */}
                    {equipment.length > 0 && (
                        <SectionBoundary title="Equipment Charts">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={CARD_TITLE}><Building2 className="h-4 w-4 text-primary" aria-hidden="true" /> Equipment by Zone</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[260px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={equipByZoneChart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                                    <XAxis dataKey="zone" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                                    <YAxis tick={{ fontSize: 11, fill: "var(--chart-axis)" }} allowDecimals={false} />
                                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                    <Bar dataKey="count" fill="var(--chart-inlet)" radius={[4, 4, 0, 0]} name="Equipment" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={CARD_TITLE}><ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" /> Equipment by Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[260px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={equipByStatusChart}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={55}
                                                        outerRadius={90}
                                                        paddingAngle={2}
                                                        dataKey="count"
                                                        nameKey="status"
                                                        label={(props) => `${props.name}: ${props.value}`}
                                                        labelLine={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                                                    >
                                                        {equipByStatusChart.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={EQUIP_STATUS_CHART_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                    <Legend verticalAlign="bottom" height={36} iconSize={10} formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </SectionBoundary>
                    )}

                    {/* How the programme works */}
                    <SectionBoundary title="Programme Summary">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><Flame className="w-4 h-4 text-secondary" aria-hidden="true" /> How the BEC PPM Programme Works</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Bahwan Engineering (BEC) services every fire-alarm and fire-fighting asset in Muscat Bay under a non-comprehensive AMC.
                                    Maintenance runs as <span className="font-semibold text-foreground">three planned cycles each year</span> (roughly every four months), and
                                    each cycle sweeps all <span className="font-semibold text-foreground">four designated zones</span> and their assets.
                                    Use the <span className="font-semibold text-foreground">Maintenance</span> tab to see exactly which cycle, zone and asset each visit covers.
                                </p>
                                {/* Cycle progress */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                    {CYCLES.map((c) => {
                                        const done = c.status === "completed";
                                        return (
                                            <div key={c.key} className={cn("rounded-lg border p-3", done ? "border-secondary/30 bg-secondary/5 dark:bg-secondary/10" : "border-border bg-muted/50")}>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                        <span aria-hidden="true" className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground", done ? "bg-secondary" : "bg-muted-foreground/60")}>{c.key}</span>
                                                        {c.label}
                                                    </span>
                                                    {done
                                                        ? <span className="flex items-center gap-1 text-[11px] font-semibold text-secondary"><CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Completed</span>
                                                        : <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> Upcoming</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 ps-8">{c.window}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* The four zones */}
                    <SectionBoundary title="Designated Zones">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-3">The Four Designated Zones</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {ZONES.map((z) => {
                                    const zoneIssues = issues.filter((i) => {
                                        const k = equipZoneKey(i.location);
                                        return k === z.key && !i.status.toLowerCase().includes("resolved");
                                    }).length;
                                    return (
                                        <Card key={z.key}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <ZoneBadge zone={z.key} withScope />
                                                    <Building2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 leading-snug min-h-[2.5rem]">{z.scope}</p>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 text-xs">
                                                    <span className="text-muted-foreground">Equipment</span>
                                                    <span className="font-semibold text-foreground tabular-nums">{equipmentByZone[z.key]}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 text-xs">
                                                    <span className="text-muted-foreground">Open issues</span>
                                                    <span className={cn("font-semibold tabular-nums", zoneIssues > 0 ? "text-destructive" : "text-secondary")}>{zoneIssues}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </SectionBoundary>

                    {/* Equipment Register */}
                    <SectionBoundary title="Equipment Register">
                        <div>
                            <SectionHeading
                                icon={ShieldCheck}
                                title="Equipment Register"
                                count={equipment.length}
                                description="Live from the fire-safety equipment register — searchable, filterable and paginated."
                            />
                            <EquipmentRegister equipment={equipment} />
                        </div>
                    </SectionBoundary>

                    {/* Issues & Defects Register */}
                    <SectionBoundary title="Issues & Defects Register">
                        <div>
                            <SectionHeading
                                icon={AlertTriangle}
                                title="Issues & Defects Register"
                                count={issues.length}
                                description="Live defect log from the BEC engagement — display and identification only."
                            />
                            <IssuesRegister issues={issues} />
                        </div>
                    </SectionBoundary>

                    {/* Attention strip */}
                    {(openFaults.length > 0 || openIssues.length > 0) && (
                        <Card className="border-mb-warning/30">
                            <CardContent className="p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-mb-warning-text flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div className="text-sm">
                                    <p className="font-semibold text-foreground">{openFaults.length} open PPM fault{openFaults.length === 1 ? "" : "s"} · {openIssues.length} open issue{openIssues.length === 1 ? "" : "s"}</p>
                                    <p className="text-muted-foreground mt-0.5">Review the Maintenance tab (Faults filter) and the Issues &amp; Defects register above for details and follow-up quotes.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ══════════ MAINTENANCE ══════════ */}
            {activeTab === "ppm" && (
                <SectionBoundary title="PPM Maintenance Tracker">
                    <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in duration-200">
                        {/* Provenance — this tab renders a transcribed BEC plan, not live data. */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <ReferenceChip asOf={PPM_PROGRAMME_AS_OF} />
                            <span>{PPM_PROGRAMME_SOURCE}</span>
                        </div>

                        {/* Toolbar — search + multi-select filters */}
                        <TableToolbar>
                            <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    aria-label="Search maintenance activities"
                                    placeholder="Search area, zone, system, notes…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 dark:border-border/80 bg-card text-foreground dark:text-muted-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
                                />
                            </div>
                            <MultiSelectDropdown label="Cycle" options={CYCLE_OPTIONS} selected={selectedCycles} onChange={(s) => { setSelectedCycles(s); setCurrentPage(1); }} />
                            <MultiSelectDropdown label="Zone" options={ZONE_OPTIONS} selected={selectedZones} onChange={(s) => { setSelectedZones(s); setCurrentPage(1); }} />
                            <MultiSelectDropdown label="Status" options={PPM_STATUS_OPTIONS} selected={selectedStatuses} onChange={(s) => { setSelectedStatuses(s); setCurrentPage(1); }} />
                            {filtersActive && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear
                                </button>
                            )}
                            <ExportButton rows={filteredActivities} filename="fire-ppm-activities" columns={PPM_EXPORT_COLUMNS} className="ml-auto" />
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground whitespace-nowrap">
                                <span className="font-semibold text-foreground dark:text-muted-foreground/70">{filteredActivities.length}</span>
                                {filteredActivities.length !== PPM_ACTIVITIES.length && <span> of {PPM_ACTIVITIES.length}</span>} activities
                            </div>
                        </TableToolbar>

                        {/* Systems legend */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Systems:</span>
                            {SYSTEM_LEGEND.map(([k, v]) => (
                                <span key={k} className="flex items-center gap-1 text-[11px] text-muted-foreground"><SystemTag label={k} />{v}</span>
                            ))}
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {paginatedActivities.map((a) => (
                                <div key={a.id} className="rounded-xl border border-border dark:border-border bg-card p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap"><CycleBadge cycle={a.cycle} /><ZoneBadge zone={a.zone} /></div>
                                        <PpmStatusBadge status={a.status} />
                                    </div>
                                    <p className="text-sm font-medium text-foreground dark:text-muted-foreground">{a.area}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex gap-1 flex-wrap">{a.systems.map((s) => <SystemTag key={s} label={s} />)}</div>
                                        <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">{a.date}</span>
                                    </div>
                                    {a.notes && <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">{a.notes}</p>}
                                </div>
                            ))}
                            {filteredActivities.length === 0 && (
                                <EmptyState variant="filter-empty" title="No activities match" description="Try adjusting the search or filters." action={{ label: "Clear filters", onClick: clearFilters }} />
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead field="cycle" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Cycle</SortableTableHead>
                                        <SortableTableHead field="zone" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Zone</SortableTableHead>
                                        <SortableTableHead field="area" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Area / Asset</SortableTableHead>
                                        <SortableTableHead field="systems" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Systems</SortableTableHead>
                                        <SortableTableHead field="date" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Scheduled</SortableTableHead>
                                        <SortableTableHead field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                                        <SortableTableHead field="notes" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Notes</SortableTableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedActivities.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell><CycleBadge cycle={a.cycle} /></TableCell>
                                            <TableCell><ZoneBadge zone={a.zone} /></TableCell>
                                            <TableCell className="text-foreground dark:text-muted-foreground">{a.area}</TableCell>
                                            <TableCell><div className="flex gap-1 flex-wrap">{a.systems.map((s) => <SystemTag key={s} label={s} />)}</div></TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{a.date}</TableCell>
                                            <TableCell><PpmStatusBadge status={a.status} /></TableCell>
                                            {/* Notes wrap instead of truncating: a `title` tooltip cannot be
                                                reached on a touch device, so the text would be lost. */}
                                            <TableCell className="text-[11px] text-muted-foreground max-w-[280px] whitespace-normal break-words">{a.notes || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredActivities.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <EmptyState variant="filter-empty" title="No activities match" description="Try adjusting the search or filters." action={{ label: "Clear filters", onClick: clearFilters }} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredActivities.length > 0 && (
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredActivities.length}
                                pageSize={pageSize}
                                startIndex={startIndex}
                                endIndex={Math.min(startIndex + effectivePageSize, filteredActivities.length)}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            />
                        )}

                        {/* Year-2 note */}
                        <Card>
                            <CardContent className="p-4 flex items-start gap-3">
                                <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div className="text-sm">
                                    <p className="font-semibold text-foreground">Cycle 3 (~Aug 2026) is the final Year-1 cycle.</p>
                                    <p className="mt-1 text-muted-foreground">Year-2 cycles (Dec 2026, Apr 2027, Aug 2027) will be added once BEC issues each PPM plan. Dates are confirmed per cycle via the BEC work-permission request.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </SectionBoundary>
            )}

            {/* ══════════ CONTRACT & TEAM ══════════ */}
            {activeTab === "contract" && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Contract summary — from contract-reference.ts */}
                    <SectionBoundary title="AMC Contract Summary">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><FileText className="w-4 h-4 text-secondary" aria-hidden="true" /> AMC Contract Summary</CardTitle>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <ReferenceChip asOf={REFERENCE_AS_OF} />
                                    <span className="text-xs text-muted-foreground">{REFERENCE_NOTE}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                    {AMC_CONTRACT_SUMMARY.map(([label, value]) => (
                                        <div key={label} className="py-2 border-b border-border/60 dark:border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
                                            <p className="text-sm text-foreground font-medium">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* BEC team contacts (live) */}
                    <SectionBoundary title="BEC Team Contacts">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><Users className="w-4 h-4 text-secondary" aria-hidden="true" /> BEC Team Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {contacts.length === 0 ? (
                                    <EmptyState variant="no-data" title="No contacts" description="The BEC contact list is unavailable right now." />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {contacts.map((c) => (
                                            <div key={c.id} className="rounded-lg border border-border dark:border-border/50 bg-muted/40 dark:bg-muted/20 p-3">
                                                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{c.role}</p>
                                                <div className="mt-2 space-y-1">
                                                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] text-secondary hover:underline break-all"><Mail className="w-3 h-3 flex-shrink-0" aria-hidden="true" />{c.email}</a>}
                                                    {c.phone && <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Phone className="w-3 h-3 flex-shrink-0" aria-hidden="true" />{c.phone}</p>}
                                                    {c.active_period && <p className="text-[10px] text-muted-foreground/70">{c.active_period}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* BEC engagement timeline (live activity log) */}
                    {activityLog.length > 0 && (
                        <SectionBoundary title="BEC Engagement Timeline">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className={CARD_TITLE}><History className="w-4 h-4 text-secondary" aria-hidden="true" /> BEC Engagement Timeline</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">Live log of PPM cycles, inspections, quotes and contract milestones.</p>
                                </CardHeader>
                                <CardContent>
                                    <ol className="relative border-s border-border dark:border-border/60 ms-2 space-y-4">
                                        {activityLog.map((a) => (
                                            <li key={a.id} className="ms-4">
                                                <span aria-hidden="true" className="absolute -start-1.5 mt-1 h-3 w-3 rounded-full bg-secondary" />
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold text-foreground">{a.activity_type}</span>
                                                    <span className="text-[10px] text-muted-foreground tabular-nums">{a.ppm_period}</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{a.status}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{a.scope}</p>
                                                {a.notes && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{a.notes}</p>}
                                            </li>
                                        ))}
                                    </ol>
                                </CardContent>
                            </Card>
                        </SectionBoundary>
                    )}

                    {/* SLA — from contract-reference.ts */}
                    <SectionBoundary title="Response-Time SLA">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><Clock className="w-4 h-4 text-secondary" aria-hidden="true" /> Response-Time SLA</CardTitle>
                                <div className="mt-1"><ReferenceChip asOf={REFERENCE_AS_OF} /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {SLA_TIERS.map((s) => (
                                        <div key={s.priority} className={cn("rounded-lg px-4 py-3", s.bgClass)}>
                                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><span aria-hidden="true" className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dotClass)} />{s.priority}</p>
                                            <p className="text-xl font-bold text-foreground mt-1">{s.responseTime}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* Equipment under AMC — contract scope counts, NOT a live count */}
                    <SectionBoundary title="Equipment Under AMC">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><Building2 className="w-4 h-4 text-secondary" aria-hidden="true" /> Equipment Under AMC</CardTitle>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <ReferenceChip asOf={REFERENCE_AS_OF} />
                                    <span className="text-xs text-muted-foreground">
                                        Counts named in the AMC scope. The live count is the Equipment Register on the Overview tab.
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    {AMC_SCOPE_COUNTS.map((eq) => (
                                        <div key={eq.label} className="p-3 bg-muted dark:bg-muted/50 rounded-lg text-center">
                                            <p className="text-xl font-bold text-foreground">{eq.value}</p>
                                            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.06em]">{eq.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{eq.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* Insurance — from contract-reference.ts */}
                    <SectionBoundary title="Insurance Coverage">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><ShieldCheck className="w-4 h-4 text-secondary" aria-hidden="true" /> Insurance Coverage (Contractual)</CardTitle>
                                <div className="mt-1"><ReferenceChip asOf={REFERENCE_AS_OF} /></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {INSURANCE_COVERAGE.map(([coverage, limit]) => (
                                    <div key={coverage} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/60 dark:border-border/50 last:border-0">
                                        <span className="text-sm text-muted-foreground">{coverage}</span>
                                        <span className="text-sm font-bold text-foreground flex-shrink-0">{limit}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </SectionBoundary>

                    {/* Sewage tanker agreements (STP-related, kept here for reference) */}
                    <SectionBoundary title="Sewage Tanker Agreements">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><Truck className="w-4 h-4 text-secondary" aria-hidden="true" /> Sewage Tanker Discharge Agreements</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">External sewage tankers discharging into Muscat Bay STP Plant (STP-related — listed here for reference).</p>
                                <div className="mt-1"><ReferenceChip asOf={REFERENCE_AS_OF} /></div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="p-3 bg-mb-success-light rounded-lg">
                                    <p className="text-xs font-bold text-mb-success-text uppercase">Discharge Rate</p>
                                    <p className="text-lg font-bold text-foreground mt-1">
                                        {TANKER_DISCHARGE_RATE.headline}{" "}
                                        <span className="text-sm font-normal text-muted-foreground">{TANKER_DISCHARGE_RATE.detail}</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{TANKER_DISCHARGE_RATE.basis}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {TANKER_AGREEMENTS.map((co) => (
                                        <div key={co.company} className="p-4 bg-muted dark:bg-muted/50 rounded-lg border border-border dark:border-border/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-foreground">{co.company}</h4>
                                                <Badge className="bg-mb-success-light text-mb-success-text text-[10px]">{co.status}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {([["Contact", co.contactRole], ["Contract", co.contract], ["Signed/Renewed", co.signed]] as const).map(([label, value]) => (
                                                    <div key={label}>
                                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
                                                        <p className="text-xs text-foreground">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionBoundary>
                </div>
            )}
        </div>
    );
}
