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
    };
}
