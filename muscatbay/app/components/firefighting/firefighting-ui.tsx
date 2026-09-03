"use client";

/**
 * @fileoverview Fire-safety module — shared presentational pieces.
 *
 * Badges, status→token class maps and small helpers used by the page and by
 * the Equipment / Issues registers. Colour values are Tailwind token classes
 * only (`--mb-*` / `--status-*` / brand) — never raw hex.
 *
 * @module components/firefighting/firefighting-ui
 */

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    CheckCircle, Calendar, Clock, XCircle, AlertTriangle, MapPin,
    type LucideIcon,
} from "lucide-react";
import { ZONE_BY_KEY, type Cycle, type PpmStatus, type ZoneKey } from "./ppm-programme";

/** Shared card title style (text-sm semibold, icon + label) — matches HVAC. */
export const CARD_TITLE = "text-sm font-semibold text-foreground flex items-center gap-2";

export const CHART_TOOLTIP_STYLE = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
    fontSize: "12px",
} as const;

export const STATUS_CFG: Record<PpmStatus, { label: string; icon: LucideIcon; cls: string; dot: string }> = {
    done: { label: "Completed", icon: CheckCircle, cls: "bg-mb-success-light text-mb-success-text", dot: "bg-[var(--status-normal)]" },
    scheduled: { label: "Scheduled", icon: Calendar, cls: "bg-primary/10 text-primary dark:text-muted-foreground/80", dot: "bg-primary" },
    upcoming: { label: "Upcoming", icon: Clock, cls: "bg-muted-bg text-muted-foreground", dot: "bg-border dark:bg-muted-foreground" },
    fault: { label: "Fault", icon: XCircle, cls: "bg-mb-danger-light text-mb-danger-text", dot: "bg-[var(--status-danger)]" },
    no_access: { label: "No Access", icon: AlertTriangle, cls: "bg-mb-warning-light text-mb-warning-text", dot: "bg-[var(--status-warning)]" },
};

export const ZONE_TAG: Record<ZoneKey, string> = {
    zone1: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-muted-foreground/80",
    zone3: "bg-secondary/15 text-secondary",
    zone5: "bg-mb-info-light text-mb-info-text",
    vs: "bg-mb-stale-light text-mb-stale-text",
};

export const SYSTEM_TAG: Record<string, string> = {
    FA: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-muted-foreground/80",
    FF: "bg-mb-danger-light text-mb-danger-text",
    FE: "bg-mb-warning-light text-mb-warning-text",
    "Hose Reel": "bg-secondary/15 text-secondary",
    Hydrants: "bg-mb-info-light text-mb-info-text",
};

export const EQUIP_STATUS_CLS: Record<string, string> = {
    Operational: "bg-mb-success-light text-mb-success-text",
    "Needs Attention": "bg-mb-warning-light text-mb-warning-text",
    "Maintenance Due": "bg-primary/10 text-primary dark:text-muted-foreground/80",
    Expired: "bg-mb-danger-light text-mb-danger-text",
};

/**
 * Equipment-status → donut slice fill.
 *
 * These are CSS custom properties, not hex: SVG `fill` resolves `var()` in
 * every browser we target, so the chart follows a theme change instead of
 * freezing the light-theme palette into the markup.
 */
export const EQUIP_STATUS_CHART_COLORS: Record<string, string> = {
    Operational: "var(--mb-success)",
    "Needs Attention": "var(--mb-warning)",
    "Maintenance Due": "var(--primary)",
    Expired: "var(--mb-danger)",
};

export function issueStatusCls(status: string): string {
    const s = status.toLowerCase();
    if (s.includes("resolved")) return "bg-mb-success-light text-mb-success-text";
    if (s.includes("progress") || s.includes("ordered") || s.includes("issued")) return "bg-primary/10 text-primary dark:text-muted-foreground/80";
    if (s.includes("flag")) return "bg-mb-danger-light text-mb-danger-text";
    return "bg-mb-warning-light text-mb-warning-text";
}

export function fmtDate(s: string | null | undefined): string {
    if (!s) return "—";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : format(d, "dd MMM yyyy");
}

/** Map the equipment register's free-text zone to a designated-zone key. */
export function equipZoneKey(zone: string): ZoneKey | null {
    const z = zone?.toLowerCase() ?? "";
    if (z.includes("village")) return "vs";
    if (z.includes("1")) return "zone1";
    if (z.includes("3")) return "zone3";
    if (z.includes("5")) return "zone5";
    return null;
}

export function ZoneBadge({ zone, withScope = false }: { zone: ZoneKey; withScope?: boolean }) {
    const z = ZONE_BY_KEY[zone];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap", ZONE_TAG[zone])}>
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {withScope ? z.label : z.short}
            {!withScope && <span className="sr-only"> — {z.label}</span>}
        </span>
    );
}

export function CycleBadge({ cycle }: { cycle: Cycle }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted-bg text-foreground dark:text-muted-foreground/80 whitespace-nowrap">
            <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{cycle}</span>
            Cycle {cycle}
        </span>
    );
}

export function PpmStatusBadge({ status }: { status: PpmStatus }) {
    const cfg = STATUS_CFG[status];
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", cfg.cls)}>
            <Icon className="w-3 h-3" aria-hidden="true" />
            {cfg.label}
        </span>
    );
}

export function SystemTag({ label }: { label: string }) {
    return (
        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide", SYSTEM_TAG[label] || "bg-muted-bg text-muted-foreground")}>
            {label}
        </span>
    );
}

/** Section heading shared by the Overview registers (icon + title + count + blurb). */
export function SectionHeading({
    icon: Icon, title, count, description, action,
}: {
    icon: LucideIcon;
    title: string;
    count?: number;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-secondary" aria-hidden="true" />
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    {count != null && <span className="text-xs text-muted-foreground tabular-nums">· {count}</span>}
                </div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            {action}
        </div>
    );
}

/**
 * "This is transcribed contract paperwork, not a live reading" marker.
 * Every section fed by `contract-reference.ts` carries one.
 */
export function ReferenceChip({ asOf }: { asOf: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-muted-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Contract reference · as of {asOf}
        </span>
    );
}
