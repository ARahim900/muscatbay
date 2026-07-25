/**
 * Inspection thresholds — the SINGLE source of truth for "what counts as an
 * anomaly" in the Electricity and STP modules.
 *
 * Why this file exists
 * --------------------
 * The same question ("is this reading abnormal?") used to be answered by four
 * different, independently-drifting threshold sets in Electricity (Load Watch,
 * the category heatmap, the Meters table) and three in STP (Plant Watch, the
 * page's toast alerts, lib/operational-alerts.ts). The result was a meter at
 * 2.5x its baseline reading "Critical" on one surface and "High" on the surface
 * directly below it. Every severity decision in both modules now derives from
 * the constants here, and every surface labels the gate that fired it.
 *
 * Contract
 * --------
 *  - Ratio gates are always expressed against the subject's OWN baseline (a
 *    meter's mean positive read, a plant's median daily inlet), never against a
 *    nameplate figure we do not have.
 *  - The STP recovery bands intentionally MIRROR the published constants in
 *    lib/operational-alerts.ts (STP_RECOVERY_CRITICAL = 80, STP_RECOVERY_WATCH
 *    = 90). That module owns the dashboard-wide alert feed; if its bands move,
 *    move these to match — do not let them drift apart again.
 *  - `describe*` helpers exist so the UI can print the live numbers instead of
 *    hardcoding prose that silently goes stale.
 */

// ─── Electricity ──────────────────────────────────────────────────────────────

export const ELECTRICITY_THRESHOLDS = {
    /** >= this multiple of the subject's own baseline = critical spike. */
    SPIKE_CRITICAL: 3,
    /** >= this multiple of baseline (but below critical) = high spike. */
    SPIKE_HIGH: 2,
    /** <= this fraction of baseline (but non-zero) = dip / under-draw. */
    DIP: 0.3,
    /**
     * Baselines below this many kWh are too small for ratio maths to mean
     * anything (a 1 kWh meter reading 4 kWh is noise, not a 4x spike).
     */
    MIN_BASELINE_KWH: 5,
} as const;

/** Human-readable gate labels — rendered in legends, tooltips and heatmap notes. */
export const ELECTRICITY_GATE_LABELS = {
    spikeCritical: `≥ ${ELECTRICITY_THRESHOLDS.SPIKE_CRITICAL}× baseline`,
    spikeHigh: `≥ ${ELECTRICITY_THRESHOLDS.SPIKE_HIGH}× baseline`,
    dip: `≤ ${ELECTRICITY_THRESHOLDS.DIP}× baseline`,
    minBaseline: `baseline ≥ ${ELECTRICITY_THRESHOLDS.MIN_BASELINE_KWH} kWh`,
} as const;

/**
 * One sentence an operator can read to know exactly what the colours mean.
 * Used by the Load Watch heatmap note and the Meters-table anomaly legend so
 * the two can never disagree.
 */
export function describeElectricityGates(): string {
    const t = ELECTRICITY_THRESHOLDS;
    return `Flagged against each meter's own baseline (mean of its positive reads in range, only where that baseline is ≥ ${t.MIN_BASELINE_KWH} kWh): ≥ ${t.SPIKE_CRITICAL}× = Critical, ≥ ${t.SPIKE_HIGH}× = High, ≤ ${t.DIP}× = Low, 0 = Zero, negative = meter fault.`;
}

/** The shared severity vocabulary, re-declared here to avoid a UI import in a pure-logic module. */
export type ThresholdSeverity = "nodata" | "good" | "watch" | "high" | "critical";

/**
 * The one ratio classifier. Both the per-meter anomaly scan and the
 * category×month heatmap call this, so a 2.5× reading is "High" everywhere.
 */
export function classifyLoadRatio(ratio: number): ThresholdSeverity {
    const t = ELECTRICITY_THRESHOLDS;
    if (!Number.isFinite(ratio)) return "nodata";
    if (ratio >= t.SPIKE_CRITICAL) return "critical";
    if (ratio >= t.SPIKE_HIGH) return "high";
    if (ratio <= t.DIP) return "watch";
    return "good";
}

// ─── STP ──────────────────────────────────────────────────────────────────────

export const STP_THRESHOLDS = {
    /** TSE recovery (TSE ÷ inlet, %) — mirrors lib/operational-alerts.ts bands. */
    RECOVERY_GOOD: 95,
    /** 90–95% = watch (STP_RECOVERY_WATCH in operational-alerts). */
    RECOVERY_WATCH: 90,
    /** below 80% = critical (STP_RECOVERY_CRITICAL in operational-alerts). */
    RECOVERY_CRITICAL: 80,

    /** Inlet ÷ median daily inlet — hydraulic surge gates. */
    LOAD_HIGH: 1.4,
    LOAD_WATCH: 1.2,
    /** Inlet at or below this fraction of typical (but non-zero) = possible plant issue. */
    LOAD_LOW: 0.4,

    /**
     * Absolute inlet gate used for the "high inlet" operator toast. Derived
     * from the historical high end of the plant's normal daily range.
     */
    INLET_TOAST_M3: 4800,
    /** Daily tanker trips above this fire the "high tanker activity" toast. */
    TANKER_TOAST_TRIPS: 3,

    /** Daily tanker gates, relative to the period's median trips/day. */
    TANKER_HIGH_MULTIPLE: 2,
    TANKER_HIGH_FLOOR: 4,
    TANKER_WATCH_OFFSET: 2,
    TANKER_WATCH_FLOOR: 3,

    /** Day-over-week efficiency fall (percentage points) that counts as a drop. */
    EFFICIENCY_DROP_PP: 10,
} as const;

export function describeSTPGates(): string {
    const t = STP_THRESHOLDS;
    return `Recovery bands: ≥ ${t.RECOVERY_GOOD}% healthy, ${t.RECOVERY_WATCH}–${t.RECOVERY_GOOD}% watch, ${t.RECOVERY_CRITICAL}–${t.RECOVERY_WATCH}% high, < ${t.RECOVERY_CRITICAL}% critical. Hydraulic load vs the period's median daily inlet: ≥ ${t.LOAD_HIGH}× surge, ≥ ${t.LOAD_WATCH}× elevated, ≤ ${t.LOAD_LOW}× unusually low.`;
}

/** Recovery / treatment-efficiency band. `null` efficiency = no inlet that day. */
export function classifyRecovery(efficiencyPct: number | null): ThresholdSeverity {
    const t = STP_THRESHOLDS;
    if (efficiencyPct === null || !Number.isFinite(efficiencyPct)) return "nodata";
    if (efficiencyPct >= t.RECOVERY_GOOD) return "good";
    if (efficiencyPct >= t.RECOVERY_WATCH) return "watch";
    if (efficiencyPct >= t.RECOVERY_CRITICAL) return "high";
    return "critical";
}

/** Hydraulic load severity for an inlet reading against the period baseline. */
export function classifyHydraulicLoad(inlet: number, baseline: number): ThresholdSeverity {
    const t = STP_THRESHOLDS;
    if (inlet <= 0) return "nodata";
    if (baseline <= 0) return "good";
    const r = inlet / baseline;
    if (r >= t.LOAD_HIGH) return "high";
    if (r >= t.LOAD_WATCH || r <= t.LOAD_LOW) return "watch";
    return "good";
}

/** Daily tanker-discharge severity against the period's median trips/day. */
export function classifyTankerTrips(trips: number, baseline: number): ThresholdSeverity {
    const t = STP_THRESHOLDS;
    const highGate = Math.max(t.TANKER_HIGH_FLOOR, Math.ceil(baseline * t.TANKER_HIGH_MULTIPLE));
    const watchGate = Math.max(t.TANKER_WATCH_FLOOR, Math.ceil(baseline) + t.TANKER_WATCH_OFFSET);
    if (trips >= highGate) return "high";
    if (trips >= watchGate) return "watch";
    return "good";
}
