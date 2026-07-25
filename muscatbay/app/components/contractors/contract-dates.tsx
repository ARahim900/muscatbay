"use client";

/**
 * Contract date parsing + expiry reporting.
 *
 * Contract start/end dates arrive as free-text strings from several source
 * sheets, so nothing downstream could compare them to today — an expired
 * contract rendered exactly like a live one. These helpers parse the common
 * formats, and anything unparseable is reported as unparseable rather than
 * silently guessed.
 *
 * Scope note: this is REPORTING on a date that already exists in the database.
 * There is deliberately no assignment, due-date, or close-out behaviour here.
 */

import { differenceInCalendarDays, isValid, parse, parseISO, format } from "date-fns";
import {
    AlertTriangle, CalendarClock, CalendarX2, CheckCircle2, HelpCircle, type LucideIcon,
} from "lucide-react";
import { SeverityChip, type Severity } from "@/components/shared/inspection";
import { cn } from "@/lib/utils";

/**
 * Accepted input formats, most specific first. Day-first ordering is assumed
 * for all-numeric dates (Oman convention) — `03/04/2026` is 3 April 2026.
 */
const DATE_FORMATS = [
    "yyyy-MM-dd",
    "dd/MM/yyyy",
    "d/M/yyyy",
    "dd-MM-yyyy",
    "d-M-yyyy",
    "dd-MMM-yyyy",
    "d-MMM-yyyy",
    "dd MMM yyyy",
    "d MMM yyyy",
    "dd MMMM yyyy",
    "MMM d, yyyy",
    "MMMM d, yyyy",
    "dd.MM.yyyy",
];

/** Parse a contract date string. Returns null when the value cannot be read. */
export function parseContractDate(raw: string | null | undefined): Date | null {
    const value = (raw ?? "").trim();
    if (!value) return null;

    // ISO (with or without a time component) — the common Supabase shape.
    if (/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(value)) {
        const iso = parseISO(value);
        if (isValid(iso)) return iso;
    }

    const reference = new Date();
    for (const fmt of DATE_FORMATS) {
        const parsed = parse(value, fmt, reference);
        if (isValid(parsed)) return parsed;
    }
    return null;
}

/** Whole calendar days from today to `date` (negative = already past). */
export function daysUntil(date: Date, from: Date = new Date()): number {
    return differenceInCalendarDays(date, from);
}

export function formatContractDate(date: Date): string {
    return format(date, "dd MMM yyyy");
}

export interface ExpiryStatus {
    severity: Severity;
    /** Short status word, e.g. "Expired", "Expiring". */
    label: string;
    /** Full sentence, e.g. "Expired 12 days ago". */
    detail: string;
    icon: LucideIcon;
    /** Null when the date could not be parsed. */
    days: number | null;
}

/**
 * Expiry bands. Deliberately coarse and shared by every surface so a contract
 * reads the same in the tracker table, the renewals list and the KPI counts.
 *   expired            → critical
 *   ≤ 30 days          → high
 *   ≤ 90 days          → watch
 *   > 90 days          → good
 *   unparseable/absent → nodata
 */
export const EXPIRY_SOON_DAYS = 30;
export const EXPIRY_HORIZON_DAYS = 90;

export function expiryStatus(raw: string | null | undefined, from: Date = new Date()): ExpiryStatus {
    const date = parseContractDate(raw);
    if (!date) {
        const hasText = Boolean((raw ?? "").trim());
        return {
            severity: "nodata",
            label: hasText ? "Unreadable date" : "No end date",
            detail: hasText
                ? `End date "${(raw ?? "").trim()}" could not be read`
                : "No end date recorded",
            icon: HelpCircle,
            days: null,
        };
    }

    const days = daysUntil(date, from);
    if (days < 0) {
        return {
            severity: "critical",
            label: "Expired",
            detail: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago (${formatContractDate(date)})`,
            icon: CalendarX2,
            days,
        };
    }
    if (days <= EXPIRY_SOON_DAYS) {
        return {
            severity: "high",
            label: "Expiring",
            detail: `Expires in ${days} day${days === 1 ? "" : "s"} (${formatContractDate(date)})`,
            icon: AlertTriangle,
            days,
        };
    }
    if (days <= EXPIRY_HORIZON_DAYS) {
        return {
            severity: "watch",
            label: "Renewal window",
            detail: `Expires in ${days} days (${formatContractDate(date)})`,
            icon: CalendarClock,
            days,
        };
    }
    return {
        severity: "good",
        label: "Active",
        detail: `${days} days remaining (${formatContractDate(date)})`,
        icon: CheckCircle2,
        days,
    };
}

/**
 * Status is never colour-only: icon + word + chip, all three, in both themes.
 */
export function ExpiryBadge({
    raw,
    className,
    showDetail = false,
}: {
    raw: string | null | undefined;
    className?: string;
    showDetail?: boolean;
}) {
    const status = expiryStatus(raw);
    const Icon = status.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5", className)} title={status.detail}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <SeverityChip severity={status.severity} label={status.label} />
            <span className={cn("text-xs text-muted-foreground", showDetail ? "" : "sr-only")}>
                {status.detail}
            </span>
        </span>
    );
}
