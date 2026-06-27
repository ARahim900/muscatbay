"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getFireSafetyEquipment, FireSafetyEquipment } from "@/lib/mock-data";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, HardHat, AlertTriangle, Wrench, Plus,
    CheckCircle, XCircle, Clock, CircleDot, ChevronDown, ChevronRight,
    FileText, Info, Filter, Flame, Calendar, Building2, Gauge, Truck
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { LiquidTooltip } from "../../components/charts/liquid-tooltip";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type PPMStatus = "done" | "in_progress" | "not_started" | "fault" | "no_access";
type StageStatus = "completed" | "in_progress" | "upcoming";

interface Building {
    id: string;
    area: string;
    systems: string[];
    date: string;
    status: PPMStatus;
    notes: string;
}

interface Stage {
    id: number;
    name: string;
    period: string;
    year: string;
    overallStatus: StageStatus;
    buildings: Building[];
}

// ═══════════════════════════════════════════════════════════════
// PPM DATABASE — Verified against BEC emails as of 28 Mar 2026
// ═══════════════════════════════════════════════════════════════

const PPM_DATABASE: Stage[] = [
    {
        id: 1,
        name: "Stage 1",
        period: "Dec 2025",
        year: "Year 1",
        overallStatus: "completed",
        buildings: [
            { id: "s1-1", area: "FM Office Building", systems: ["FA", "FF", "FE"], date: "07 Dec 2025", status: "done", notes: "Including fire pump testing" },
            { id: "s1-2", area: "Experience Centre", systems: ["FA", "FF", "FE"], date: "07 Dec 2025", status: "done", notes: "" },
            { id: "s1-3", area: "Staff Accom Bldg 1", systems: ["FA", "Hose Reel", "FE"], date: "08 Dec 2025", status: "done", notes: "" },
            { id: "s1-4", area: "Staff Accom Bldg 2", systems: ["FA", "Hose Reel", "FE"], date: "08 Dec 2025", status: "done", notes: "" },
            { id: "s1-5", area: "Staff Accom Bldg 3", systems: ["FA", "Hose Reel", "FE"], date: "08 Dec 2025", status: "done", notes: "" },
            { id: "s1-6", area: "Staff Accom Bldg 4", systems: ["FA", "Hose Reel", "FE"], date: "08 Dec 2025", status: "done", notes: "" },
            { id: "s1-7", area: "Staff Accom Bldg 5", systems: ["FA", "Hose Reel", "FE"], date: "09 Dec 2025", status: "done", notes: "" },
            { id: "s1-8", area: "Staff Accom Bldg 6", systems: ["FA", "Hose Reel", "FE"], date: "09 Dec 2025", status: "done", notes: "" },
            { id: "s1-9", area: "Staff Accom Bldg 7", systems: ["FA", "Hose Reel", "FE"], date: "09 Dec 2025", status: "done", notes: "" },
            { id: "s1-10", area: "Staff Accom Bldg 8", systems: ["FA", "Hose Reel", "FE"], date: "09 Dec 2025", status: "done", notes: "" },
            { id: "s1-11", area: "Security Room", systems: ["FA", "FE"], date: "10 Dec 2025", status: "done", notes: "" },
            { id: "s1-12", area: "Nursery", systems: ["FA", "FE"], date: "10 Dec 2025", status: "done", notes: "" },
            { id: "s1-13", area: "Control Room", systems: ["FA", "FE"], date: "10 Dec 2025", status: "done", notes: "" },
            { id: "s1-14", area: "Taxi Building", systems: ["FA", "FE"], date: "10 Dec 2025", status: "done", notes: "" },
            { id: "s1-15", area: "ROP Building", systems: ["FA", "FE"], date: "10 Dec 2025", status: "done", notes: "" },
            { id: "s1-16", area: "Technical Building", systems: ["FA", "FE"], date: "11 Dec 2025", status: "done", notes: "" },
            { id: "s1-17", area: "STP Building", systems: ["FA", "FE"], date: "11 Dec 2025", status: "done", notes: "" },
            { id: "s1-18", area: "Village Square", systems: ["FA", "FE"], date: "11 Dec 2025", status: "done", notes: "" },
            { id: "s1-19", area: "Apartment 44", systems: ["FA", "FE"], date: "13 Dec 2025", status: "done", notes: "" },
            { id: "s1-20", area: "Apartment 45", systems: ["FA", "FE"], date: "13 Dec 2025", status: "done", notes: "" },
            { id: "s1-21", area: "Apartment 46", systems: ["FA", "FE"], date: "13 Dec 2025", status: "done", notes: "" },
            { id: "s1-22", area: "Apartment 74", systems: ["FA", "FE"], date: "13 Dec 2025", status: "done", notes: "" },
            { id: "s1-23", area: "Apartment 75", systems: ["FA", "FE"], date: "13 Dec 2025", status: "done", notes: "" },
            { id: "s1-24", area: "Apartment 47", systems: ["FA", "FE"], date: "15 Dec 2025", status: "done", notes: "" },
            { id: "s1-25", area: "Apartment 48", systems: ["FA", "FE"], date: "15 Dec 2025", status: "done", notes: "" },
            { id: "s1-26", area: "Apartment 49", systems: ["FA", "FE"], date: "15 Dec 2025", status: "done", notes: "" },
            { id: "s1-27", area: "Apartment 50", systems: ["FA", "FE"], date: "15 Dec 2025", status: "done", notes: "" },
            { id: "s1-28", area: "Apartment 51", systems: ["FA", "FE"], date: "15 Dec 2025", status: "done", notes: "" },
            { id: "s1-29", area: "Apartment 52", systems: ["FA", "FE"], date: "17 Dec 2025", status: "done", notes: "" },
            { id: "s1-30", area: "Apartment 53", systems: ["FA", "FE"], date: "17 Dec 2025", status: "done", notes: "" },
            { id: "s1-31", area: "Apartment 54", systems: ["FA", "FE"], date: "17 Dec 2025", status: "done", notes: "" },
            { id: "s1-32", area: "Apartment 55", systems: ["FA", "FE"], date: "17 Dec 2025", status: "done", notes: "" },
            { id: "s1-33", area: "Apartment 56", systems: ["FA", "FE"], date: "17 Dec 2025", status: "done", notes: "" },
            { id: "s1-34", area: "Apartment 57", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-35", area: "Apartment 58", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-36", area: "Apartment 59", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-37", area: "Apartment 60", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-38", area: "Apartment 61", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-39", area: "Apartment 62", systems: ["FA", "FE"], date: "20 Dec 2025", status: "done", notes: "" },
            { id: "s1-40", area: "External Fire Hydrants", systems: ["Fire Hydrants"], date: "22-25 Dec 2025", status: "done", notes: "27 external + 3 staff accommodation" },
            { id: "s1-41", area: "Bldg-1 Room-4", systems: ["FE"], date: "08 Dec 2025", status: "no_access", notes: "No access for extinguisher service — FAULT OPEN" },
            { id: "s1-42", area: "Bldg-1 Room-7", systems: ["FE"], date: "08 Dec 2025", status: "fault", notes: "Extinguisher DCP 4.5 KG missing — FAULT OPEN" },
            { id: "s1-43", area: "Bldg-2 GF Electrical Room", systems: ["FE"], date: "08 Dec 2025", status: "fault", notes: "CO₂ 5 KG extinguisher found empty — FAULT OPEN" },
            { id: "s1-44", area: "Bldg-8 Smoke Detector SD-32", systems: ["FA"], date: "09 Dec 2025", status: "fault", notes: "Device defective — FAULT OPEN" },
        ],
    },
    {
        id: 2,
        name: "Stage 2",
        period: "~Apr 2026",
        year: "Year 1",
        overallStatus: "upcoming",
        buildings: [
            { id: "s2-1", area: "FM Office Building", systems: ["FA", "FF", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-2", area: "Experience Centre", systems: ["FA", "FF", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-3", area: "Staff Accom Bldgs 1-8", systems: ["FA", "Hose Reel", "FE"], date: "TBD", status: "not_started", notes: "Ensure access to Bldg-1 Rm-4 resolved before visit" },
            { id: "s2-4", area: "Security, Nursery, Control, Taxi, ROP", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-5", area: "Technical Bldg, STP, Village Square", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-6", area: "Apartments 44-62, 74-75", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-7", area: "External Fire Hydrants", systems: ["Fire Hydrants"], date: "TBD", status: "not_started", notes: "" },
            { id: "s2-8", area: "Fire Pump Testing", systems: ["FF"], date: "TBD", status: "not_started", notes: "Electric + Diesel + Jockey" },
        ],
    },
    {
        id: 3,
        name: "Stage 3",
        period: "~Aug 2026",
        year: "Year 1",
        overallStatus: "upcoming",
        buildings: [
            { id: "s3-1", area: "FM Office Building", systems: ["FA", "FF", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-2", area: "Experience Centre", systems: ["FA", "FF", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-3", area: "Staff Accom Bldgs 1-8", systems: ["FA", "Hose Reel", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-4", area: "Security, Nursery, Control, Taxi, ROP", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-5", area: "Technical Bldg, STP, Village Square", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-6", area: "Apartments 44-62, 74-75", systems: ["FA", "FE"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-7", area: "External Fire Hydrants", systems: ["Fire Hydrants"], date: "TBD", status: "not_started", notes: "" },
            { id: "s3-8", area: "Fire Pump Testing", systems: ["FF"], date: "TBD", status: "not_started", notes: "Electric + Diesel + Jockey" },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<PPMStatus, { label: string; icon: typeof CheckCircle; bg: string; text: string; dot: string }> = {
    done: { label: "Done", icon: CheckCircle, bg: "bg-secondary/10 dark:bg-secondary/15", text: "text-secondary dark:text-secondary", dot: "bg-secondary" },
    in_progress: { label: "In Progress", icon: Clock, bg: "bg-primary/10 dark:bg-primary/15", text: "text-primary dark:text-muted-foreground/70", dot: "bg-primary" },
    not_started: { label: "Not Started", icon: CircleDot, bg: "bg-muted dark:bg-muted", text: "text-muted-foreground", dot: "bg-border dark:bg-muted-foreground" },
    fault: { label: "Fault", icon: XCircle, bg: "bg-destructive/10 dark:bg-destructive/15", text: "text-destructive", dot: "bg-destructive" },
    no_access: { label: "No Access", icon: AlertTriangle, bg: "bg-mb-warning-light", text: "text-mb-warning-text", dot: "bg-mb-warning" },
};

const STAGE_STATUS: Record<StageStatus, { label: string; color: string; border: string; bg: string }> = {
    completed: { label: "Completed", color: "bg-secondary", border: "border-secondary/30 dark:border-secondary/20", bg: "bg-secondary/5 dark:bg-secondary/10" },
    in_progress: { label: "In Progress", color: "bg-primary", border: "border-primary/30 dark:border-primary/20", bg: "bg-primary/5 dark:bg-primary/10" },
    upcoming: { label: "Upcoming", color: "bg-muted-foreground dark:bg-muted", border: "border-border dark:border-border", bg: "bg-muted dark:bg-muted/50" },
};

// ═══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: PPMStatus }) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.bg, cfg.text)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function SystemTag({ label }: { label: string }) {
    // Use muted, consistent tones — avoid bright saturated colors
    const colors: Record<string, string> = {
        FA: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-muted-foreground/70",
        FF: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        FE: "bg-mb-warning-light text-mb-warning-text",
        "Hose Reel": "bg-secondary/10 text-primary dark:bg-secondary/20 dark:text-secondary",
        "Fire Hydrants": "bg-secondary/10 text-primary dark:bg-secondary/20 dark:text-secondary",
    };
    return (
        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", colors[label] || "bg-muted text-muted-foreground")}>
            {label}
        </span>
    );
}

function ProgressBar({ done, total, faults }: { done: number; total: number; faults: number }) {
    const pctDone = Math.round((done / total) * 100);
    const pctFault = Math.round((faults / total) * 100);
    // Stacked absolute layers + transform: scaleX keeps the animation on the
    // compositor (no layout / paint per frame). Faults sits underneath; done
    // covers it from 0..pctDone, so the visible faults band runs pctDone..pctDone+pctFault.
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1 h-2.5 bg-muted dark:bg-muted rounded-full overflow-hidden">
                {faults > 0 && (
                    <div
                        className="absolute inset-y-0 left-0 w-full bg-destructive/70 origin-left transition-transform duration-200"
                        style={{ transform: `scaleX(${(pctDone + pctFault) / 100})` }}
                    />
                )}
                <div
                    className="absolute inset-y-0 left-0 w-full bg-secondary origin-left transition-transform duration-200"
                    style={{ transform: `scaleX(${pctDone / 100})` }}
                />
            </div>
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground tabular-nums whitespace-nowrap">{done}/{total}</span>
        </div>
    );
}

function StageCard({ stage, isExpanded, onToggle, filterStatus }: { stage: Stage; isExpanded: boolean; onToggle: () => void; filterStatus: string }) {
    const stageStyle = STAGE_STATUS[stage.overallStatus];
    const buildings = filterStatus === "all"
        ? stage.buildings
        : stage.buildings.filter(b => b.status === filterStatus);

    const totalBuildings = stage.buildings.length;
    const doneCount = stage.buildings.filter(b => b.status === "done").length;
    const faultCount = stage.buildings.filter(b => b.status === "fault" || b.status === "no_access").length;
    const inProgressCount = stage.buildings.filter(b => b.status === "in_progress").length;
    const notStartedCount = stage.buildings.filter(b => b.status === "not_started").length;

    return (
        <Card className={cn("card-elevated overflow-hidden transition-all duration-200", stageStyle.border, isExpanded && "shadow-md")}>
            <button
                onClick={onToggle}
                className={cn("w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 transition-colors text-left", stageStyle.bg)}
            >
                <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl text-primary-foreground flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0", stageStyle.color)}>
                    {stage.id}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-foreground text-base">{stage.name}</h2>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-primary-foreground", stageStyle.color)}>
                            {stageStyle.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">{stage.year}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.period}</p>
                </div>

                <div className="hidden sm:flex items-center gap-3 me-2">
                    {doneCount > 0 && <span className="flex items-center gap-1 text-xs text-secondary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" />{doneCount}</span>}
                    {inProgressCount > 0 && <span className="flex items-center gap-1 text-xs text-primary dark:text-muted-foreground font-semibold"><span className="w-2 h-2 rounded-full bg-primary" />{inProgressCount}</span>}
                    {faultCount > 0 && <span className="flex items-center gap-1 text-xs text-destructive font-semibold"><span className="w-2 h-2 rounded-full bg-destructive" />{faultCount}</span>}
                    {notStartedCount > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold"><span className="w-2 h-2 rounded-full bg-border dark:bg-muted-foreground" />{notStartedCount}</span>}
                </div>

                <div className="w-32 hidden md:block">
                    <ProgressBar done={doneCount} total={totalBuildings} faults={faultCount} />
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            </button>

            {isExpanded && (
                <div className="bg-white dark:bg-muted">
                    <div className="md:hidden px-3 sm:px-5 pt-3">
                        <ProgressBar done={doneCount} total={totalBuildings} faults={faultCount} />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 border-b border-border dark:border-border flex-wrap">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold me-1">Legend:</span>
                        <span className="text-[10px] text-secondary flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>
                        <span className="text-[10px] text-primary dark:text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>
                        <span className="text-[10px] text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" /> Fault</span>
                        <span className="text-[10px] text-mb-warning-text flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No Access</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><CircleDot className="w-3 h-3" /> Not Started</span>
                    </div>

                    <div className="divide-y divide-border dark:divide-border/50">
                        {buildings.map((b) => (
                            <div
                                key={b.id}
                                className={cn(
                                    "flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-muted/70 dark:hover:bg-muted/30 transition-colors",
                                    b.status === "fault" && "bg-destructive/5 dark:bg-destructive/10",
                                    b.status === "no_access" && "bg-mb-warning-light/40"
                                )}
                            >
                                <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 sm:mt-0", STATUS_CONFIG[b.status]?.dot)} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={cn("text-sm font-medium", b.status === "fault" ? "text-destructive" : b.status === "no_access" ? "text-mb-warning-text" : "text-foreground")}>
                                            {b.area}
                                        </p>
                                        <div className="sm:hidden flex-shrink-0">
                                            <StatusBadge status={b.status} />
                                        </div>
                                    </div>
                                    {b.notes && (
                                        <p className={cn("text-[11px] mt-0.5", b.status === "fault" ? "text-destructive font-medium" : b.status === "no_access" ? "text-mb-warning-text font-medium" : "text-muted-foreground")}>
                                            {b.notes}
                                        </p>
                                    )}
                                    <div className="flex gap-1 mt-1 sm:hidden flex-wrap">
                                        {b.systems.map((s) => <SystemTag key={s} label={s} />)}
                                        {b.date !== "TBD" && <span className="text-[10px] text-muted-foreground tabular-nums">{b.date}</span>}
                                    </div>
                                </div>
                                <div className="hidden sm:flex gap-1 flex-shrink-0">
                                    {b.systems.map((s) => <SystemTag key={s} label={s} />)}
                                </div>
                                <span className="text-[11px] text-muted-foreground hidden sm:block w-24 text-right flex-shrink-0 tabular-nums">{b.date}</span>
                                <div className="hidden sm:block flex-shrink-0">
                                    <StatusBadge status={b.status} />
                                </div>
                            </div>
                        ))}
                        {buildings.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No items match the selected filter.</div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function FirefightingPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [equipment, setEquipment] = useState<FireSafetyEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStage, setExpandedStage] = useState<number | null>(1);
    const [filterStatus, setFilterStatus] = useState("all");

    const loadData = useCallback(async () => {
        try {
            const result = await getFireSafetyEquipment();
            setEquipment(result);
        } catch {
            // silent fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const stats = useMemo(() => {
        const total = equipment.length;
        const operational = equipment.filter(e => e.status === "Operational").length;
        const critical = equipment.filter(e => e.priority === "Critical").length;
        const maintenanceDue = equipment.filter(e => e.status === "Maintenance Due").length;

        return [
            { label: "TOTAL EQUIPMENT", value: total.toString(), subtitle: "All Operations", icon: HardHat, variant: "water" as const },
            { label: "OPERATIONAL", value: operational.toString(), subtitle: "Working Properly", icon: ShieldCheck, variant: "success" as const },
            { label: "CRITICAL ISSUES", value: critical.toString(), subtitle: "Requires Attention", icon: AlertTriangle, variant: "danger" as const },
            { label: "MAINTENANCE DUE", value: maintenanceDue.toString(), subtitle: "Service Required", icon: Wrench, variant: "warning" as const }
        ];
    }, [equipment]);

    const chartData = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        equipment.forEach(e => {
            statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
        });
        const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        const typeCounts: Record<string, number> = {};
        equipment.forEach(e => {
            typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        });
        const barData = Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        return { pieData, barData };
    }, [equipment]);

    // PPM Stats
    const ppmStats = useMemo(() => {
        const allBuildings = PPM_DATABASE.flatMap(s => s.buildings);
        const totalDone = allBuildings.filter(b => b.status === "done").length;
        const totalFaults = allBuildings.filter(b => b.status === "fault" || b.status === "no_access").length;
        const totalNotStarted = allBuildings.filter(b => b.status === "not_started").length;
        const totalAll = allBuildings.length;
        return { totalAll, totalDone, totalFaults, totalNotStarted };
    }, []);

    const filterOptions = [
        { key: "all", label: "All", count: ppmStats.totalAll },
        { key: "done", label: "Done", count: ppmStats.totalDone },
        { key: "fault", label: "Faults", count: PPM_DATABASE.flatMap(s => s.buildings).filter(b => b.status === "fault").length },
        { key: "no_access", label: "No Access", count: PPM_DATABASE.flatMap(s => s.buildings).filter(b => b.status === "no_access").length },
        { key: "not_started", label: "Not Started", count: ppmStats.totalNotStarted },
    ];

    // Chart colors matching design system tokens (chart-1 through chart-5)
    const COLORS = ["var(--chart-success)", "var(--chart-amber)", "var(--chart-loss)", "var(--chart-2)"];

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full motion-safe:animate-in motion-safe:fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                </div>
                <StatsGridSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <ChartSkeleton height="h-[250px] sm:h-[300px] md:h-80" />
                    <ChartSkeleton height="h-[250px] sm:h-[300px] md:h-80" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Fire Safety Management"
                description="BEC AMC · MIS-SBJ-25-077 · Nov 2025 – Oct 2027"
                action={{ label: "Add Equipment", icon: Plus }}
            />

            <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabs={[
                    { key: "dashboard", label: "Dashboard", icon: Gauge },
                    { key: "ppm", label: "PPM Tracker", icon: Calendar },
                    { key: "contract", label: "Contract", icon: FileText },
                ]}
            />

            {/* ══════════ DASHBOARD ══════════ */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    <StatsGrid stats={stats} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <Card className="card-elevated">
                            <CardHeader className="card-elevated-header"><CardTitle>System Status Distribution</CardTitle></CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px] md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius="55%" paddingAngle={5}>
                                            {chartData.pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<LiquidTooltip />} />
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary dark:fill-white">
                                            {equipment.length}
                                        </text>
                                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-muted-foreground">
                                            Total Units
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="card-elevated">
                            <CardHeader className="card-elevated-header"><CardTitle>Equipment by Type</CardTitle></CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px] md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.barData} layout="vertical" margin={{ left: 5, right: 10, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} className="text-xs" tick={{ fill: 'currentColor' }} />
                                        <Tooltip content={<LiquidTooltip />} />
                                        <Bar dataKey="value" fill="var(--secondary)" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick AMC Summary — matches other section stat patterns */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-secondary" />
                                    AMC Quick Status
                                </CardTitle>
                                <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <StatsGrid stats={[
                                { label: "TOTAL PPM ITEMS", value: ppmStats.totalAll.toString(), icon: ShieldCheck, variant: "primary" as const },
                                { label: "COMPLETED", value: ppmStats.totalDone.toString(), icon: CheckCircle, variant: "success" as const },
                                { label: "OPEN FAULTS", value: ppmStats.totalFaults.toString(), icon: AlertTriangle, variant: "danger" as const },
                                { label: "NOT STARTED", value: ppmStats.totalNotStarted.toString(), icon: CircleDot, variant: "default" as const },
                            ]} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ PPM TRACKER ══════════ */}
            {activeTab === 'ppm' && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Summary Stats — same pattern as other sections */}
                    <StatsGrid stats={[
                        { label: "TOTAL ITEMS", value: ppmStats.totalAll.toString(), icon: ShieldCheck, variant: "primary" as const },
                        { label: "COMPLETED", value: ppmStats.totalDone.toString(), icon: CheckCircle, variant: "success" as const },
                        { label: "OPEN FAULTS", value: ppmStats.totalFaults.toString(), icon: AlertTriangle, variant: "danger" as const },
                        { label: "NOT STARTED", value: ppmStats.totalNotStarted.toString(), icon: CircleDot, variant: "default" as const },
                    ]} />

                    {/* Filters — using shared TabNavigation pattern */}
                    <TabNavigation
                        activeTab={filterStatus}
                        onTabChange={(key) => setFilterStatus(key)}
                        variant="secondary"
                        tabs={filterOptions.map(f => ({
                            key: f.key,
                            label: `${f.label} (${f.count})`,
                            icon: f.key === 'done' ? CheckCircle : f.key === 'fault' ? XCircle : f.key === 'no_access' ? AlertTriangle : f.key === 'in_progress' ? Clock : f.key === 'not_started' ? CircleDot : Filter,
                        }))}
                    />

                    {/* Stages */}
                    <div className="space-y-4">
                        {PPM_DATABASE.map(stage => (
                            <StageCard
                                key={stage.id}
                                stage={stage}
                                isExpanded={expandedStage === stage.id}
                                onToggle={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                                filterStatus={filterStatus}
                            />
                        ))}
                    </div>

                    {/* Year 2 note */}
                    <Card className="card-elevated border-border dark:border-border">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-foreground dark:text-muted-foreground/70">
                                <p className="font-semibold">Year 2 stages (Dec 2026, Apr 2027, Aug 2027) not yet added.</p>
                                <p className="mt-1 text-muted-foreground">PPM visits in Apr & Aug 2025 were under the previous AMC and are not tracked here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ CONTRACT INFO ══════════ */}
            {activeTab === 'contract' && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
                    {/* Contract Summary */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header border-b border-border dark:border-border">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-secondary" />
                                Contract Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                {[
                                    ["Ref", "MIS-SBJ-25-077"],
                                    ["Type", "Non-Comprehensive AMC"],
                                    ["Period", "01 Nov 2025 → 31 Oct 2027 (24 months)"],
                                    ["Annual Fee", "RO 7,250 net (+ 5% VAT = RO 7,612.50)"],
                                    ["2-Year Total", "RO 15,225.00"],
                                    ["Negotiated Saving", "12.1% off BEC revised offer of RO 8,250"],
                                    ["PPM Frequency", "4-Monthly (FA & FF) · Half-Yearly (FE)"],
                                    ["Stages per Year", "3 (every ~4 months)"],
                                    ["Payment", "In arrears, against invoice on PPM completion"],
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

                    {/* SLA */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header border-b border-border dark:border-border">
                            <CardTitle>Response Time SLA</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { p: "P1 Emergency", time: "3 Hours", desc: "Continuous alarm, pump failure, major leak", bg: "bg-mb-danger-light", dot: "bg-destructive" },
                                    { p: "P2 Urgent", time: "8 Hours", desc: "Minor leak, panel malfunction, abnormal pump noise", bg: "bg-mb-warning-light", dot: "bg-mb-warning" },
                                    { p: "P3 Normal", time: "24 Hours", desc: "Extinguisher refilling, general maintenance", bg: "bg-mb-info-light", dot: "bg-mb-info" },
                                    { p: "P4 PPM", time: "Per schedule", desc: "Scheduled preventive maintenance", bg: "bg-muted dark:bg-muted/50", dot: "bg-muted-foreground dark:bg-muted-foreground" },
                                ].map((s) => (
                                    <div key={s.p} className={cn("rounded-lg px-4 py-3", s.bg)}>
                                        <p className="text-xs font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                                            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
                                            {s.p}
                                        </p>
                                        <p className="text-xl font-bold text-foreground mt-1">{s.time}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipment Under AMC */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header border-b border-border dark:border-border">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-secondary" />
                                Equipment Under AMC
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { label: "FA Panels", value: "41", sub: "Menvier · Gent · Tyco" },
                                    { label: "Extinguishers", value: "~549", sub: "All areas" },
                                    { label: "Hydrants", value: "30", sub: "3 Staff + 27 External" },
                                    { label: "Hose Reels", value: "25", sub: "Bristol / NAFFCO" },
                                    { label: "Electric Pumps", value: "2", sub: "500 GPM + 50 GPM" },
                                    { label: "Diesel Pumps", value: "2", sub: "500 GPM + 50 GPM" },
                                    { label: "Jockey Pump", value: "1", sub: "13.5 kW NAFFCO" },
                                    { label: "Total Pump Make", value: "NAFFCO", sub: "All 5 pumps" },
                                ].map((eq) => (
                                    <div key={eq.label} className="p-3 bg-muted dark:bg-muted/50 rounded-lg text-center">
                                        <p className="text-xl font-bold text-foreground">{eq.value}</p>
                                        <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-semibold uppercase tracking-[0.06em]">{eq.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{eq.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header border-b border-border dark:border-border">
                            <CardTitle>Insurance Coverage (Contractual)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            {[
                                ["Owner's property (contractor negligence)", "RO 100,000"],
                                ["Third-party property liability", "RO 250,000"],
                                ["Workmen's compensation", "Covered under open policy"],
                            ].map(([coverage, limit]) => (
                                <div key={coverage} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/60 dark:border-border/50 last:border-0">
                                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">{coverage}</span>
                                    <span className="text-sm font-bold text-foreground flex-shrink-0">{limit}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* ── Sewage Tanker Discharge Contracts ── */}
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header border-b border-border dark:border-border">
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-secondary" />
                                Sewage Tanker Discharge Agreements
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                External sewage tankers discharging into Muscat Bay STP Plant
                            </p>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-5">
                            {/* Rate Structure */}
                            <div className="p-3 bg-mb-success-light rounded-lg">
                                <p className="text-xs font-bold text-mb-success-text uppercase">Discharge Rate</p>
                                <p className="text-lg font-bold text-foreground mt-1">
                                    1 OMR per 1,000 Gallons <span className="text-sm font-normal text-muted-foreground">(5 OMR per standard 5,000-gal tanker)</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Quantity based on each vehicle&apos;s marked tank capacity · Rate set by Abdullah AlNasiri (Sep 2024)
                                </p>
                            </div>

                            {/* Company Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Al Abraj */}
                                <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg border border-border dark:border-border/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-foreground">Al Abraj</h4>
                                        <Badge className="bg-mb-success-light text-mb-success-text text-[10px]">Active</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            ["Contact", "Thomas"],
                                            ["Email", "abraj202@gmail.com"],
                                            ["Contract", "Sewage Delivery Agreement 2026"],
                                            ["Drafted", "Aug 2024 · Reviewed by Shireen AlHabib (General Counsel)"],
                                            ["Signed/Renewed", "Feb 2026 · Distributed by Siva Kumar"],
                                            ["Revised", "11 Mar 2026"],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
                                                <p className="text-xs text-foreground">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Jomon */}
                                <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg border border-border dark:border-border/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-foreground">Jomon&apos;s Company</h4>
                                        <Badge className="bg-mb-success-light text-mb-success-text text-[10px]">Active</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            ["Contact", "Jomon"],
                                            ["Email", "joemonmaliakkal@gmail.com"],
                                            ["Contract", "Sewage Delivery Agreement 2026"],
                                            ["Drafted", "Aug 2024 · Reviewed by Shireen AlHabib (General Counsel)"],
                                            ["Signed/Renewed", "Feb 2026 · Distributed by Siva Kumar"],
                                            ["Revised", "11 Mar 2026"],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
                                                <p className="text-xs text-foreground">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer note */}
                            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border dark:border-border/50">
                                Agreements managed by Rahim · Legal review by Shireen AlHabib · Rate approved by Abdullah AlNasiri
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
