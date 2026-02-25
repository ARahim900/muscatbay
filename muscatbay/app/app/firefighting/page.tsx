"use client";

import { useEffect, useState, useMemo } from "react";
import { getFireSafetyEquipment, FireSafetyEquipment } from "@/lib/mock-data";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { StatsGridSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck, HardHat, AlertTriangle, Wrench, Search, MapPin, Battery, Signal, Plus,
    CheckCircle, XCircle, Clock, CircleDot, ChevronDown, ChevronRight, Phone, Mail,
    FileText, Users, Info, Filter, Flame, Calendar, Building2, Gauge
} from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useRouter } from "next/navigation";
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
// PPM DATABASE — Verified against BEC emails as of 22 Feb 2026
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

const OPEN_FAULTS = [
    { equipment: "Fire Extinguisher", location: "Bldg-1, Room-4", fault: "No access for service" },
    { equipment: "Fire Extinguisher DCP 4.5 KG", location: "Bldg-1, Room-7", fault: "Missing" },
    { equipment: "Fire Extinguisher CO₂ 5 KG", location: "Bldg-2, GF Electrical Room", fault: "Found empty" },
    { equipment: "Smoke Detector SD-32", location: "Bldg-8", fault: "Defective" },
];

const CONTACTS = [
    { name: "Arun Achuthan", role: "BEC Site Lead / FM&M", phone: "+968 96590516", email: "arunachuthan.fmm@becoman.com" },
    { name: "Nadim Mushir Ahmad", role: "BEC PPM Team Lead", phone: "+968 97725265", email: "nadim.fmm@becoman.com" },
    { name: "Joji C. John", role: "BEC Asst. Manager", phone: "+968 99318348", email: "joji.fmm@becoman.com" },
    { name: "FA Team (Suneesh.L)", role: "BEC Field Technician", phone: "+968 95624943", email: "fateam.fmm@becoman.com" },
    { name: "BEC Office", role: "Emergency / General", phone: "+968 24592028", email: "" },
    { name: "MB Helpdesk", role: "24/7 Operations", phone: "+968 98285725", email: "helpdesk@muscatbay.com" },
    { name: "Amjad Khan", role: "FM Manager (Kalhat)", phone: "+968 98863960", email: "amjad@kalhat.com" },
];

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<PPMStatus, { label: string; icon: typeof CheckCircle; bg: string; text: string; dot: string }> = {
    done: { label: "Done", icon: CheckCircle, bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    in_progress: { label: "In Progress", icon: Clock, bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
    not_started: { label: "Not Started", icon: CircleDot, bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-300 dark:bg-slate-500" },
    fault: { label: "Fault", icon: XCircle, bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
    no_access: { label: "No Access", icon: AlertTriangle, bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
};

const STAGE_STATUS: Record<StageStatus, { label: string; color: string; border: string; bg: string }> = {
    completed: { label: "Completed", color: "bg-emerald-500", border: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    in_progress: { label: "In Progress", color: "bg-blue-500", border: "border-blue-300 dark:border-blue-700", bg: "bg-blue-50 dark:bg-blue-900/20" },
    upcoming: { label: "Upcoming", color: "bg-slate-300 dark:bg-slate-600", border: "border-slate-200 dark:border-slate-700", bg: "bg-slate-50 dark:bg-slate-800/50" },
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
    const colors: Record<string, string> = {
        FA: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        FF: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        FE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        "Hose Reel": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "Fire Hydrants": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    };
    return (
        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", colors[label] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400")}>
            {label}
        </span>
    );
}

function ProgressBar({ done, total, faults }: { done: number; total: number; faults: number }) {
    const pctDone = Math.round((done / total) * 100);
    const pctFault = Math.round((faults / total) * 100);
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pctDone}%` }} />
                {faults > 0 && <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${pctFault}%` }} />}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">{done}/{total}</span>
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
        <Card className={cn("glass-card overflow-hidden transition-all duration-300", stageStyle.border, isExpanded && "shadow-md")}>
            <button
                onClick={onToggle}
                className={cn("w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 transition-colors text-left", stageStyle.bg)}
            >
                <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0", stageStyle.color)}>
                    {stage.id}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{stage.name}</h3>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white", stageStyle.color)}>
                            {stageStyle.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{stage.year}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stage.period}</p>
                </div>

                <div className="hidden sm:flex items-center gap-3 mr-2">
                    {doneCount > 0 && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500" />{doneCount}</span>}
                    {inProgressCount > 0 && <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500" />{inProgressCount}</span>}
                    {faultCount > 0 && <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-semibold"><span className="w-2 h-2 rounded-full bg-red-500" />{faultCount}</span>}
                    {notStartedCount > 0 && <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold"><span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500" />{notStartedCount}</span>}
                </div>

                <div className="w-32 hidden md:block">
                    <ProgressBar done={doneCount} total={totalBuildings} faults={faultCount} />
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            </button>

            {isExpanded && (
                <div className="bg-white dark:bg-slate-800">
                    <div className="md:hidden px-3 sm:px-5 pt-3">
                        <ProgressBar done={doneCount} total={totalBuildings} faults={faultCount} />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 border-b border-slate-100 dark:border-slate-700 flex-wrap">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Legend:</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>
                        <span className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Fault</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No Access</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><CircleDot className="w-3 h-3" /> Not Started</span>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {buildings.map((b) => (
                            <div
                                key={b.id}
                                className={cn(
                                    "flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors",
                                    b.status === "fault" && "bg-red-50/40 dark:bg-red-900/10",
                                    b.status === "no_access" && "bg-amber-50/40 dark:bg-amber-900/10"
                                )}
                            >
                                <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 sm:mt-0", STATUS_CONFIG[b.status]?.dot)} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={cn("text-sm font-medium", (b.status === "fault" || b.status === "no_access") ? "text-red-800 dark:text-red-400" : "text-slate-900 dark:text-slate-100")}>
                                            {b.area}
                                        </p>
                                        <div className="sm:hidden flex-shrink-0">
                                            <StatusBadge status={b.status} />
                                        </div>
                                    </div>
                                    {b.notes && (
                                        <p className={cn("text-[11px] mt-0.5", (b.status === "fault" || b.status === "no_access") ? "text-red-500 dark:text-red-400 font-medium" : "text-slate-400")}>
                                            {b.notes}
                                        </p>
                                    )}
                                    <div className="flex gap-1 mt-1 sm:hidden flex-wrap">
                                        {b.systems.map((s, i) => <SystemTag key={i} label={s} />)}
                                        {b.date !== "TBD" && <span className="text-[10px] text-slate-400 tabular-nums">{b.date}</span>}
                                    </div>
                                </div>
                                <div className="hidden sm:flex gap-1 flex-shrink-0">
                                    {b.systems.map((s, i) => <SystemTag key={i} label={s} />)}
                                </div>
                                <span className="text-[11px] text-slate-400 hidden sm:block w-24 text-right flex-shrink-0 tabular-nums">{b.date}</span>
                                <div className="hidden sm:block flex-shrink-0">
                                    <StatusBadge status={b.status} />
                                </div>
                            </div>
                        ))}
                        {buildings.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-slate-400">No items match the selected filter.</div>
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
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [equipment, setEquipment] = useState<FireSafetyEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedStage, setExpandedStage] = useState<number | null>(1);
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getFireSafetyEquipment();
                setEquipment(result);
            } catch (e) {
                // console.error("Failed to load firefighting data", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleTabChange = (key: string) => {
        if (key === 'quotes') {
            router.push('/firefighting/quotes');
        } else {
            setActiveTab(key);
        }
    };

    const filteredEquipment = equipment.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
    );

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

    const COLORS = ["#5BA88B", "#E8A838", "#C95D63", "#81D8D0"];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Operational": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "Needs Attention": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            case "Expired": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "Maintenance Due": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            default: return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical": return "bg-red-500 text-white";
            case "High": return "bg-amber-500 text-white";
            case "Medium": return "bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200";
            case "Low": return "bg-emerald-500 text-white";
            default: return "bg-slate-500 text-white";
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full animate-in fade-in duration-300">
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
                    { key: "equipment", label: "Equipment", icon: HardHat },
                    { key: "faults", label: `Faults (${OPEN_FAULTS.length})`, icon: AlertTriangle },
                    { key: "contacts", label: "Contacts", icon: Users },
                    { key: "contract", label: "Contract", icon: FileText },
                    { key: "quotes", label: "Quotes", icon: FileText },
                ]}
            />

            {/* ══════════ DASHBOARD ══════════ */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <StatsGrid stats={stats} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <Card className="glass-card">
                            <CardHeader className="glass-card-header"><CardTitle>System Status Distribution</CardTitle></CardHeader>
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

                        <Card className="glass-card">
                            <CardHeader className="glass-card-header"><CardTitle>Equipment by Type</CardTitle></CardHeader>
                            <CardContent className="h-[250px] sm:h-[300px] md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.barData} layout="vertical" margin={{ left: 40, right: 10, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} className="text-xs" tick={{ fill: 'currentColor' }} />
                                        <Tooltip content={<LiquidTooltip />} />
                                        <Bar dataKey="value" fill="#81D8D0" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick AMC Summary */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-red-500" />
                                    AMC Quick Status
                                </CardTitle>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{ppmStats.totalAll}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Total PPM Items</p>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{ppmStats.totalDone}</p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-semibold mt-1">Completed</p>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{ppmStats.totalFaults}</p>
                                    <p className="text-[10px] text-red-500 uppercase font-semibold mt-1">Open Faults</p>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-slate-500">{ppmStats.totalNotStarted}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Not Started</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ PPM TRACKER ══════════ */}
            {activeTab === 'ppm' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{ppmStats.totalAll}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Total Items</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{ppmStats.totalDone}</p>
                            <p className="text-[10px] text-emerald-600 uppercase font-semibold mt-1">Done</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-3 sm:p-4 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{ppmStats.totalFaults}</p>
                            <p className="text-[10px] text-red-500 uppercase font-semibold mt-1">Faults</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-slate-500">{ppmStats.totalNotStarted}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Not Started</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-slate-400" />
                        {filterOptions.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterStatus(f.key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                                    filterStatus === f.key
                                        ? "bg-primary text-white"
                                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 dark:hover:border-slate-500"
                                )}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>

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
                    <Card className="glass-card border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700 dark:text-blue-400">
                                <p className="font-semibold">Year 2 stages (Dec 2026, Apr 2027, Aug 2027) not yet added.</p>
                                <p className="mt-1 text-blue-500 dark:text-blue-500">PPM visits in Apr & Aug 2025 were under the previous AMC and are not tracked here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ EQUIPMENT ══════════ */}
            {activeTab === 'equipment' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search equipment by name, location, or type..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-white/50 dark:bg-slate-800/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredEquipment.map(item => (
                            <Card key={item.id} className="glass-card hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className={cn(getStatusColor(item.status), "border-transparent")}>
                                                {item.status}
                                            </Badge>
                                            <Badge className={cn(getPriorityColor(item.priority), "border-transparent ml-2")}>
                                                {item.priority}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2 text-primary dark:text-slate-100">
                                                <HardHat className="w-4 h-4 text-muted-foreground" />
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {item.location} • {item.type}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Zone: {item.zone}</p>
                                        </div>

                                        {(item.battery !== null || item.signal !== null) && (
                                            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg">
                                                {item.battery !== null && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Battery className="w-3 h-3 text-slate-500" />
                                                        <span>Batt: {item.battery}%</span>
                                                    </div>
                                                )}
                                                {item.signal !== null && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Signal className="w-3 h-3 text-slate-500" />
                                                        <span>Sig: {item.signal}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 flex justify-between items-center rounded-b-[20px] border-t border-slate-100 dark:border-slate-700">
                                        <span className="text-xs text-muted-foreground">Maintained by: {item.inspector}</span>
                                        <span className="text-xs font-medium text-secondary">Due: {format(new Date(item.next_maintenance), "MMM d, yyyy")}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredEquipment.length === 0 && (
                            <div className="col-span-full text-center p-12 text-muted-foreground">
                                No equipment found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════ FAULTS ══════════ */}
            {activeTab === 'faults' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* PO Blocker Alert */}
                    <Card className="glass-card border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-800 dark:text-red-400 text-sm">PO Not Yet Issued by Muscat Bay</p>
                                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">Arun Achuthan confirmed on 22 Feb 2026: "We are awaiting the PO to proceed with the work."</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quotation Reference */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="text-sm sm:text-base">BEC Rectification Quotation</CardTitle>
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-fit">AWAITING PO</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            {[
                                ["Quotation Ref", "219580"],
                                ["Submitted by", "Arun Achuthan (BEC)"],
                                ["Date", "13 Jan 2026"],
                                ["Covers", "Spares replacement for 4 faults found during Stage 1 PPM"],
                                ["PO Status", "Not issued"],
                            ].map(([label, value], i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-sm">
                                    <span className="text-slate-400 text-xs sm:w-28 flex-shrink-0">{label}</span>
                                    <span className={cn("font-medium", label === "PO Status" ? "text-red-600 dark:text-red-400 font-bold" : "text-slate-900 dark:text-slate-100")}>{value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Open Faults List */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
                            <CardTitle>Open Faults — Stage 1 PPM (Dec 2025)</CardTitle>
                            <p className="text-[11px] text-slate-400 mt-1">Source: Wali Anwar email 16 Feb 2026, confirmed by Arun Achuthan 22 Feb 2026</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {OPEN_FAULTS.map((f, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.equipment}</p>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{f.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-11 sm:pl-0">
                                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{f.fault}</span>
                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">OPEN</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Villa 33 Note */}
                    <Card className="glass-card border-amber-200 dark:border-amber-800">
                        <CardHeader className="glass-card-header border-b border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="text-sm sm:text-base">Villa 33 — Separate Job (Ref: 215459)</CardTitle>
                                <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200 flex items-center gap-1 w-fit">
                                    <Info className="w-3 h-3" /> UNVERIFIED
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-2 text-sm">
                            <p><span className="text-slate-400 text-xs">Location:</span> <span className="font-medium text-slate-900 dark:text-slate-100">Zone 5 — Villa 33, Muscat Bay Qantab</span></p>
                            <p><span className="text-slate-400 text-xs">Items:</span> <span className="font-medium text-slate-900 dark:text-slate-100">Fire extinguisher, fire blanket, smoke detector</span></p>
                            <p><span className="text-slate-400 text-xs">Quote:</span> <span className="font-medium text-slate-900 dark:text-slate-100">13 Jul 2025 by BEC FA Team (Suneesh.L)</span></p>
                            <p><span className="text-slate-400 text-xs">Approved by:</span> <span className="font-medium text-slate-900 dark:text-slate-100">Abdulrahim AlBalushi — 13 Jul 2025</span></p>
                            <p><span className="text-slate-400 text-xs">PO Status:</span> <span className="font-bold text-red-600 dark:text-red-400">NOT ISSUED</span></p>
                            <p><span className="text-slate-400 text-xs">Reminders:</span> <span className="font-medium text-slate-900 dark:text-slate-100">5 sent by Arun Achuthan (last: Jan 20, 2026)</span></p>
                        </CardContent>
                        <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800">
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                Ref 215459 and reminder details sourced from master database document — not yet cross-verified against individual emails.
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* ══════════ CONTACTS ══════════ */}
            {activeTab === 'contacts' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary" />
                                Quick Contacts — BEC & Muscat Bay
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {CONTACTS.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-xs sm:text-sm font-bold text-primary dark:text-slate-200 flex-shrink-0">
                                            {c.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{c.role}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {c.email && (
                                                <a href={`mailto:${c.email}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                                                </a>
                                            )}
                                            <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                                                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════ CONTRACT INFO ══════════ */}
            {activeTab === 'contract' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Contract Summary */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
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
                                ].map(([label, value], i) => (
                                    <div key={i} className="py-2 border-b border-slate-50 dark:border-slate-700/50">
                                        <p className="text-[10px] uppercase text-slate-400 font-semibold">{label}</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* SLA */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
                            <CardTitle>Response Time SLA</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { p: "P1 Emergency", time: "3 Hours", desc: "Continuous alarm, pump failure, major leak", color: "border-l-red-500 bg-red-50 dark:bg-red-900/20" },
                                    { p: "P2 Urgent", time: "8 Hours", desc: "Minor leak, panel malfunction, abnormal pump noise", color: "border-l-amber-500 bg-amber-50 dark:bg-amber-900/20" },
                                    { p: "P3 Normal", time: "24 Hours", desc: "Extinguisher refilling, general maintenance", color: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20" },
                                    { p: "P4 PPM", time: "Per schedule", desc: "Scheduled preventive maintenance", color: "border-l-slate-400 bg-slate-50 dark:bg-slate-800/50" },
                                ].map((s, i) => (
                                    <div key={i} className={cn("border-l-4 rounded-lg px-4 py-3", s.color)}>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.p}</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{s.time}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipment Under AMC */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
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
                                ].map((eq, i) => (
                                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{eq.value}</p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">{eq.label}</p>
                                        <p className="text-[9px] text-slate-400">{eq.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance */}
                    <Card className="glass-card">
                        <CardHeader className="glass-card-header border-b border-slate-100 dark:border-slate-700">
                            <CardTitle>Insurance Coverage (Contractual)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            {[
                                ["Owner's property (contractor negligence)", "RO 100,000"],
                                ["Third-party property liability", "RO 250,000"],
                                ["Workmen's compensation", "Covered under open policy"],
                            ].map(([coverage, limit], i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{coverage}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">{limit}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
