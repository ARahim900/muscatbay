/**
 * Parse/format helpers for animated KPI counters.
 *
 * KPI values arrive as pre-formatted display strings ("92,051.5 OMR",
 * "2,847 m³", "98.2%"). The counter must animate ONLY the numeric part and
 * reproduce the exact original formatting at rest — same decimals, same
 * grouping, same prefix/suffix — so animated and static renders are
 * pixel-identical.
 */

export interface ParsedMetric {
    /** Text before the number (e.g. "OMR ") */
    prefix: string;
    /** Numeric value parsed from the string */
    value: number;
    /** Text after the number (e.g. " m³", "%") */
    suffix: string;
    /** Decimal places in the original formatting */
    decimals: number;
    /** Whether the original used thousands separators */
    grouped: boolean;
}

const NUMBER_RE = /-?\d[\d,]*(?:\.\d+)?/;

/** Returns null when the string holds no animatable number (e.g. "N/A", "—"). */
export function parseMetricValue(raw: string): ParsedMetric | null {
    const match = NUMBER_RE.exec(raw);
    if (!match) return null;

    const numeric = match[0];
    const decimals = numeric.includes(".") ? numeric.split(".")[1].length : 0;
    const grouped = numeric.includes(",");
    const value = parseFloat(numeric.replace(/,/g, ""));
    if (!Number.isFinite(value)) return null;

    return {
        prefix: raw.slice(0, match.index),
        value,
        suffix: raw.slice(match.index + numeric.length),
        decimals,
        grouped,
    };
}

/** Format an intermediate tween value with the original string's conventions. */
export function formatMetricValue(parsed: ParsedMetric, current: number): string {
    const formatted = current.toLocaleString("en-US", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
        useGrouping: parsed.grouped,
    });
    return `${parsed.prefix}${formatted}${parsed.suffix}`;
}
