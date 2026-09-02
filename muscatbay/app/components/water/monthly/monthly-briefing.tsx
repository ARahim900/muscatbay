"use client";

/**
 * @fileoverview Water → Monthly operational briefing.
 *
 * The same shared `OperationalBriefing` Electricity renders as "Load briefing"
 * and STP as "Plant briefing" — and the Water Daily tab already renders as
 * "Water briefing". Every figure comes from {@link MonthlyBriefingMetrics},
 * which is derived from the live balance; a value that cannot be computed is
 * rendered as an honest "—" with the reason in its description rather than a
 * plausible-looking zero.
 *
 * @module components/water/monthly/monthly-briefing
 */

import { AlertTriangle, CalendarCheck, CalendarX, CheckCircle2, MapPin, Target } from "lucide-react";

import { OperationalBriefing, type OperationalBriefingItem } from "@/components/shared/operational-briefing";
import { fmt, TARGET_LOSS_PCT } from "@/lib/water-monthly-data";
import type { MonthlyBriefingMetrics } from "./briefing-metrics";

/** Join names, saying how many were left out rather than truncating silently. */
function nameList(names: string[], max = 3): string {
    if (names.length <= max) return names.join(", ");
    return `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function lossDescription(m: MonthlyBriefingMetrics): string {
    if (m.lossPct === null) {
        return "No main-bulk (NAMA L1) volume is recorded for this period, so system loss cannot be computed";
    }
    const volume = `${fmt(m.lossM3)} m³`;
    if (m.lossPct < 0) {
        return `${volume} · recorded consumption exceeds recorded supply, so this balance needs checking before it is used`;
    }
    return m.lossPct > TARGET_LOSS_PCT
        ? `${volume} · ${(m.lossPct - TARGET_LOSS_PCT).toFixed(1)} pp above the ${TARGET_LOSS_PCT}% target`
        : `${volume} · within the ${TARGET_LOSS_PCT}% target`;
}

function zoneDescription(m: MonthlyBriefingMetrics): string {
    if (m.zoneCount === 0) return "No zone bulk (L2) volume is recorded for this period";
    const unreadBulk = m.zonesMissingBulk > 0
        ? ` · ${m.zonesMissingBulk} zone bulk ${plural(m.zonesMissingBulk, "meter", "meters")} not read`
        : "";
    return m.zonesAboveTarget > 0
        ? `${nameList(m.zonesAboveTargetNames)}${unreadBulk}`
        : `All ${m.zoneCount} zones within ${TARGET_LOSS_PCT}%${unreadBulk}`;
}

function readingDescription(m: MonthlyBriefingMetrics): string {
    if (m.missingMeters === 0 && m.negativeMeters === 0) {
        return "Every meter reported a usable reading for this period";
    }
    const parts: string[] = [];
    if (m.missingMeters > 0) parts.push(`${m.missingMeters} with no reading`);
    if (m.negativeMeters > 0) parts.push(`${m.negativeMeters} reporting a negative volume`);
    return `${parts.join(" · ")} — unread meters are not counted in the balance, so the loss above may be overstated`;
}

/** Standard Monthly water briefing, using the same component as Electricity and STP. */
export function MonthlyBriefing({
    metrics,
    periodLabel,
}: {
    metrics: MonthlyBriefingMetrics;
    periodLabel: string;
}) {
    const monthsUnread = metrics.monthsWithoutSupply.length;
    const toValidate = metrics.missingMeters + metrics.negativeMeters;

    const items: OperationalBriefingItem[] = [
        {
            icon: Target,
            label: "System loss vs target",
            value: metrics.lossPct === null ? "—" : `${metrics.lossPct.toFixed(1)}%`,
            severity: metrics.lossPct === null
                ? "default"
                : metrics.lossPct < 0
                    ? "warning"
                    : metrics.lossPct > TARGET_LOSS_PCT ? "danger" : "success",
            description: lossDescription(metrics),
        },
        {
            icon: metrics.zoneCount === 0 ? MapPin : metrics.zonesAboveTarget > 0 ? AlertTriangle : CheckCircle2,
            label: "Zones above target",
            value: metrics.zoneCount === 0 ? "No zone data" : `${metrics.zonesAboveTarget} of ${metrics.zoneCount}`,
            severity: metrics.zoneCount === 0
                ? "default"
                : metrics.zonesAboveTarget > 0 ? "danger" : "success",
            description: zoneDescription(metrics),
        },
        {
            icon: monthsUnread > 0 ? CalendarX : CalendarCheck,
            label: "Months without a supply reading",
            value: `${monthsUnread} of ${metrics.monthsChecked}`,
            severity: monthsUnread > 0 ? "warning" : "success",
            description: monthsUnread > 0
                ? `No main-bulk (NAMA L1) reading for ${nameList(metrics.monthsWithoutSupply, 4)}, so ${plural(monthsUnread, "that month carries", "those months carry")} no A1 figure`
                : "Every month loaded for this year has a main-bulk (A1) reading",
        },
        {
            icon: toValidate > 0 ? AlertTriangle : CheckCircle2,
            label: "Readings to validate",
            value: toValidate === 0 ? "None" : `${toValidate} ${plural(toValidate, "meter", "meters")}`,
            severity: metrics.negativeMeters > 0
                ? "danger"
                : metrics.missingMeters > 0 ? "warning" : "success",
            description: readingDescription(metrics),
        },
    ];

    return <OperationalBriefing title="Water briefing" periodLabel={periodLabel} items={items} />;
}
