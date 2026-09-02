/** Pure STP reading validation. Missing evidence always remains null. */

export type STPDataQualityCode =
    | "missing_inlet"
    | "missing_tse"
    | "missing_tanker_trips"
    | "negative_inlet"
    | "negative_tse"
    | "negative_tanker_trips"
    | "tse_exceeds_inlet"
    | "recovery_above_100";

export interface STPDataQualityFinding {
    code: STPDataQualityCode;
    field: "inlet" | "tse" | "tanker_trips" | "recovery";
    message: string;
}

export interface AssessedSTPReadings {
    inlet: number | null;
    tse: number | null;
    tankerTrips: number | null;
    recoveryPct: number | null;
    findings: STPDataQualityFinding[];
    /** Paired inlet/TSE evidence that is physically possible and safe for KPIs. */
    validForRecovery: boolean;
    /** Tanker evidence that is safe to use for income. */
    validForTankerIncome: boolean;
    /** Inlet safe to add to a published total: evidenced and not negative. */
    usableInlet: boolean;
    /**
     * TSE safe to add to a published total: evidenced, not negative, and not
     * above the inlet it supposedly came from. Looser than
     * {@link AssessedSTPReadings.validForRecovery}, which additionally needs a
     * positive inlet to divide by — a day with no inlet reading still has a
     * countable TSE volume, it just has no computable recovery.
     */
    usableTse: boolean;
}

export function nullableFiniteNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
}

export function assessSTPReadings(input: {
    inlet: unknown;
    tse: unknown;
    tankerTrips: unknown;
}): AssessedSTPReadings {
    const inlet = nullableFiniteNumber(input.inlet);
    const tse = nullableFiniteNumber(input.tse);
    const tankerTrips = nullableFiniteNumber(input.tankerTrips);
    const findings: STPDataQualityFinding[] = [];

    if (inlet === null) findings.push({ code: "missing_inlet", field: "inlet", message: "Inlet reading is not evidenced." });
    if (tse === null) findings.push({ code: "missing_tse", field: "tse", message: "TSE reading is not evidenced." });
    if (tankerTrips === null) findings.push({ code: "missing_tanker_trips", field: "tanker_trips", message: "Tanker trips are not evidenced." });
    if (inlet !== null && inlet < 0) findings.push({ code: "negative_inlet", field: "inlet", message: "Inlet cannot be negative." });
    if (tse !== null && tse < 0) findings.push({ code: "negative_tse", field: "tse", message: "TSE output cannot be negative." });
    if (tankerTrips !== null && tankerTrips < 0) findings.push({ code: "negative_tanker_trips", field: "tanker_trips", message: "Tanker trips cannot be negative." });

    const recoveryPct = inlet !== null && tse !== null && inlet > 0
        ? (tse / inlet) * 100
        : null;
    if (inlet !== null && tse !== null && inlet >= 0 && tse > inlet) {
        findings.push({ code: "tse_exceeds_inlet", field: "tse", message: "TSE output exceeds the recorded inlet volume." });
        if (inlet > 0) {
            findings.push({ code: "recovery_above_100", field: "recovery", message: "Calculated recovery exceeds 100%." });
        }
    }

    return {
        inlet,
        tse,
        tankerTrips,
        recoveryPct,
        findings,
        validForRecovery: inlet !== null && tse !== null && inlet > 0 && tse >= 0 && tse <= inlet,
        validForTankerIncome: tankerTrips !== null && tankerTrips >= 0,
        usableInlet: inlet !== null && inlet >= 0,
        usableTse: tse !== null && tse >= 0 && !(inlet !== null && tse > inlet),
    };
}

/* ------------------------------------------------------------------ */
/*  Aggregation                                                        */
/* ------------------------------------------------------------------ */

export interface STPFieldTotal {
    /** Sum of the usable values only; null when none were usable. */
    value: number | null;
    /** Rows that contributed a usable value. */
    evidenced: number;
    /** Rows carrying no reading at all. */
    missing: number;
    /** Rows whose reading was present but physically impossible. */
    excluded: number;
}

export interface STPReadingTotals {
    inlet: STPFieldTotal;
    tse: STPFieldTotal;
    tankerTrips: STPFieldTotal;
    /**
     * Recovery over days where inlet AND TSE are both valid — so it is
     * arithmetically incapable of exceeding 100%. `days` says how many rows
     * backed it, which is what makes the figure auditable.
     */
    recovery: { pct: number | null; inlet: number; tse: number; days: number };
    /** Rows considered. */
    rows: number;
    /** Rows contributing at least one impossible reading to some field. */
    rowsWithImpossibleReadings: number;
}

export interface STPReadingInput {
    inlet: unknown;
    tse: unknown;
    tankerTrips: unknown;
}

/**
 * Sum a set of daily readings, excluding the impossible ones.
 *
 * The point of this function is that every published STP figure comes from one
 * place. The page used to sum raw columns — filtering out nulls but nothing
 * else — so a negative TSE reading subtracted from the headline reuse volume
 * and paid a negative water saving, while Plant Watch, computing from
 * `assessSTPReadings`, excluded that same row. One page, two totals, and the
 * more prominent one was wrong.
 *
 * Excluded rows are counted, never silently dropped: `excluded` is what the
 * page renders as an anomaly badge (CLAUDE.md non-negotiable 1).
 */
export function summariseSTPReadings(rows: STPReadingInput[]): STPReadingTotals {
    const totals: STPReadingTotals = {
        inlet: { value: null, evidenced: 0, missing: 0, excluded: 0 },
        tse: { value: null, evidenced: 0, missing: 0, excluded: 0 },
        tankerTrips: { value: null, evidenced: 0, missing: 0, excluded: 0 },
        recovery: { pct: null, inlet: 0, tse: 0, days: 0 },
        rows: rows.length,
        rowsWithImpossibleReadings: 0,
    };

    const accumulate = (total: STPFieldTotal, value: number | null, usable: boolean) => {
        if (value === null) { total.missing += 1; return; }
        if (!usable) { total.excluded += 1; return; }
        total.value = (total.value ?? 0) + value;
        total.evidenced += 1;
    };

    for (const row of rows) {
        const assessment = assessSTPReadings(row);
        accumulate(totals.inlet, assessment.inlet, assessment.usableInlet);
        accumulate(totals.tse, assessment.tse, assessment.usableTse);
        accumulate(totals.tankerTrips, assessment.tankerTrips, assessment.validForTankerIncome);

        if (assessment.validForRecovery && assessment.inlet !== null && assessment.tse !== null) {
            totals.recovery.inlet += assessment.inlet;
            totals.recovery.tse += assessment.tse;
            totals.recovery.days += 1;
        }
        if (assessment.findings.some((finding) => !finding.code.startsWith("missing_"))) {
            totals.rowsWithImpossibleReadings += 1;
        }
    }

    totals.recovery.pct = totals.recovery.inlet > 0
        ? (totals.recovery.tse / totals.recovery.inlet) * 100
        : null;

    return totals;
}
