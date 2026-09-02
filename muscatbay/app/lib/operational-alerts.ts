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
 *  2. Contract expiry         — Contractor_Tracker rows past (or within 60
 *     days of) their End Date while still marked Active.
 *  3. Critical plant failures — STP: irrigation reuse stopped, recovery below
 *     the operating bands, or the daily log going stale.
 *
 * FINGERPRINT POLICY — an `id` names the CONDITION, never its severity and
 * never the day it was last seen. `operational_alert_incidents` opens one
 * episode per fingerprint, so anything that moves while a fault persists
 * (the last zero-output date, the recovery band, the membership of a set of
 * expired contracts) would silently close the acknowledged episode and open a
 * fresh un-acknowledged one every evaluation pass. Concretely:
 *
 *  - Level is a COLUMN, not part of the key. `stp-recovery-below-target` moves
 *    between warning and error in place; it does not become a different alert.
 *  - Rolling "last occurrence" dates belong in the message, not the id.
 *  - A set of affected records is one incident PER RECORD, keyed by that
 *    record's own stable identity (`amc_register.agreement_id`), so renewing
 *    one contract resolves one incident and leaves the rest untouched.
 *  - A genuinely new reporting period IS a new incident: the water rules stay
 *    keyed by month (`water-loss:Mar-26`), because March's exceedance is not
 *    April's and each is acknowledged on its own.
 *
 * A cleared condition is resolved by the server-side reconciler; if it returns
 * later, a new episode opens against the same fingerprint. That is the only
 * mechanism that should ever re-raise an alert.
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
import { STP_THRESHOLDS } from "@/lib/thresholds";
import { assessSTPReadings, type AssessedSTPReadings } from "@/lib/stp-data-quality";
import type { ContractDateReconciliation, ReconciledContractDates } from "@/lib/contract-reconciliation";

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
    /** Keeps evidence faults separate from genuine operating-performance alerts. */
    category: "data_quality" | "process_performance" | "contract_compliance" | "water_balance";
    title: string;
    message: string;
    /** Route the operator should open to act on it. */
    href: string;
}

/** Inputs for a full evaluation pass. All optional — missing data = no alerts from that source. */
export interface OperationalAlertInputs {
    waterMeters?: WaterMeter[] | null;
    contractors?: ContractorTracker[] | null;
    contractDateReconciliation?: ContractDateReconciliation | null;
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
                category: "water_balance",
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
                category: "water_balance",
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
                category: "water_balance",
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

/** Contracts within this many days of their End Date raise a heads-up. */
const CONTRACT_WARN_DAYS = 60;

/**
 * The register's own key for an agreement.
 *
 * A joined set of contractor NAMES used to be the fingerprint, which meant the
 * eleventh contract expiring re-keyed the incident covering the other ten and
 * discarded every acknowledgement on it. `amc_register.agreement_id` is the
 * register's primary key and is what an incident must hang on.
 *
 * The legacy `Contractor_Tracker` snapshot carries no such column, so those
 * rows fall back to contractor + service. That pair is stable while the
 * register text is, and unlike a set key it is unaffected by other rows —
 * but it is not durable across a rename, which is why a source that cannot
 * supply agreement IDs is denied resolution authority in
 * {@link evaluateOperationalAlertsWithCoverage}.
 */
export function contractIncidentKey(contract: ContractorTracker): string {
    const agreementId = contract.agreement_id?.trim();
    if (agreementId) return agreementId;
    const name = (contract.Contractor ?? "unknown-contractor").trim().toLowerCase();
    const service = (contract["Service Provided"] ?? "unspecified-service").trim().toLowerCase();
    return `name:${name}|${service}`;
}

/**
 * Evaluate the contractor register for expiry risk — ONE incident per
 * agreement, not one per set.
 *
 * - End Date in the past while Status still reads Active → error. These are
 *   live service gaps (the register believes the service is running).
 *   Rows already marked Expired are administratively closed — documented
 *   history, not an active alert.
 * - End Date within the next 60 days on an active contract → warning.
 *
 * Both states share the fingerprint `contract-expiry:<agreement>`: a contract
 * crossing its End Date is the SAME incident escalating from warning to error,
 * so an operator who acknowledged the 12-days-out warning does not get handed
 * a fresh un-acknowledged alert the morning it lapses. Renewing one agreement
 * resolves that agreement's incident and nothing else.
 */
export function evaluateContractAlerts(
    contractors: ContractorTracker[] | null | undefined,
    now: Date,
): OperationalAlert[] {
    if (!contractors || contractors.length === 0) return [];

    const today = utcMidnight(now);
    // Longest-expired first, then soonest to expire — `days` sorts both in one
    // pass and is dropped before the alerts leave this function.
    const ranked: Array<{ days: number; alert: OperationalAlert }> = [];

    for (const c of contractors) {
        const status = (c.Status ?? "").toLowerCase();
        if (status.includes("expired")) continue; // administratively closed
        const end = parseTrackerDate(c["End Date"]);
        if (!end) continue;

        const days = Math.floor((end.getTime() - today) / 86_400_000);
        if (days > CONTRACT_WARN_DAYS) continue;

        const name = c.Contractor ?? "Unknown contractor";
        const service = c["Service Provided"] ?? "";
        const serviceNote = service ? ` (${service})` : "";
        const expired = days < 0;

        ranked.push({
            days,
            alert: {
                id: `contract-expiry:${contractIncidentKey(c)}`,
                level: expired ? "error" : "warning",
                module: "contractors",
                category: "contract_compliance",
                title: expired
                    ? `Contract expired but still marked active — ${name}`
                    : `Contract expiring within ${CONTRACT_WARN_DAYS} days — ${name}`,
                message: expired
                    ? `${name}${serviceNote} ended ${fmtDateUTC(end)} (${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago) and the register still shows it active. Renew or update the register.`
                    : `${name}${serviceNote} ends ${fmtDateUTC(end)} — ${days} day${days === 1 ? "" : "s"} away.`,
                href: "/contractors",
            },
        });
    }

    return ranked.sort((a, b) => a.days - b.days).map((entry) => entry.alert);
}

/**
 * The stable identity for a reconciled contract.
 *
 * Prefer the AMC register's agreement ID over the contract reference string:
 * the reference is free text that a re-keyed register can restate, while the
 * agreement ID is the row's primary key.
 */
function contractDateIncidentKey(contract: ReconciledContractDates): string {
    const registerEvidence = contract.evidence.find((item) => item.source === "amc_register");
    return registerEvidence?.recordId?.trim() || contract.contractRef;
}

/** Surface source disagreement without selecting or overwriting either date. */
export function evaluateContractDateConflictAlerts(
    reconciliation: ContractDateReconciliation | null | undefined,
): OperationalAlert[] {
    if (!reconciliation) return [];
    return reconciliation.contracts
        .filter((contract) => contract.conflictFields.length > 0)
        .map((contract) => {
            const sourceDates = contract.evidence.map((item) =>
                `${item.source}: ${item.startDate ?? "start not evidenced"} to ${item.endDate ?? "end not evidenced"}`,
            );
            return {
                id: `contract-date-conflict:${contractDateIncidentKey(contract)}`,
                level: "warning" as const,
                module: "contractors" as const,
                category: "contract_compliance" as const,
                title: `Contract dates conflict — ${contract.contractRef}`,
                message: `${contract.conflictFields.join(" and ")} disagree across registers. ${capList(sourceDates)}. Verify the signed agreement/addendum; no date was overwritten.`,
                href: "/contractors",
            };
        });
}

/* ------------------------------------------------------------------ */
/*  3. STP critical failures                                           */
/* ------------------------------------------------------------------ */

/** Evaluation window over the most recent logged days. */
const STP_WINDOW_DAYS = 14;
/** Daily log older than this many days = the data pipeline itself failed. */
const STP_STALE_DAYS = 3;

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
            const assessment = assessSTPReadings({
                inlet: op.inlet_sewage,
                tse: op.tse_for_irrigation,
                tankerTrips: op.tanker_trips,
            });
            return {
                date,
                assessment,
            };
        })
        .filter((d) => !Number.isNaN(d.date.getTime()) && d.date.getTime() <= now.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (days.length === 0) return [];

    const alerts: OperationalAlert[] = [];
    const latest = days[days.length - 1];
    const window = days.slice(-STP_WINDOW_DAYS);

    // Stale log — the plant may be fine, but nobody can tell.
    const staleDays = Math.floor((utcMidnight(now) - utcMidnight(latest.date)) / 86_400_000);
    if (staleDays > STP_STALE_DAYS) {
        alerts.push({
            id: "stp-stale-log",
            level: "warning",
            module: "stp",
            category: "data_quality",
            title: "STP daily log is stale",
            message: `No operations logged since ${fmtDateUTC(latest.date)} (${staleDays} days) — plant monitoring is blind until the log resumes.`,
            href: "/stp",
        });
    }

    const qualityDays = window.filter((d) => d.assessment.findings.length > 0);
    const missingDays = qualityDays.filter((d) => d.assessment.findings.some((f) => f.code.startsWith("missing_")));
    const impossibleDays = qualityDays.filter((d) => d.assessment.findings.some((f) =>
        f.code === "negative_inlet" || f.code === "negative_tse" ||
        f.code === "negative_tanker_trips" || f.code === "tse_exceeds_inlet",
    ));

    if (missingDays.length > 0) {
        const lastMissing = missingDays[missingDays.length - 1];
        alerts.push({
            id: "stp-missing-readings",
            level: "warning",
            module: "stp",
            category: "data_quality",
            title: "STP readings not evidenced",
            message: `${missingDays.length} of the last ${window.length} logged days contain missing inlet, TSE or tanker evidence (most recent: ${fmtDateUTC(lastMissing.date)}). Missing values remain blank and are excluded from KPIs.`,
            href: "/stp",
        });
    }

    if (impossibleDays.length > 0) {
        const lastImpossible = impossibleDays[impossibleDays.length - 1];
        const hasExcessTse = impossibleDays.some((d) => d.assessment.findings.some((f) => f.code === "tse_exceeds_inlet"));
        alerts.push({
            id: "stp-impossible-readings",
            level: "error",
            module: "stp",
            category: "data_quality",
            title: "STP data-quality failure",
            message: `${impossibleDays.length} of the last ${window.length} logged days contain physically impossible readings${hasExcessTse ? ", including TSE output above inlet (>100% recovery)" : ""} (most recent: ${fmtDateUTC(lastImpossible.date)}). These rows are excluded from recovery and economic impact.`,
            href: "/stp",
        });
    }

    // Reuse stopped while sewage arrives. Missing/negative readings are data
    // quality findings above and never masquerade as a process outage.
    const zeroOutput = window.filter((d) =>
        d.assessment.inlet !== null && d.assessment.inlet > 0 && d.assessment.tse === 0,
    );
    if (zeroOutput.length > 0) {
        const lastZero = zeroOutput[zeroOutput.length - 1];
        alerts.push({
            id: "stp-zero-output",
            level: "error",
            module: "stp",
            category: "process_performance",
            title: "STP irrigation output stopped",
            message: `${zeroOutput.length} of the last ${window.length} logged days had sewage inflow but zero TSE output (last: ${fmtDateUTC(lastZero.date)}) — check TSE pumps, valves and storage.`,
            href: "/stp",
        });
    }

    // Recovery over the window.
    const validRecovery = window
        .map((d) => d.assessment)
        .filter((assessment): assessment is AssessedSTPReadings & { inlet: number; tse: number } =>
            assessment.validForRecovery && assessment.inlet !== null && assessment.tse !== null,
        );
    const totalInlet = validRecovery.reduce((s, d) => s + d.inlet, 0);
    const totalTse = validRecovery.reduce((s, d) => s + d.tse, 0);
    if (totalInlet > 0) {
        const recovery = (totalTse / totalInlet) * 100;
        // One rule, two bands. Recovery drifting across the critical/watch
        // boundary is the SAME under-performing plant, so the incident is
        // re-levelled in place rather than closed and re-opened un-acknowledged.
        if (recovery < STP_THRESHOLDS.RECOVERY_WATCH) {
            const critical = recovery < STP_THRESHOLDS.RECOVERY_CRITICAL;
            alerts.push({
                id: "stp-recovery-below-target",
                level: critical ? "error" : "warning",
                module: "stp",
                category: "process_performance",
                title: critical ? "STP recovery critically low" : "STP recovery below target",
                message: critical
                    ? `TSE recovery is ${recovery.toFixed(1)}% of inlet across ${validRecovery.length} valid days — below the ${STP_THRESHOLDS.RECOVERY_CRITICAL}% critical band. Inspect the treatment train.`
                    : `TSE recovery is ${recovery.toFixed(1)}% of inlet across ${validRecovery.length} valid days — under the ${STP_THRESHOLDS.RECOVERY_WATCH}% operating target.`,
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
        ...evaluateContractDateConflictAlerts(inputs.contractDateReconciliation),
        ...evaluateSTPAlerts(inputs.stpOperations, inputs.now),
    ];
    return alerts.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

/* ------------------------------------------------------------------ */
/*  Evidence coverage — who may close an incident                      */
/* ------------------------------------------------------------------ */

export type OperationalAlertModule = OperationalAlert["module"];

export interface OperationalAlertEvaluation {
    /** Every condition detected this pass. Always persisted. */
    alerts: OperationalAlert[];
    /** Modules whose source was readable — every alert belongs to one of these. */
    evaluatedModules: OperationalAlertModule[];
    /**
     * Subset of {@link evaluatedModules} whose evidence was complete enough that
     * the ABSENCE of an alert is a real observation. Only these may auto-resolve
     * open incidents.
     */
    resolvableModules: OperationalAlertModule[];
    /** Read modules denied resolution authority, and why. */
    withheldResolution: Partial<Record<OperationalAlertModule, string>>;
}

/**
 * Did every meter report the month the water balance was computed from?
 *
 * A meter with the month key absent is exactly as unevidenced as one holding
 * an explicit null — the earlier check only caught the null, so a month where
 * half the register had no column at all still counted as a complete read and
 * could close an open loss incident.
 */
function unevidencedWaterMeters(meters: WaterMeter[], monthKey: string): number {
    return meters.filter((meter) => {
        const value = meter.consumption?.[monthKey];
        return value === undefined || value === null || !Number.isFinite(value);
    }).length;
}

/** The most recent month with a computable balance (main bulk > 0), if any. */
function latestComputableWaterMonth(meters: WaterMeter[]): string | null {
    const data = buildMonthlyData(meters);
    const { availableMonths } = data.meta;
    for (let i = availableMonths.length - 1; i >= 0; i--) {
        const key = availableMonths[i];
        const [mon, yy] = key.split("-");
        const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
        if (monthIndex === -1 || !yy) continue;
        if (computePeriod(data, `20${yy}`, monthIndex).A1 > 0) return key;
    }
    return null;
}

/**
 * Run every rule AND report which modules earned the right to close incidents.
 *
 * The reconciler resolves an open incident when its condition is absent from a
 * fresh evaluation. That inference is only sound when the module was actually
 * evaluated on complete evidence: a register that returned rows with no dates,
 * or an STP log missing half its readings, produces FEWER alerts, not fewer
 * faults. Treating that as "condition cleared" is how a critical incident
 * disappears without anyone fixing anything.
 *
 * So evidence gaps downgrade a module from resolvable to read-only. Detected
 * alerts are still returned in full and still persisted — incomplete evidence
 * withholds the authority to CLOSE, never the duty to RAISE.
 */
export function evaluateOperationalAlertsWithCoverage(
    inputs: OperationalAlertInputs,
): OperationalAlertEvaluation {
    const evaluatedModules: OperationalAlertModule[] = [];
    const resolvableModules: OperationalAlertModule[] = [];
    const withheldResolution: Partial<Record<OperationalAlertModule, string>> = {};

    const record = (module: OperationalAlertModule, reason: string | null) => {
        evaluatedModules.push(module);
        if (reason === null) resolvableModules.push(module);
        else withheldResolution[module] = reason;
    };

    // ── water ────────────────────────────────────────────────────────────
    const meters = inputs.waterMeters;
    if (meters && meters.length > 0) {
        const monthKey = latestComputableWaterMonth(meters);
        if (monthKey === null) {
            record("water", "No month has a main-bulk reading, so no balance was computed.");
        } else {
            const unevidenced = unevidencedWaterMeters(meters, monthKey);
            record("water", unevidenced === 0
                ? null
                : `${unevidenced} of ${meters.length} meters have no ${monthKey} reading.`);
        }
    }

    // ── contractors ──────────────────────────────────────────────────────
    const contractors = inputs.contractors;
    if (contractors && contractors.length > 0) {
        const withoutAgreementId = contractors.filter((c) => !c.agreement_id?.trim()).length;
        const undatedActive = contractors.filter((c) =>
            !(c.Status ?? "").toLowerCase().includes("expired") && parseTrackerDate(c["End Date"]) === null,
        ).length;

        if (withoutAgreementId > 0) {
            record("contractors", `${withoutAgreementId} of ${contractors.length} rows carry no agreement ID, so incidents are not durably keyed.`);
        } else if (undatedActive > 0) {
            record("contractors", `${undatedActive} active rows have no parseable End Date, so their expiry was never evaluated.`);
        } else if (!inputs.contractDateReconciliation) {
            record("contractors", "Contract date reconciliation was unavailable, so conflict incidents were not evaluated.");
        } else {
            record("contractors", null);
        }
    }

    // ── stp ──────────────────────────────────────────────────────────────
    const operations = inputs.stpOperations;
    if (operations && operations.length > 0) {
        const window = operations
            .map((op) => ({ op, time: new Date(op.date).getTime() }))
            .filter((row) => !Number.isNaN(row.time) && row.time <= inputs.now.getTime())
            .sort((a, b) => a.time - b.time)
            .slice(-STP_WINDOW_DAYS);
        const incomplete = window.filter(({ op }) => assessSTPReadings({
            inlet: op.inlet_sewage,
            tse: op.tse_for_irrigation,
            tankerTrips: op.tanker_trips,
        }).findings.some((finding) => finding.code.startsWith("missing_"))).length;

        if (window.length === 0) {
            record("stp", "No logged day falls on or before the evaluation time.");
        } else {
            record("stp", incomplete === 0
                ? null
                : `${incomplete} of the last ${window.length} logged days are missing a reading.`);
        }
    }

    return {
        alerts: evaluateOperationalAlerts(inputs),
        evaluatedModules,
        resolvableModules,
        withheldResolution,
    };
}
