"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchFireSafetyDataAction } from "@/actions/fire-safety";
import type {
    FireSafetyEquipment, FireIssue, FirePpmContact, FirePpmActivity,
} from "@/entities/fire-safety";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    MultiSelectDropdown, SortableTableHead, TablePagination, TableToolbar,
    type PageSizeOption,
} from "@/components/shared/data-table";
import { Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { CHART_PALETTE } from "@/lib/tokens";
import {
    ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock,
    Calendar, FileText, Info, Building2, LayoutGrid, MapPin, Layers, Users,
    Phone, Mail, ClipboardList, Flame, Truck, History, Search, X,
    type LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
//  BEC FIRE-SAFETY AMC — PPM PROGRAMME MODEL
//  Structure: 3 PPM cycles / year × 4 designated zones × their assets.
//  Sources: BEC PPM plan emails (Dec-2025 completion + 20–30 Apr-2026 plan,
//  ref MIS-SBJ-25-077) and the live fire_safety_equipment register.
// ═══════════════════════════════════════════════════════════════════════════

type Cycle = 1 | 2 | 3;
type ZoneKey = "zone1" | "zone3" | "zone5" | "vs";
type PpmStatus = "done" | "scheduled" | "upcoming" | "fault" | "no_access";

interface PpmActivity {
    id: string;
    cycle: Cycle;
    zone: ZoneKey;
    area: string;
    systems: string[];
    date: string;
    status: PpmStatus;
    notes?: string;
}

const ZONES: { key: ZoneKey; label: string; short: string; scope: string }[] = [
    { key: "zone1", label: "Zone 1", short: "Z1", scope: "Staff Accommodation (Bldgs 1–8) + external hydrants" },
    { key: "zone3", label: "Zone 3", short: "Z3", scope: "Residential Apartments 44–62, 74 & 75" },
    { key: "zone5", label: "Zone 5", short: "Z5", scope: "Security, Nursery, Control Room, Taxi & ROP" },
    { key: "vs", label: "Village Square", short: "VS", scope: "Central fire plant, pumps, FM & Experience Centre" },
];
const ZONE_BY_KEY: Record<ZoneKey, (typeof ZONES)[number]> = ZONES.reduce(
    (acc, z) => { acc[z.key] = z; return acc; },
    {} as Record<ZoneKey, (typeof ZONES)[number]>,
);

const CYCLES: { key: Cycle; label: string; window: string; status: "completed" | "upcoming" }[] = [
    { key: 1, label: "Cycle 1", window: "07–25 Dec 2025", status: "completed" },
    { key: 2, label: "Cycle 2", window: "20–30 Apr 2026", status: "completed" },
    { key: 3, label: "Cycle 3", window: "~Aug 2026", status: "upcoming" },
];
const CYCLE_BY_KEY: Record<Cycle, (typeof CYCLES)[number]> = CYCLES.reduce(
    (acc, c) => { acc[c.key] = c; return acc; },
    {} as Record<Cycle, (typeof CYCLES)[number]>,
);

// The 10 BEC visit groups, mapped to the 4 designated zones.
const AREA_GROUPS: { key: string; zone: ZoneKey; area: string; systems: string[] }[] = [
    { key: "sa14", zone: "zone1", area: "Staff Accommodation Bldgs 1–4", systems: ["FA", "Hose Reel", "FE"] },
    { key: "sa58", zone: "zone1", area: "Staff Accommodation Bldgs 5–8", systems: ["FA", "Hose Reel", "FE"] },
    { key: "ext", zone: "zone1", area: "External Hydrants + Staff Accom.", systems: ["Hydrants"] },
    { key: "ap1", zone: "zone3", area: "Apartments 44, 45, 46, 74, 75", systems: ["FA", "FE"] },
    { key: "ap2", zone: "zone3", area: "Apartments 47, 48, 49, 50, 51", systems: ["FA", "FE"] },
    { key: "ap3", zone: "zone3", area: "Apartments 52, 53, 54, 55, 56", systems: ["FA", "FE"] },
    { key: "ap4", zone: "zone3", area: "Apartments 57, 58, 59, 60, 61, 62", systems: ["FA", "FE"] },
    { key: "sec", zone: "zone5", area: "Security, Nursery, Control Room, Taxi, ROP", systems: ["FA", "FE"] },
    { key: "tech", zone: "vs", area: "Technical Bldg, STP, Village Square", systems: ["FA", "FE"] },
    { key: "fm", zone: "vs", area: "FM Office, Experience Centre, Pump Testing", systems: ["FA", "FF"] },
];

// Per-cycle date + status + notes, keyed by area-group.
const CYCLE_DETAIL: Record<Cycle, Record<string, { date: string; status: PpmStatus; notes?: string }>> = {
    1: {
        fm: { date: "07 Dec 2025", status: "done", notes: "Incl. electric, diesel & jockey fire-pump testing" },
        sa14: { date: "08 Dec 2025", status: "fault", notes: "Bldg-1 Rm-4 no access for extinguisher service; Bldg-1 Rm-7 DCP 4.5 kg extinguisher missing; Bldg-2 GF electrical room CO₂ 5 kg found empty" },
        sa58: { date: "09 Dec 2025", status: "fault", notes: "Bldg-8 smoke detector SD-32 defective" },
        sec: { date: "10 Dec 2025", status: "done" },
        tech: { date: "11 Dec 2025", status: "done" },
        ap1: { date: "13 Dec 2025", status: "done" },
        ap2: { date: "15 Dec 2025", status: "done" },
        ap3: { date: "17 Dec 2025", status: "done" },
        ap4: { date: "20 Dec 2025", status: "done" },
        ext: { date: "22–25 Dec 2025", status: "done", notes: "27 external + 3 staff-accommodation hydrants" },
    },
    2: {
        sa14: { date: "20 Apr 2026", status: "done" },
        sa58: { date: "21 Apr 2026", status: "done" },
        sec: { date: "22 Apr 2026", status: "done" },
        tech: { date: "23 Apr 2026", status: "done" },
        fm: { date: "25 Apr 2026", status: "done", notes: "Incl. fire-pump testing; follow-up spares quotes raised May–Jun 2026 (refs 223425, 222982, 220240)" },
        ap1: { date: "26 Apr 2026", status: "done" },
        ap2: { date: "27 Apr 2026", status: "done" },
        ap3: { date: "28 Apr 2026", status: "done" },
        ap4: { date: "29 Apr 2026", status: "done" },
        ext: { date: "30 Apr 2026", status: "done" },
    },
    3: {
        sa14: { date: "Planned ~Aug 2026", status: "upcoming" },
        sa58: { date: "Planned ~Aug 2026", status: "upcoming" },
        ext: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap1: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap2: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap3: { date: "Planned ~Aug 2026", status: "upcoming" },
        ap4: { date: "Planned ~Aug 2026", status: "upcoming" },
        sec: { date: "Planned ~Aug 2026", status: "upcoming" },
        tech: { date: "Planned ~Aug 2026", status: "upcoming" },
        fm: { date: "Planned ~Aug 2026", status: "upcoming" },
    },
};

const PPM_ACTIVITIES: PpmActivity[] = ([1, 2, 3] as Cycle[]).flatMap((cycle) =>
    AREA_GROUPS.map((g) => {
        const d = CYCLE_DETAIL[cycle][g.key];
        return {
            id: `c${cycle}-${g.key}`,
            cycle,
            zone: g.zone,
            area: g.area,
            systems: g.systems,
            date: d.date,
            status: d.status,
            notes: d.notes,
        };
    }),
);

// ── Visual config ──────────────────────────────────────────────────────────

const STATUS_CFG: Record<PpmStatus, { label: string; icon: LucideIcon; cls: string; dot: string }> = {
    done: { label: "Completed", icon: CheckCircle, cls: "bg-mb-success-light text-mb-success-text", dot: "bg-[var(--status-normal)]" },
    scheduled: { label: "Scheduled", icon: Calendar, cls: "bg-primary/10 text-primary dark:text-muted-foreground/80", dot: "bg-primary" },
    upcoming: { label: "Upcoming", icon: Clock, cls: "bg-muted text-muted-foreground", dot: "bg-border dark:bg-muted-foreground" },
    fault: { label: "Fault", icon: XCircle, cls: "bg-mb-danger-light text-mb-danger-text", dot: "bg-[var(--status-danger)]" },
    no_access: { label: "No Access", icon: AlertTriangle, cls: "bg-mb-warning-light text-mb-warning-text", dot: "bg-[var(--status-warning)]" },
};

const ZONE_TAG: Record<ZoneKey, string> = {
    zone1: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-muted-foreground/80",
    zone3: "bg-secondary/15 text-secondary",
    zone5: "bg-mb-info-light text-mb-info-text",
    vs: "bg-mb-stale-light text-mb-stale-text",
};

const SYSTEM_TAG: Record<string, string> = {
    FA: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-muted-foreground/80",
    FF: "bg-mb-danger-light text-mb-danger-text",
    FE: "bg-mb-warning-light text-mb-warning-text",
    "Hose Reel": "bg-secondary/15 text-secondary",
    Hydrants: "bg-mb-info-light text-mb-info-text",
};

const SYSTEM_LEGEND: [string, string][] = [
    ["FA", "Fire Alarm"],
    ["FF", "Fire-Fighting (pumps / sprinkler)"],
    ["FE", "Fire Extinguishers"],
    ["Hose Reel", "Hose Reels"],
    ["Hydrants", "Fire Hydrants"],
];

// Maintenance tracker filter option lists (multi-select dropdowns operate on display labels).
const CYCLE_OPTIONS = CYCLES.map((c) => c.label);
const ZONE_OPTIONS = ZONES.map((z) => z.label);
const PPM_STATUS_OPTIONS = (Object.keys(STATUS_CFG) as PpmStatus[]).map((s) => STATUS_CFG[s].label);

// Equipment-status → donut slice colour (hex; SVG fill can't read CSS vars).
const EQUIP_STATUS_CHART_COLORS: Record<string, string> = {
    Operational: "#84B59F",        // --mb-success
    "Needs Attention": "#E8C064",  // --mb-warning
    "Maintenance Due": "#4E4456",  // --primary
    Expired: "#D67A7A",            // --mb-danger
};

// Shared HVAC-matching card title style (text-sm semibold, icon + label).
const CARD_TITLE = "text-sm font-semibold text-foreground dark:text-muted-foreground flex items-center gap-2";
const CHART_TOOLTIP_STYLE = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
    fontSize: "12px",
} as const;

// ── Small presentational components ─────────────────────────────────────────

function ZoneBadge({ zone, withScope = false }: { zone: ZoneKey; withScope?: boolean }) {
    const z = ZONE_BY_KEY[zone];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap", ZONE_TAG[zone])}>
            <MapPin className="w-3 h-3" />
            {withScope ? z.label : z.short}
        </span>
    );
}

function CycleBadge({ cycle }: { cycle: Cycle }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground dark:text-muted-foreground/80 whitespace-nowrap">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{cycle}</span>
            Cycle {cycle}
        </span>
    );
}

function PpmStatusBadge({ status }: { status: PpmStatus }) {
    const cfg = STATUS_CFG[status];
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", cfg.cls)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function SystemTag({ label }: { label: string }) {
    return (
        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide", SYSTEM_TAG[label] || "bg-muted text-muted-foreground")}>
            {label}
        </span>
    );
}

// Section heading shared by the Overview registers (icon + title + count + blurb).
function SectionHeading({ icon: Icon, title, count, description }: { icon: LucideIcon; title: string; count?: number; description?: string }) {
    return (
        <div className="mb-3">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-secondary" />
                <h2 className="text-sm font-semibold text-foreground dark:text-muted-foreground">{title}</h2>
                {count != null && <span className="text-xs text-muted-foreground tabular-nums">· {count}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
    );
}

function fmtDate(s: string | null | undefined): string {
    if (!s) return "—";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : format(d, "dd MMM yyyy");
}

const EQUIP_STATUS_CLS: Record<string, string> = {
    Operational: "bg-mb-success-light text-mb-success-text",
    "Needs Attention": "bg-mb-warning-light text-mb-warning-text",
    "Maintenance Due": "bg-primary/10 text-primary dark:text-muted-foreground/80",
    Expired: "bg-mb-danger-light text-mb-danger-text",
};

function issueStatusCls(status: string): string {
    const s = status.toLowerCase();
    if (s.includes("resolved")) return "bg-mb-success-light text-mb-success-text";
    if (s.includes("progress") || s.includes("ordered") || s.includes("issued")) return "bg-primary/10 text-primary dark:text-muted-foreground/80";
    if (s.includes("flag")) return "bg-mb-danger-light text-mb-danger-text";
    return "bg-mb-warning-light text-mb-warning-text";
}

// Map the equipment register's zone string to a designated-zone key.
function equipZoneKey(zone: string): ZoneKey | null {
    const z = zone.toLowerCase();
    if (z.includes("village")) return "vs";
    if (z.includes("1")) return "zone1";
    if (z.includes("3")) return "zone3";
    if (z.includes("5")) return "zone5";
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════════════

type TabKey = "overview" | "ppm" | "contract";

export default function FirefightingPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [equipment, setEquipment] = useState<FireSafetyEquipment[]>([]);
    const [issues, setIssues] = useState<FireIssue[]>([]);
    const [contacts, setContacts] = useState<FirePpmContact[]>([]);
    const [activityLog, setActivityLog] = useState<FirePpmActivity[]>([]);

    // Maintenance tracker — search, multi-select filters, sort & pagination
    const [search, setSearch] = useState("");
    const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    useEffect(() => {
        let active = true;
        (async () => {
            const res = await fetchFireSafetyDataAction();
            if (!active) return;
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
                setLastUpdated(new Date());
            }
            setLoading(false);
        })();
        return () => { active = false; };
    }, []);

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
        const counts: Record<ZoneKey, number> = { zone1: 0, zone3: 0, zone5: 0, vs: 0 };
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
        { label: "DESIGNATED ZONES", value: "4", subtitle: "Z1 · Z3 · Z5 · Village Sq", icon: Layers, variant: "water" as const },
        { label: "PPM CYCLES / YEAR", value: "3", subtitle: "BEC AMC · every ~4 months", icon: Calendar, variant: "primary" as const },
        { label: "CYCLES COMPLETE", value: `${completedCycles} / 3`, subtitle: "Year 1 · Dec & Apr done", icon: CheckCircle, variant: "success" as const },
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
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2"><Skeleton className="h-9 w-72" /><Skeleton className="h-4 w-56" /></div>
                    <Skeleton className="h-9 w-40" />
                </div>
                <div className="flex gap-2"><Skeleton className="h-10 w-32 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <PageHeader
                    title="Fire Safety Management"
                    description="BEC Annual Maintenance Contract (MIS-SBJ-25-077) · PPM 3× per year across 4 zones · Nov 2025 – Oct 2027"
                />
                <PageStatusBar isConnected={connected} lastUpdated={lastUpdated} error={error} />
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className={CARD_TITLE}><Building2 className="h-4 w-4 text-primary" /> Equipment by Zone</CardTitle>
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
                                    <CardTitle className={CARD_TITLE}><ShieldCheck className="h-4 w-4 text-secondary" /> Equipment by Status</CardTitle>
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
                    )}

                    {/* How the programme works */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className={CARD_TITLE}><Flame className="w-4 h-4 text-secondary" /> How the BEC PPM Programme Works</CardTitle>
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
                                                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground", done ? "bg-secondary" : "bg-muted-foreground/60")}>{c.key}</span>
                                                    {c.label}
                                                </span>
                                                {done
                                                    ? <span className="flex items-center gap-1 text-[11px] font-semibold text-secondary"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>
                                                    : <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Upcoming</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 ps-8">{c.window}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* The four zones */}
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
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
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

                    {/* Equipment Register */}
                    <div>
                        <SectionHeading icon={ShieldCheck} title="Equipment Register" count={equipment.length} description="Live from the fire-safety equipment register, grouped by designated zone." />
                        {equipment.length === 0 ? (
                            <div className="ops-table-shell"><EmptyState variant="no-data" title="No equipment data" description="Live equipment register is unavailable right now." /></div>
                        ) : (
                            <>
                                {/* Mobile cards */}
                                <div className="md:hidden space-y-3">
                                    {equipment.map((e) => {
                                        const zk = equipZoneKey(e.zone);
                                        return (
                                            <div key={e.id} className="rounded-xl border border-border dark:border-border bg-card p-4 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground dark:text-muted-foreground">{e.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{e.type} · {e.location}</p>
                                                    </div>
                                                    {zk ? <ZoneBadge zone={zk} /> : null}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", EQUIP_STATUS_CLS[e.status] || "bg-muted text-muted-foreground")}>{e.status}</span>
                                                    <span className="text-[11px] text-muted-foreground tabular-nums">Next: {fmtDate(e.next_maintenance)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead scope="col">Asset</TableHead>
                                                <TableHead scope="col">Type</TableHead>
                                                <TableHead scope="col">Zone</TableHead>
                                                <TableHead scope="col">Location</TableHead>
                                                <TableHead scope="col">Status</TableHead>
                                                <TableHead scope="col">Priority</TableHead>
                                                <TableHead scope="col" className="whitespace-nowrap">Next PPM</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {equipment.map((e) => {
                                                const zk = equipZoneKey(e.zone);
                                                return (
                                                    <TableRow key={e.id}>
                                                        <TableCell className="font-medium text-foreground dark:text-muted-foreground">{e.name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{e.type}</TableCell>
                                                        <TableCell>{zk ? <ZoneBadge zone={zk} /> : <span className="text-xs text-muted-foreground">{e.zone}</span>}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{e.location}</TableCell>
                                                        <TableCell><span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", EQUIP_STATUS_CLS[e.status] || "bg-muted text-muted-foreground")}>{e.status}</span></TableCell>
                                                        <TableCell className="text-xs font-medium text-muted-foreground">{e.priority}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(e.next_maintenance)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Issues & Defects Register */}
                    <div>
                        <SectionHeading icon={AlertTriangle} title="Issues & Defects Register" count={issues.length} description="Live defect log from the BEC engagement." />
                        {issues.length === 0 ? (
                            <div className="ops-table-shell"><EmptyState variant="no-data" title="No issues logged" description="The issues register is empty or unavailable." /></div>
                        ) : (
                            <>
                                {/* Mobile cards */}
                                <div className="md:hidden space-y-3">
                                    {issues.map((it) => (
                                        <div key={it.id} className="rounded-xl border border-border dark:border-border bg-card p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-foreground dark:text-muted-foreground">{it.issue_description}</p>
                                                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0", issueStatusCls(it.status))}>{it.status}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{it.location} · {fmtDate(it.date_reported)}</p>
                                            {it.resolution && <p className="text-[11px] text-muted-foreground">{it.resolution}</p>}
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead scope="col">Issue</TableHead>
                                                <TableHead scope="col">Location</TableHead>
                                                <TableHead scope="col" className="whitespace-nowrap">Reported</TableHead>
                                                <TableHead scope="col">Status</TableHead>
                                                <TableHead scope="col">Quote Ref</TableHead>
                                                <TableHead scope="col">Resolution</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {issues.map((it) => (
                                                <TableRow key={it.id}>
                                                    <TableCell className="font-medium text-foreground dark:text-muted-foreground max-w-[240px]">{it.issue_description}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{it.location}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(it.date_reported)}</TableCell>
                                                    <TableCell><span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", issueStatusCls(it.status))}>{it.status}</span></TableCell>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">{it.quote_ref || "—"}</TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground max-w-[260px]">{it.resolution || "—"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Attention strip */}
                    {(openFaults.length > 0 || openIssues.length > 0) && (
                        <Card className="border-mb-warning/30">
                            <CardContent className="p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-mb-warning-text flex-shrink-0 mt-0.5" />
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
                <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Toolbar — search + multi-select filters (matches the HVAC Maintenance tab) */}
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
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground whitespace-nowrap ml-auto">
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
                            <EmptyState variant="filter-empty" title="No activities match" description="Try adjusting the search or filters." />
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
                                        <TableCell className="text-[11px] text-muted-foreground max-w-[280px] truncate" title={a.notes}>{a.notes || "—"}</TableCell>
                                    </TableRow>
                                ))}
                                {filteredActivities.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <EmptyState variant="filter-empty" title="No activities match" description="Try adjusting the search or filters." />
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
                            <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-foreground">Cycle 3 (~Aug 2026) is the final Year-1 cycle.</p>
                                <p className="mt-1 text-muted-foreground">Year-2 cycles (Dec 2026, Apr 2027, Aug 2027) will be added once BEC issues each PPM plan. Dates are confirmed per cycle via the BEC work-permission request.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ CONTRACT & TEAM ══════════ */}
            {activeTab === "contract" && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Contract summary */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className={CARD_TITLE}><FileText className="w-4 h-4 text-secondary" /> AMC Contract Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                {[
                                    ["Contractor", "Bahwan Engineering Co. (BEC)"],
                                    ["Ref", "MIS-SBJ-25-077"],
                                    ["Type", "Non-Comprehensive AMC"],
                                    ["Period", "01 Nov 2025 → 31 Oct 2027 (24 months)"],
                                    ["Annual Fee", "RO 7,250 net (+ 5% VAT = RO 7,612.50)"],
                                    ["2-Year Total", "RO 15,225.00"],
                                    ["PPM Frequency", "4-Monthly (FA & FF) · Half-Yearly (FE)"],
                                    ["Cycles per Year", "3 (every ~4 months) across 4 zones"],
                                    ["Payment", "In arrears, on PPM completion"],
                                    ["Termination", "3 months written notice by either party"],
                                    ["Signed by MB", "Nouf AlHajri — Asst. Commercial Manager"],
                                    ["Signed by BEC", "Sujith Kumar Rao — Authorized Signatory"],
                                ].map(([label, value]) => (
                                    <div key={label} className="py-2 border-b border-border/60 dark:border-border/50">
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
                                        <p className="text-sm text-foreground font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* BEC team contacts (live) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className={CARD_TITLE}><Users className="w-4 h-4 text-secondary" /> BEC Team Contacts</CardTitle>
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
                                                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] text-secondary hover:underline break-all"><Mail className="w-3 h-3 flex-shrink-0" />{c.email}</a>}
                                                {c.phone && <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Phone className="w-3 h-3 flex-shrink-0" />{c.phone}</p>}
                                                {c.active_period && <p className="text-[10px] text-muted-foreground/70">{c.active_period}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* BEC engagement timeline (live activity log) */}
                    {activityLog.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className={CARD_TITLE}><History className="w-4 h-4 text-secondary" /> BEC Engagement Timeline</CardTitle>
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
                    )}

                    {/* SLA */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className={CARD_TITLE}><Clock className="w-4 h-4 text-secondary" /> Response-Time SLA</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { p: "P1 Emergency", time: "3 Hours", desc: "Continuous alarm, pump failure, major leak", bg: "bg-mb-danger-light", dot: "bg-destructive" },
                                    { p: "P2 Urgent", time: "8 Hours", desc: "Minor leak, panel malfunction, abnormal pump noise", bg: "bg-mb-warning-light", dot: "bg-mb-warning" },
                                    { p: "P3 Normal", time: "24 Hours", desc: "Extinguisher refilling, general maintenance", bg: "bg-mb-info-light", dot: "bg-mb-info" },
                                    { p: "P4 PPM", time: "Per schedule", desc: "Scheduled preventive maintenance", bg: "bg-muted dark:bg-muted/50", dot: "bg-muted-foreground" },
                                ].map((s) => (
                                    <div key={s.p} className={cn("rounded-lg px-4 py-3", s.bg)}>
                                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />{s.p}</p>
                                        <p className="text-xl font-bold text-foreground mt-1">{s.time}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipment under AMC */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className={CARD_TITLE}><Building2 className="w-4 h-4 text-secondary" /> Equipment Under AMC</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { label: "FA Panels", value: "41", sub: "Menvier · Gent · Tyco" },
                                    { label: "Extinguishers", value: "~549", sub: "All areas" },
                                    { label: "Hydrants", value: "30", sub: "3 Staff + 27 External" },
                                    { label: "Hose Reels", value: "25", sub: "Bristol / NAFFCO" },
                                    { label: "Electric Pumps", value: "2", sub: "500 GPM + 50 GPM" },
                                    { label: "Diesel Pumps", value: "2", sub: "500 GPM + 50 GPM" },
                                    { label: "Jockey Pump", value: "1", sub: "13.5 kW NAFFCO" },
                                    { label: "Pump Make", value: "NAFFCO", sub: "All 5 pumps" },
                                ].map((eq) => (
                                    <div key={eq.label} className="p-3 bg-muted dark:bg-muted/50 rounded-lg text-center">
                                        <p className="text-xl font-bold text-foreground">{eq.value}</p>
                                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.06em]">{eq.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{eq.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className={CARD_TITLE}><ShieldCheck className="w-4 h-4 text-secondary" /> Insurance Coverage (Contractual)</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                ["Owner's property (contractor negligence)", "RO 100,000"],
                                ["Third-party property liability", "RO 250,000"],
                                ["Workmen's compensation", "Covered under open policy"],
                            ].map(([coverage, limit]) => (
                                <div key={coverage} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/60 dark:border-border/50 last:border-0">
                                    <span className="text-sm text-muted-foreground">{coverage}</span>
                                    <span className="text-sm font-bold text-foreground flex-shrink-0">{limit}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Sewage tanker agreements (kept from previous version — STP-related) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className={CARD_TITLE}><Truck className="w-4 h-4 text-secondary" /> Sewage Tanker Discharge Agreements</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">External sewage tankers discharging into Muscat Bay STP Plant (STP-related — listed here for reference).</p>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="p-3 bg-mb-success-light rounded-lg">
                                <p className="text-xs font-bold text-mb-success-text uppercase">Discharge Rate</p>
                                <p className="text-lg font-bold text-foreground mt-1">1 OMR per 1,000 Gallons <span className="text-sm font-normal text-muted-foreground">(5 OMR per standard 5,000-gal tanker)</span></p>
                                <p className="text-[10px] text-muted-foreground mt-1">Quantity based on each vehicle&apos;s marked tank capacity · Rate set by Abdullah AlNasiri (Sep 2024)</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { name: "Al Abraj", contact: "Thomas", email: "abraj202@gmail.com" },
                                    { name: "Jomon's Company", contact: "Jomon", email: "joemonmaliakkal@gmail.com" },
                                ].map((co) => (
                                    <div key={co.name} className="p-4 bg-muted dark:bg-muted/50 rounded-lg border border-border dark:border-border/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-foreground">{co.name}</h4>
                                            <Badge className="bg-mb-success-light text-mb-success-text text-[10px]">Active</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {[["Contact", co.contact], ["Email", co.email], ["Contract", "Sewage Delivery Agreement 2026"], ["Signed/Renewed", "Feb 2026 · Revised 11 Mar 2026"]].map(([label, value]) => (
                                                <div key={label}><p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p><p className="text-xs text-foreground">{value}</p></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
