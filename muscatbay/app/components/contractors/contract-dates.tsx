"use client";

/**
 * Contract expiry reporting — the severity/badge layer.
 *
 * The parsing itself lives in `@/lib/contract-dates`, which is the app's single
 * contract-date parser: this file used to carry a second, day-first one, so the
 * notification bell and this page disagreed about the same contract by up to
 * eleven months — and, because no day-first reading of `12/31/2027` exists,
 * this page rendered "Unreadable date" for most of the register while the bell
 * counted those contracts down correctly. That parser is gone; the register's
 * month-first convention and the evidence for it are documented in the lib
 * module.
 *
 * Scope note: this is REPORTING on a date that already exists in the database.
 * There is deliberately no assignment, due-date, or close-out behaviour here.
 */

import {
    AlertTriangle, CalendarClock, CalendarX2, CheckCircle2, HelpCircle, type LucideIcon,
} from "lucide-react";
import { SeverityChip, type Severity } from "@/components/shared/inspection";
import { daysUntil, formatContractDate, parseContractDate } from "@/lib/contract-dates";
import { cn } from "@/lib/utils";

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
