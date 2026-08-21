/**
 * Monitoring cadence & completeness gates — the SINGLE source of truth for
 * "when is an entry due, and how much of it is missing before that matters".
 *
 * Why this file exists
 * --------------------
 * `lib/thresholds.ts` answers *"is this reading abnormal?"*. It says nothing
 * about whether the reading exists at all. This file answers the other half:
 * *"should this entry have been recorded by now, and was it?"* — the question
 * the daily / monthly / renewal monitor is built on.
 *
 * Keeping the cadence numbers here (rather than inline in each rule) is the
 * same discipline `lib/thresholds.ts` enforces for anomaly gates: four
 * independently-drifting copies of "60 days" is how a contract ends up amber on
 * one screen and red on the one below it.
 *
 * `lib/operational-alerts.ts` — the app-wide alert feed — imports
 * {@link STP_STALE_DAYS} from here rather than redeclaring it, and gets its
 * contract-expiry gate from {@link RENEWAL_HORIZON_DAYS} via `horizonFor()`,
 * so the notification bell and the monitoring reports can never disagree about
 * when something is late.
 *
 * Contract
 * --------
 *  - Every gate is expressed in whole days or whole percentage points, so the
 *    describe* helpers can print the live number instead of prose that goes
 *    stale.
 *  - Nothing here decides *what* the expected entries are — that comes from the
 *    data and the registers (`lib/water-accounts.ts`, `electricity_meters`,
 *    `water_meters`). These are timing and tolerance only.
 *
 * @module lib/monitoring/config
 */

// ─── Daily cadence ────────────────────────────────────────────────────────────

/**
 * A day's entries are only *due* once this many whole days have passed.
 *
 * Readings for day D are uploaded during day D+1 (Grafana sync / CSV upload /
 * the OWATCO daily sheet), so flagging "today has no readings" at 09:00 would
 * be a false alarm every single morning. With `1`, day D becomes due once the
 * clock passes D+1 — i.e. as of any day N, the newest due day is N-1.
 */
export const DAILY_DUE_AFTER_DAYS = 1;

/** How many due days a daily report evaluates, newest last. */
export const DAILY_WINDOW_DAYS = 7;

/**
 * Days with no STP row before the daily log counts as *stale* rather than
 * merely incomplete — at this point plant monitoring is blind, not just behind.
 *
 * Imported by `lib/operational-alerts.ts`; do not redeclare it there.
 */
export const STP_STALE_DAYS = 3;

// ─── Monthly cadence ──────────────────────────────────────────────────────────

/**
 * A month's entries are only *due* this many days after the month ends.
 *
 * The official monthly water reads and the electricity master sheet are both
 * imported a few days into the following month (see `DerivedMonth` in
 * `functions/api/water.ts`), so the month that has just closed is legitimately
 * incomplete for a short window. Five days is that window.
 */
export const MONTHLY_DUE_AFTER_DAYS = 5;

/** How many due months a monthly report trends over, newest last. */
export const MONTHLY_TREND_MONTHS = 6;

// ─── Completeness gates ───────────────────────────────────────────────────────

/**
 * Recorded-share bands for a section in a period. A section is only `good` at
 * a full house: anything missing is, by definition, an entry nobody made.
 */
export const COVERAGE_GATES = {
    /** ≥ this % recorded (but below 100) = watch. */
    WATCH_PCT: 95,
    /** ≥ this % recorded (but below WATCH) = high. */
    HIGH_PCT: 80,
    // below HIGH_PCT = critical
} as const;

/**
 * Meters whose absence makes the whole balance uncomputable escalate to
 * critical regardless of the overall percentage: losing one villa meter out of
 * 120 is a gap, losing the main bulk is a blind day.
 */
export const BLOCKING_METER_ESCALATES = true;

// ─── Renewal cadence ──────────────────────────────────────────────────────────

/**
 * Notification horizons for contract expiry, in days remaining. One
 * notification fires as a contract crosses **into** each horizon, so a
 * three-year AMC produces four heads-ups and then a daily-standing expired
 * alert — not a nag every morning for 90 days.
 *
 * Change the cadence here and every surface (reports, register, bell) follows.
 */
export const RENEWAL_HORIZON_DAYS = [90, 60, 30, 7] as const;

/** Days remaining at or below this = `high`; expired = `critical`. Mirrors `EXPIRY_SOON_DAYS` in `components/contractors/contract-dates.tsx`. */
export const RENEWAL_SOON_DAYS = 30;
/** Days remaining at or below this (but above SOON) = `watch`. */
export const RENEWAL_HORIZON_MAX_DAYS = 90;

// ─── Describe helpers (print the live numbers, never stale prose) ─────────────

export function describeDailyCadence(): string {
    return `A day's entries are due ${DAILY_DUE_AFTER_DAYS} day after that day ends, so the newest day assessed is always yesterday. Each report covers the last ${DAILY_WINDOW_DAYS} due days.`;
}

export function describeMonthlyCadence(): string {
    return `A month's entries are due ${MONTHLY_DUE_AFTER_DAYS} days after the month closes — the window in which the official reads are imported. Months still inside that window are reported as not yet due, never as missing.`;
}

export function describeCoverageGates(): string {
    return `Recorded share of the entries expected for the period: 100% complete, ≥ ${COVERAGE_GATES.WATCH_PCT}% watch, ≥ ${COVERAGE_GATES.HIGH_PCT}% high, below ${COVERAGE_GATES.HIGH_PCT}% critical. A missing bulk meter is critical on its own — without it the balance cannot be computed at all.`;
}

export function describeRenewalCadence(): string {
    return `Contract expiry notifies at ${RENEWAL_HORIZON_DAYS.join(", ")} days remaining, then stands as a critical item once the end date passes while the register still reads Active.`;
}
