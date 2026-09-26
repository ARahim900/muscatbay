/**
 * @fileoverview The one Omani Rial formatter.
 *
 * OMR is quoted to 3 decimals (1 rial = 1,000 baisa), so "1,648.500" and never
 * "1,648.5" or "1,649". Modules used to format money five different ways
 * (0, 1 and 3 decimals, "4.7k", "2.42M"); detail figures now share this one.
 * Compact forms stay only on the Overview hero deck, where space is fixed.
 *
 * @module lib/currency
 */

const OMR_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

/**
 * Format an OMR amount to 3 decimals with thousands separators, without the
 * unit (tiles render "OMR" as a separate unit label).
 *
 * @param value    Amount in rials; null/undefined/non-finite → `fallback`.
 * @param fallback What to show when there is no figure (never "0.000").
 */
export function formatOmr(value: number | null | undefined, fallback = "—"): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
    return OMR_FORMAT.format(value);
}
