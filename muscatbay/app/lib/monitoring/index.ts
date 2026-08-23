/**
 * Monitoring — barrel for the data-completeness rules engine.
 *
 * Layering, so this stays where it belongs in the stack:
 *
 *   lib/monitoring/  → PURE rules. No Supabase, no React, no `next/*`, no
 *                      `window`. Every function takes its data and its `now` as
 *                      arguments, which is what makes them unit-testable and
 *                      safe for the Expo app in `mobile/` to bundle.
 *   functions/api/monitoring.ts
 *                    → the reader that gathers the inputs these rules need and
 *                      reports per-source failure honestly.
 *   components/monitoring/
 *                    → the surfaces that render a report.
 *
 * `lib/operational-alerts.ts` imports `STP_STALE_DAYS` from `./config` and the
 * contract-expiry ladder from `./renewals` (`horizonFor`), so the app-wide
 * alert feed and these reports can never disagree about when an entry is late.
 *
 * @module lib/monitoring
 */

export * from "./config";
export * from "./types";
export * from "./calendar";
export * from "./coverage";
export * from "./expectations";
export * from "./daily";
export * from "./monthly";
export * from "./renewals";
export * from "./report";
