/**
 * Presentation helpers.
 *
 * Every one of these returns an explicit placeholder for absent data. Nothing
 * in this app may render a plausible-looking number that is not a real reading —
 * a missing value shows as "—", never as 0.
 */

const PLACEHOLDER = '—';

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return PLACEHOLDER;
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return PLACEHOLDER;
  return `${value.toFixed(digits)}%`;
}

/** Compact form for KPI tiles: 12.4k, 3.1M. Falls back to full digits below 10k. */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return PLACEHOLDER;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(value);
}

/** `d Mon yyyy`, UTC, matching `lib/operational-alerts.ts` on the web. */
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function formatDateUTC(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return PLACEHOLDER;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatRelativeDays(date: Date | null | undefined, now: Date): string {
  if (!date || Number.isNaN(date.getTime())) return PLACEHOLDER;
  const days = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) /
      86_400_000,
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export { PLACEHOLDER };
