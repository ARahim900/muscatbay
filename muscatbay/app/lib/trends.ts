/**
 * @fileoverview Shared month-over-month change calculation.
 *
 * This is the ONE canonical way the app computes and labels a monthly change.
 * It used to be copy-pasted (with drifting behaviour) in the dashboard hook,
 * the Electricity page and the STP page — each with a different neutral label
 * ('0%' vs '—' vs '~0%'), so the same movement read differently per module.
 *
 * Semantics:
 *  - No usable baseline (previous missing/zero/non-finite) → neutral `—`
 *    (we cannot claim "0% change" against nothing).
 *  - |change| < 0.5%  → neutral `~0%` (below reading noise, not a real move).
 *  - Otherwise        → up/down with one decimal, e.g. `12.4%`.
 *
 * @module lib/trends
 */

export interface TrendResult {
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
}

/** Neutral result when there is no baseline to compare against. */
export const NO_BASELINE: TrendResult = { trend: 'neutral', trendValue: '—' };

/**
 * Month-over-month relative change between two totals.
 *
 * @param current  Latest period value.
 * @param previous Prior period value (the baseline). Nullish/0 → no baseline.
 */
export function calcTrend(current: number, previous: number | null | undefined): TrendResult {
    if (previous == null || previous === 0 || !Number.isFinite(previous) || !Number.isFinite(current)) {
        return NO_BASELINE;
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.5) return { trend: 'neutral', trendValue: '~0%' };
    return {
        trend: change > 0 ? 'up' : 'down',
        trendValue: `${Math.abs(change).toFixed(1)}%`,
    };
}

/** Human sentence for a trend — shared by dashboard activity + chart insights. */
export function describeTrend(t: TrendResult): string {
    if (t.trend === 'up') return `Up ${t.trendValue} vs prev month`;
    if (t.trend === 'down') return `Down ${t.trendValue} vs prev month`;
    return t.trendValue === '—' ? 'No prior month to compare' : 'Stable vs previous month';
}
