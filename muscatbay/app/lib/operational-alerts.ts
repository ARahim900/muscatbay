/**
 * @fileoverview Operational alert engine — data-driven alert evaluation.
 *
 * Pure functions that turn the data the app already fetches into the alerts an
 * operator must see. This is the single source of truth for "is anything
 * wrong", shared by the notification feed (topbar bell + mobile Alerts sheet)
 * and the dashboard's Latest Updates — so the alert surfaces can never say
 * "all clear" while a module page is flagging red.
 *
 * Alert classes (the three risk classes the operation tracks):
 *  1. Water loss exceedance   — latest computable month's system loss vs the
 *     TARGET_LOSS_PCT management target, plus critical zones.
 *  2. Contract expiry         — Contractor_Tracker rows past their End Date
 *     while still marked Active, or inside one of the renewal horizons
 *     (90 / 60 / 30 / 7 days) defined in lib/monitoring/config.
 *  3. Critical plant failures — STP: irrigation reuse stopped, recovery below
 *     the operating bands, or the daily log going stale.
 *
 * Every alert carries a stable `id` fingerprint tied to the condition AND its
 * period, so acknowledgements persist until the underlying condition moves
 * (a new month, a new zero-output day, a changed contract set) — at which
 * point a fresh fingerprint re-raises it.
 *
 * All functions are pure and take `now` injected, so they are unit-testable
 * and device-clock discipline stays in one place.
 *
 * @module lib/operational-alerts
 */

import type { WaterMeter } from "@/lib/water-data";
import type { ContractorTracker } from "@/entities/contractor";
import type { STPOperation } from "@/lib/mock-data";
import { buildMonthlyData, computePeriod, MONTHS, TARGET_LOSS_PCT } from "@/lib/water-monthly-data";
// Cadence gates live in one place so the bell and the monitoring reports can
// never disagree about when something is late — see lib/monitoring/config.ts.
import { STP_STALE_DAYS } from "@/lib/monitoring/config";
import { horizonFor } from "@/lib/monitoring/renewals";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Alert severity — matches the notification levels the feed renders. */
export type OperationalAlertLevel = "error" | "warning" | "info";

export interface OperationalAlert {
    /** Stable fingerprint: `<rule>:<period/set>` — drives ack + push dedupe. */
    id: string;
    level: OperationalAlertLevel;
    /** Source module — used for icon/accent and grouping. */
    module: "water" | "contractors" | "stp";
    title: string;
    message: string;
    /** Route the operator should open to act on it. */
    href: string;
}

/** Inputs for a full evaluation pass. All optional — missing data = no alerts from that source. */
export interface OperationalAlertInputs {
    waterMeters?: WaterMeter[] | null;
    contractors?: ContractorTracker[] | null;
    stpOperations?: STPOperation[] | null;
    now: Date;
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const LEVEL_RANK: Record<OperationalAlertLevel, number> = { error: 0, warning: 1, info: 2 };

/** Format a UTC date as `d Mon yyyy` without timezone drift. */
function fmtDateUTC(d: Date): string {
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** UTC midnight for day-difference arithmetic. */
function utcMidnight(d: Date): number {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Parse the date strings the backend actually holds: ISO `yyyy-mm-dd` or the
 * tracker's US `m/d/yyyy`. Returns a UTC-midnight Date, or null when the
 * string is missing/unparseable (rows without dates never alert).
 */
export function parseTrackerDate(s: string | null | undefined): Date | null {
    if (!s) return null;
    const t = s.trim();

    let y = 0, m = 0, day = 0;
    let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
    if (match) {
        y = +match[1]; m = +match[2]; day = +match[3];
    } else {
        match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
        if (!match) return null;
        m = +match[1]; day = +match[2]; y = +match[3];
    }

    const d = new Date(Date.UTC(y, m - 1, day));
    // Reject rolled-over components (e.g. month 13 / day 40)
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== day) return null;
    return d;
}

/** "A, B, C +2 more" — keeps alert messages scannable when the list is long. */
function capList(items: string[], cap = 3): string {
    if (items.length <= cap) return items.join("; ");
    return `${items.slice(0, cap).join("; ")} +${items.length - cap} more`;
}

/* ------------------------------------------------------------------ */
/*  1. Water loss exceedance                                           */
/* ------------------------------------------------------------------ */

/** Zone loss above this % is critical (mirrors `statusFromLoss`'s red band). */
const ZONE_CRITICAL_PCT = 25;

/**
 * Evaluate the latest computable month of the water balance against the
 * management loss target.
 *
 * "Latest computable" = the most recent month whose main bulk (A1) reading
 * exists — a month with no NAMA reading cannot produce a loss figure and is
 * skipped rather than reported as a fake 100% loss.
 */
export function evaluateWaterLossAlerts(meters: WaterMeter[] | null | undefined): OperationalAlert[] {
    if (!meters || meters.length === 0) return [];

    const data = buildMonthlyData(meters);
    const { availableMonths } = data.meta;

    // Walk back from the newest month until the balance is computable (A1 > 0).
    for (let i = availableMonths.length - 1; i >= 0; i--) {
        const key = availableMonths[i]; // "Mon-YY"
        const [mon, yy] = key.split("-");
        const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
        if (monthIndex === -1 || !yy) continue;

        const period = computePeriod(data, `20${yy}`, monthIndex);
        if (period.A1 <= 0) continue;

        const alerts: OperationalAlert[] = [];
        const { lossPct, loss } = period;
        const overTarget = +(lossPct - TARGET_LOSS_PCT).toFixed(1);

        const criticalZones = period.zones.filter((z) => z.lossPct > ZONE_CRITICAL_PCT);
        const zoneNote = criticalZones.length
            ? ` Worst zones: ${capList(criticalZones.map((z) => `${z.name} ${z.lossPct.toFixed(1)}%`))}.`
            : "";

        if (lossPct < 0) {
            alerts.push({
                id: `water-loss-negative:${key}`,
                level: "warning",
                module: "water",
                title: "Water balance negative",
                message: `${key}: consumption exceeds supply (${lossPct.toFixed(1)}%) — check the main bulk meter and reading timing.`,
                href: "/water",
            });
        } else if (lossPct > TARGET_LOSS_PCT) {
            const critical = lossPct > ZONE_CRITICAL_PCT;
            alerts.push({
                id: `water-loss:${key}`,
                level: critical ? "error" : "warning",
                module: "water",
                title: critical ? "Water loss critically above target" : "Water loss above target",
                message: `${key}: system loss is ${lossPct.toFixed(1)}% of supply — ${overTarget} pp above the ${TARGET_LOSS_PCT}% target (${Math.round(loss).toLocaleString("en-GB")} m³).${zoneNote}`,
                href: "/water",
            });
        } else if (criticalZones.length > 0) {
            // System total within target but individual zones critical.
            alerts.push({
                id: `water-zone-loss:${key}`,
                level: "warning",
                module: "water",
                title: "Zone loss critically above target",
                message: `${key}: ${criticalZones.length} zone${criticalZones.length > 1 ? "s" : ""} above ${ZONE_CRITICAL_PCT}% loss — ${capList(criticalZones.map((z) => `${z.name} ${z.lossPct.toFixed(1)}%`))}.`,
                href: "/water",
            });
        }

        return alerts; // evaluated the latest computable month — done
    }

    return [];
}

/* ------------------------------------------------------------------ */
/*  2. Contract expiry                                                 */
/* ------------------------------------------------------------------ */

/**
 * Evaluate the contractor tracker for expiry risk.
 *
 * - End Date in the past while Status still reads Active → error. These are
 *   live service gaps (the register believes the service is running).
 *   Rows already marked Expired are administratively closed — documented
 *   history, not an active alert.
 * - End Date inside a renewal horizon on an active contract → warning, one
 *   alert per horizon.
 *
 * Why per-horizon rather than one 60-day bucket: the alert id is the
 * de-duplication key, and it used to be `contracts-expiring:<contract set>`.
 * That set does not change as a contract counts down, so a contract that
 * entered the window at 59 days produced exactly one notification and then
 * slid silently to 7 days with nothing further raised — the opposite of what
 * a renewal warning is for. Bucketing by `RENEWAL_HORIZON_DAYS` puts the
 * horizon in the fingerprint, so each crossing (90 → 60 → 30 → 7) raises once
 * and only once. `lib/monitoring/renewals.ts` owns the ladder; the register
 * on /monitoring and this feed therefore read the same horizons.
 */
export function evaluateContractAlerts(
    contractors: ContractorTracker[] | null | undefined,
    now: Date,
): OperationalAlert[] {
    if (!contractors || contractors.length === 0) return [];

    const today = utcMidnight(now);
    const expired: { name: string; service: string; end: Date }[] = [];
    /** horizon (days) → contracts that have just crossed into it. */
    const expiring = new Map<number, { name: string; service: string; end: Date; days: number }[]>();

    for (const c of contractors) {
        const status = (c.Status ?? "").toLowerCase();
        if (status.includes("expired")) continue; // administratively closed
        const end = parseTrackerDate(c["End Date"]);
        if (!end) continue;

        const days = Math.floor((end.getTime() - today) / 86_400_000);
        const name = c.Contractor ?? "Unknown contractor";
        const service = c["Service Provided"] ?? "";

        if (days < 0) {
            expired.push({ name, service, end });
            continue;
        }
        const horizon = horizonFor(days);
        if (horizon === null) continue;
        const bucket = expiring.get(horizon);
        if (bucket) bucket.push({ name, service, end, days });
        else expiring.set(horizon, [{ name, service, end, days }]);
    }

    const alerts: OperationalAlert[] = [];

    if (expired.length > 0) {
        expired.sort((a, b) => a.end.getTime() - b.end.getTime());
        const setKey = expired.map((e) => e.name).sort().join("|");
        alerts.push({
            id: `contracts-expired:${setKey}`,
            level: "error",
            module: "contractors",
            title: `${expired.length} contract${expired.length > 1 ? "s" : ""} expired but still marked active`,
            message: `${capList(expired.map((e) => `${e.name} (${e.service}) ended ${fmtDateUTC(e.end)}`))}. Renew or update the register.`,
            href: "/contractors",
        });
    }

    // Tightest horizon first — the most urgent group leads the feed.
    for (const horizon of [...expiring.keys()].sort((a, b) => a - b)) {
        const group = (expiring.get(horizon) ?? []).sort((a, b) => a.days - b.days);
        const setKey = group.map((e) => e.name).sort().join("|");
        alerts.push({
            id: `contracts-expiring-${horizon}:${setKey}`,
            level: "warning",
            module: "contractors",
            title: `${group.length} contract${group.length > 1 ? "s" : ""} expiring within ${horizon} days`,
            message: `${capList(group.map((e) => `${e.name} in ${e.days} day${e.days === 1 ? "" : "s"} (${fmtDateUTC(e.end)})`))}.`,
            href: "/contractors",
        });
    }

    return alerts;
}

/* ------------------------------------------------------------------ */
/*  3. STP critical failures                                           */
/* ------------------------------------------------------------------ */

/** Recovery bands — mirror stp-analytics (EFF_HIGH / EFF_WATCH). */
const STP_RECOVERY_CRITICAL = 80;
const STP_RECOVERY_WATCH = 90;
/** Evaluation window over the most recent logged days. */
const STP_WINDOW_DAYS = 14;

/**
 * Evaluate the STP daily log for critical failures over the last 14 logged
 * days: reuse stopped while sewage arrived, recovery below the operating
 * bands, and a stale log (no rows for 3+ days — monitoring is blind).
 */
export function evaluateSTPAlerts(
    operations: STPOperation[] | null | undefined,
    now: Date,
): OperationalAlert[] {
    if (!operations || operations.length === 0) return [];

    const days = operations
        .map((op) => {
            const date = new Date(op.date);
            return {
                date,
                inlet: Number(op.inlet_sewage) || 0,
                tse: Number(op.tse_for_irrigation) || 0,
            };
        })
        .filter((d) => !Number.isNaN(d.date.getTime()) && d.date.getTime() <= now.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (days.length === 0) return [];

    const alerts: OperationalAlert[] = [];
    const latest = days[days.length - 1];
    const latestIso = latest.date.toISOString().slice(0, 10);
    const window = days.slice(-STP_WINDOW_DAYS);

    // Stale log — the plant may be fine, but nobody can tell.
    const staleDays = Math.floor((utcMidnight(now) - utcMidnight(latest.date)) / 86_400_000);
    if (staleDays > STP_STALE_DAYS) {
        alerts.push({
            id: `stp-stale-log:${latestIso}`,
            level: "warning",
            module: "stp",
            title: "STP daily log is stale",
            message: `No operations logged since ${fmtDateUTC(latest.date)} (${staleDays} days) — plant monitoring is blind until the log resumes.`,
            href: "/stp",
        });
    }

    // Reuse stopped while sewage arrived — treated effluent leaving unused.
    const zeroOutput = window.filter((d) => d.inlet > 0 && d.tse <= 0);
    if (zeroOutput.length > 0) {
        const lastZero = zeroOutput[zeroOutput.length - 1];
        alerts.push({
            id: `stp-zero-output:${lastZero.date.toISOString().slice(0, 10)}`,
            level: "error",
            module: "stp",
            title: "STP irrigation output stopped",
            message: `${zeroOutput.length} of the last ${window.length} logged days had sewage inflow but zero TSE output (last: ${fmtDateUTC(lastZero.date)}) — check TSE pumps, valves and storage.`,
            href: "/stp",
        });
    }

    // Recovery over the window.
    const totalInlet = window.reduce((s, d) => s + d.inlet, 0);
    const totalTse = window.reduce((s, d) => s + d.tse, 0);
    if (totalInlet > 0) {
        const recovery = (totalTse / totalInlet) * 100;
        if (recovery < STP_RECOVERY_CRITICAL) {
            alerts.push({
                id: `stp-low-recovery:${latestIso}`,
                level: "error",
                module: "stp",
                title: "STP recovery critically low",
                message: `TSE recovery is ${recovery.toFixed(1)}% of inlet over the last ${window.length} logged days — below the ${STP_RECOVERY_CRITICAL}% critical band. Inspect the treatment train.`,
                href: "/stp",
            });
        } else if (recovery < STP_RECOVERY_WATCH) {
            alerts.push({
                id: `stp-watch-recovery:${latestIso}`,
                level: "warning",
                module: "stp",
                title: "STP recovery below target",
                message: `TSE recovery is ${recovery.toFixed(1)}% of inlet over the last ${window.length} logged days — under the ${STP_RECOVERY_WATCH}% operating target.`,
                href: "/stp",
            });
        }
    }

    return alerts;
}

/* ------------------------------------------------------------------ */
/*  Combined evaluation                                                */
/* ------------------------------------------------------------------ */

/** Run every rule and return the combined list, most severe first. */
export function evaluateOperationalAlerts(inputs: OperationalAlertInputs): OperationalAlert[] {
    const alerts = [
        ...evaluateWaterLossAlerts(inputs.waterMeters),
        ...evaluateContractAlerts(inputs.contractors, inputs.now),
        ...evaluateSTPAlerts(inputs.stpOperations, inputs.now),
    ];
    return alerts.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}
