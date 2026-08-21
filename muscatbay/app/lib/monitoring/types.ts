/**
 * Monitoring types — the vocabulary the daily / monthly / renewal monitor
 * speaks in.
 *
 * Two rules shape every type in this file, and both come straight from the
 * project's non-negotiables:
 *
 *  1. **Missing is not zero, and unknown is not healthy.** Every count that can
 *     be undefined is `number | null`, and every percentage is `number | null`
 *     so that "0 of 0 expected" reports as `—` instead of a reassuring 100%.
 *     A source that failed to load is `SourceState.error`, never an empty
 *     result that reads as "nothing wrong".
 *
 *  2. **Identification, not resolution.** A {@link MonitoringFinding} carries
 *     what was observed, which data points it concerns, and what an operator
 *     should go and check. It deliberately has **no** owner, status, due date,
 *     assignee or close-out field — the app surfaces findings, the floor
 *     actions them. Do not add those fields.
 *
 * The `confirmed` / `recommendation` split is load-bearing: `confirmed` is a
 * statement of fact derived from the data (it quotes the figures), while
 * `recommendation` is the suggested next check. UI must render them as
 * distinct things so an operator is never left guessing which is which.
 *
 * @module lib/monitoring/types
 */

import type { ThresholdSeverity } from "@/lib/thresholds";

/**
 * The app-wide severity vocabulary, taken from `lib/thresholds.ts` rather than
 * from `components/shared/inspection.tsx`. The two unions are identical by
 * construction; importing the pure-logic one keeps this module free of any UI
 * dependency, which matters because `lib/` is bundled as-is by the Expo app in
 * `mobile/`. `SeverityChip` and `HealthCard` accept these values unchanged.
 */
export type Severity = ThresholdSeverity;

// ─── Sources ──────────────────────────────────────────────────────────────────

/**
 * Why a source is or isn't usable this pass.
 *
 * `empty` and `error` are deliberately different: a table that legitimately has
 * no rows for the period is a reportable fact, a table that failed to load is
 * a blind spot. Collapsing the two is exactly how a broken read becomes an
 * "all clear".
 */
export type SourceState = "ok" | "empty" | "error" | "not-configured";

export interface SourceStatus {
    key: string;
    label: string;
    state: SourceState;
    /** Failure reason or the emptiness note — shown verbatim to the operator. */
    message?: string;
    /** Rows actually read (null when the read failed). */
    rows: number | null;
}

// ─── Findings ─────────────────────────────────────────────────────────────────

/**
 * What kind of gap this is.
 *  - `missing`     — an entry the register expects for the period is absent.
 *  - `integrity`   — an entry exists but cannot be true (negative volume,
 *                    future-dated row, duplicate, ambiguous date).
 *  - `cross-check` — two sources disagree about the same period, e.g. the STP
 *                    log landed for a day whose water meters did not.
 *  - `renewal`     — a contract end date has passed or is inside a horizon.
 *  - `provenance`  — figures are real but not the official record yet (a month
 *                    shown as month-to-date daily sums, not billing reads).
 */
export type MonitoringKind = "missing" | "integrity" | "cross-check" | "renewal" | "provenance";

/** One affected data point, addressable enough for an operator to go find it. */
export interface AffectedRef {
    /** What it is — "Zone 3A bulk", "18 Aug 2026", "Gulf Expert". */
    label: string;
    /** How the database identifies it — an account number, an ISO date, a name. */
    id: string;
    kind: "meter" | "day" | "month" | "contract" | "row";
}

export interface MonitoringFinding {
    /**
     * Stable fingerprint: `<rule>:<period>:<subject>`. Ties a finding to its
     * condition AND its period, so it re-raises when the period moves and can
     * be de-duplicated across report runs.
     */
    id: string;
    kind: MonitoringKind;
    severity: Severity;
    /** Section it belongs to — "Water — Daily", "Electricity — Monthly", … */
    section: string;
    /** Period the finding covers: an ISO date, a `Mon-YY` key, or a span. */
    period: string;
    /** Statement of the observed fact, quoting the figures. Never speculative. */
    confirmed: string;
    /** The data points it concerns. Empty only for whole-section findings. */
    affected: AffectedRef[];
    /** What to go and check. Identification only — never a work order. */
    recommendation: string;
    /** Where in the app to look. */
    href: string;
}

// ─── Coverage ─────────────────────────────────────────────────────────────────

/**
 * How much of what was expected actually got recorded.
 *
 * `pct` is `null` when `expected === 0`. A section with nothing expected is
 * unknown, not perfect, and must never render as 100%.
 */
export interface CoverageStat {
    expected: number;
    recorded: number;
    missing: number;
    /**
     * Entries explicitly recorded as not applicable — an electricity meter with
     * a NULL consumption row means "closed / not in service" for that month,
     * which is an answer, not a gap. Counted separately so neither side lies.
     */
    notApplicable: number;
    /** Recorded ÷ expected, 0–100. `null` when nothing was expected. */
    pct: number | null;
}

/** One row of a section's period-by-period or group-by-group breakdown. */
export interface CoverageBreakdownRow {
    key: string;
    label: string;
    severity: Severity;
    coverage: CoverageStat;
    /** Short note explaining an unusual state ("not yet due", "no rows for month"). */
    note?: string;
}

/** A monitored section's result for one report. */
export interface ReportSection {
    key: string;
    title: string;
    /** Route the section reports on. */
    href: string;
    severity: Severity;
    coverage: CoverageStat;
    /** One line an operator can read without opening anything. */
    headline: string;
    breakdown: CoverageBreakdownRow[];
    /** The live gate sentence that produced the severity. */
    gateNote?: string;
    /** Set when the section could not be assessed at all (source down / not due). */
    unavailable?: string;
    /**
     * Keep this section out of the report's headline completeness figure.
     *
     * Set on sections whose `coverage` counts something other than "entries
     * recorded this period" — the renewal ladder counts contracts whose end
     * date is readable. Averaging 14 contracts against 840 meter-days would
     * produce a number that is arithmetically fine and operationally
     * meaningless.
     */
    excludeFromCompleteness?: boolean;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportKind = "daily" | "monthly";

export interface MonitoringReport {
    kind: ReportKind;
    /** Human-readable period, e.g. "12 – 18 Aug 2026" or "July 2026". */
    periodLabel: string;
    /** ISO timestamp of the evaluation. */
    generatedAt: string;
    sections: ReportSection[];
    findings: MonitoringFinding[];
    sources: SourceStatus[];
    /**
     * What THIS report does not assess, listed by name so it never implies
     * coverage it does not have — silence about a module would read as "that
     * one is fine". Two kinds of entry, each carrying its own reason: modules
     * with no periodic-entry contract anywhere, and obligations assessed on
     * the other report kind (electricity is monthly, the STP log is daily).
     * Built by `unmonitoredFor()` in `./report`.
     */
    unmonitored: string[];
    /**
     * Recorded share across every assessable section. `null` when no section
     * could be assessed — the honest answer when every source is down.
     */
    completeness: number | null;
    /** True when at least one source failed to load, so the report is partial. */
    partial: boolean;
}
