/**
 * @fileoverview The one Omani Rial formatter.
 *
 * OMR amounts are shown to ONE decimal — "12,886.3", never "12,886.301" or
 * "12,886" (owner ruling 2026-10-11, superseding the 3-decimal rule of
 * 2026-09-26: the baisa digits added noise, not information, on a dashboard).
 * Modules used to format money five different ways (0, 1 and 3 decimals,
 * "4.7k", "2.42M"); detail figures now share this one. Compact forms stay only
 * on the Overview hero deck, where space is fixed.
 *
 * Per-unit RATES (a tariff, a fee per trip) are the exception: rounding one
 * misstates the tariff itself (1.32 → "1.3", 0.025 → "0.0"), so they go
 * through `formatOmrRate`, which keeps the precision the rate was set with.
 *
 * @module lib/currency
 */

const OMR_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const OMR_RATE_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
});

/**
 * Format an OMR amount to 1 decimal with thousands separators, without the
 * unit (tiles render "OMR" as a separate unit label).
 *
 * @param value    Amount in rials; null/undefined/non-finite → `fallback`.
 * @param fallback What to show when there is no figure (never "0.0").
 */
export function formatOmr(value: number | null | undefined, fallback = "—"): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
    return OMR_FORMAT.format(value);
}

/**
 * Format a per-unit OMR rate (tariff, fee) at the precision it was set with —
 * at least 1 decimal, at most 3 — so "1.32" stays "1.32" and "4.5" stays "4.5".
 */
export function formatOmrRate(value: number | null | undefined, fallback = "—"): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
    return OMR_RATE_FORMAT.format(value);
}
