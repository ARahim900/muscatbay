/**
 * Coverage arithmetic — turning "expected vs recorded" into a severity.
 *
 * One classifier, used by every section, so a 92%-complete day and a
 * 92%-complete month read the same colour and the same word. The gates live in
 * `./config`; nothing here hardcodes a number.
 *
 * @module lib/monitoring/coverage
 */

import { BLOCKING_METER_ESCALATES, COVERAGE_GATES } from "./config";
import type { CoverageStat, Severity } from "./types";

/**
 * Build a coverage stat.
 *
 * `pct` is `null` when nothing was expected — 0 of 0 is unknown, not complete,
 * and must never be rendered as a reassuring 100%.
 */
export function coverage(expected: number, recorded: number, notApplicable = 0): CoverageStat {
    const safeExpected = Math.max(0, Math.round(expected));
    const safeRecorded = Math.max(0, Math.round(recorded));
    const safeNa = Math.max(0, Math.round(notApplicable));
    const accounted = Math.min(safeExpected, safeRecorded + safeNa);
    return {
        expected: safeExpected,
        recorded: safeRecorded,
        notApplicable: safeNa,
        missing: Math.max(0, safeExpected - accounted),
        pct: safeExpected === 0 ? null : (accounted / safeExpected) * 100,
    };
}

/** Sum coverage stats — used to roll section breakdowns up into a section total. */
export function sumCoverage(stats: CoverageStat[]): CoverageStat {
    return stats.reduce(
        (acc, s) => coverage(
            acc.expected + s.expected,
            acc.recorded + s.recorded,
            acc.notApplicable + s.notApplicable,
        ),
        coverage(0, 0, 0),
    );
}

/**
 * The one coverage classifier.
 *
 * `blockingMissing` escalates straight to critical: losing one villa meter out
 * of 120 dents the percentage, losing the main bulk means the balance cannot be
 * computed at all — a difference a percentage alone cannot express.
 */
export function classifyCoverage(stat: CoverageStat, blockingMissing = 0): Severity {
    if (stat.expected === 0) return "nodata";
    if (BLOCKING_METER_ESCALATES && blockingMissing > 0) return "critical";
    const pct = stat.pct ?? 0;
    if (pct >= 100) return "good";
    if (pct >= COVERAGE_GATES.WATCH_PCT) return "watch";
    if (pct >= COVERAGE_GATES.HIGH_PCT) return "high";
    return "critical";
}

/**
 * Most severe first — the order every monitoring surface sorts, filters and
 * rolls up by.
 *
 * `nodata` sits ABOVE `good` deliberately, mirroring `SEVERITY_RANK` in
 * `components/shared/inspection.tsx`. A section nobody could read is not a
 * healthy one, and rolling "unknown" up as if it were "fine" is precisely the
 * failure this module exists to prevent.
 */
export const SEVERITY_ORDER: Severity[] = ["critical", "high", "watch", "nodata", "good"];

const RANK: Record<Severity, number> = Object.fromEntries(
    SEVERITY_ORDER.map((severity, index) => [severity, index]),
) as Record<Severity, number>;

export function worstSeverity(severities: Severity[]): Severity {
    if (severities.length === 0) return "nodata";
    // Seeded with the first element, not with "nodata": now that unknown
    // outranks healthy, seeding with "nodata" would make every all-good set
    // report as unknown.
    return severities.reduce((worst, s) => (RANK[s] < RANK[worst] ? s : worst), severities[0]);
}

/** Sort helper: most severe first, then by the caller's tiebreak. */
export function bySeverity<T extends { severity: Severity }>(a: T, b: T): number {
    return RANK[a.severity] - RANK[b.severity];
}

/**
 * `92.4%` / `100%` / `—`.
 *
 * Two rules: an unknown never becomes a number, and an incomplete set never
 * rounds up to 100%. `toFixed(1)` would print 99.96% as "100.0%", which is a
 * small lie of exactly the kind this module is built to catch — so anything
 * short of a full house floors to one decimal instead.
 */
export function formatPct(pct: number | null): string {
    if (pct === null) return "—";
    if (pct >= 100) return "100%";
    if (pct <= 0) return "0%";
    return `${(Math.floor(pct * 10) / 10).toFixed(1)}%`;
}

/** `114 of 120 recorded` — the sentence every headline is built from. */
export function formatCoverage(stat: CoverageStat): string {
    if (stat.expected === 0) return "nothing expected";
    const na = stat.notApplicable > 0 ? `, ${stat.notApplicable} recorded as not in service` : "";
    return `${stat.recorded} of ${stat.expected} recorded${na}`;
}
