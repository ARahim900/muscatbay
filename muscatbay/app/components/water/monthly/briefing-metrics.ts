/**
 * @fileoverview Water → Monthly operational-briefing metrics.
 *
 * Pure derivation of the four briefing findings from the figures the Monthly
 * dashboard already computes ({@link computePeriod} + the adapter output). It is
 * separated from the view for the same reason the Daily briefing is: the
 * arithmetic is testable on its own, and the component stays a renderer.
 *
 * Nothing here estimates, substitutes or defaults a missing value to zero. In
 * particular `pct()` returns `0` when its denominator is `0`, so a period with
 * no main-bulk (NAMA L1) volume would otherwise report a confident "0% loss"
 * when the truth is "not measurable" — those figures are returned as `null`
 * instead, and the view says so.
 *
 * @module components/water/monthly/briefing-metrics
 */

import {
    MONTHS, TARGET_LOSS_PCT, periodValue,
    type PeriodResult, type Sel, type WaterData,
} from "@/lib/water-monthly-data";

export interface MonthlyBriefingMetrics {
    /** Total system loss as a share of A1; `null` when no A1 volume is recorded. */
    lossPct: number | null;
    /** Total system loss in m³; `null` when no A1 volume is recorded. */
    lossM3: number | null;
    /** Zones whose in-zone loss exceeds {@link TARGET_LOSS_PCT}. */
    zonesAboveTarget: number;
    /** Names of those zones, largest absolute loss first (the order `zones` arrives in). */
    zonesAboveTargetNames: string[];
    /** Zones with a usable bulk (L2) volume for the period — the denominator. */
    zoneCount: number;
    /**
     * Zones in which no bulk (L2) meter was read for the period, so no loss can
     * be computed for them at all. `computePeriod` drops such a zone from
     * `zones` entirely, so counting it here is the only way the briefing can
     * report that part of the network as unmeasured rather than silently
     * narrowing the denominator above.
     */
    zonesMissingBulk: number;
    /** Months of the displayed year with no main-bulk (A1 / NAMA L1) reading at all. */
    monthsWithoutSupply: string[];
    /** Months of the displayed year that carry any data — the denominator above. */
    monthsChecked: number;
    /** Meters with no reading in the selected period (they contribute nothing to the balance). */
    missingMeters: number;
    /** Meters reporting a negative volume in the selected period (physically impossible). */
    negativeMeters: number;
}

/**
 * Build the Monthly briefing findings.
 *
 * @param data     Adapter output, used to test the bulk meters reading by reading.
 * @param year     Displayed year (e.g. `"2026"`).
 * @param nMonths  Months of that year that carry data.
 * @param sel      The current period selection (whole period, month, or range).
 * @param period   Balance for that selection.
 */
export function buildMonthlyBriefing({
    data,
    year,
    nMonths,
    sel,
    period,
}: {
    data: WaterData;
    year: string;
    nMonths: number;
    sel: Sel;
    period: PeriodResult;
}): MonthlyBriefingMetrics {
    // A1 is the denominator of every loss figure on this page. Without it the
    // loss is not zero, it is unknown.
    const supplyRecorded = period.A1 > 0;

    const zonesAbove = period.zones.filter((z) => z.lossPct > TARGET_LOSS_PCT);

    // A month counts as "no supply reading" when no L1 meter recorded anything
    // for it — a genuine gap in the NAMA main-bulk series, not a zero.
    const monthsWithoutSupply: string[] = [];
    for (let i = 0; i < nMonths; i += 1) {
        const read = data.meters.some((m) => {
            const cache = m.y[year];
            return cache?.label === "L1" && cache.vals[i] != null;
        });
        if (!read) monthsWithoutSupply.push(MONTHS[i]);
    }

    // A zone counts as unmeasured when none of its bulk (L2) meters recorded
    // anything for the selection. A bulk meter that genuinely reported 0 has
    // been read, and is not counted here.
    const zoneBulkRead = new Map<string, boolean>();
    for (const m of data.meters) {
        const cache = m.y[year];
        if (cache?.label !== "L2") continue;
        const read = periodValue(cache, sel) != null;
        zoneBulkRead.set(cache.zone, (zoneBulkRead.get(cache.zone) ?? false) || read);
    }

    return {
        lossPct: supplyRecorded ? period.lossPct : null,
        lossM3: supplyRecorded ? period.loss : null,
        zonesAboveTarget: zonesAbove.length,
        zonesAboveTargetNames: zonesAbove.map((z) => z.name),
        zoneCount: period.zones.length,
        zonesMissingBulk: Array.from(zoneBulkRead.values()).filter((read) => !read).length,
        monthsWithoutSupply,
        monthsChecked: nMonths,
        missingMeters: period.missingMeters,
        negativeMeters: period.negativeMeters,
    };
}
