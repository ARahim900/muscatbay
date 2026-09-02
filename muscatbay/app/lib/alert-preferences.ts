/**
 * @fileoverview Persistence for the operational alert system.
 *
 * Three small localStorage stores, all SSR-safe and parse-guarded:
 *  - preferences      — user-facing toggles (Settings → Notifications).
 *  - acknowledgements — alert fingerprints the operator has acknowledged;
 *    an acked alert stays out of the unread count until its condition
 *    changes (new fingerprint).
 *  - seen             — fingerprints that already fired a push/toast, so a
 *    reload or refetch never re-pushes the same condition.
 *
 * @module lib/alert-preferences
 */

const PREFS_KEY = "mb-alert-prefs";
const ACK_KEY = "mb-alert-acks";
const SEEN_KEY = "mb-alert-seen";

/** Cap stored fingerprints so the stores can't grow unbounded. */
const MAX_STORED_IDS = 200;

export interface AlertPreferences {
    /** Fire browser/OS push notifications for new warning/critical alerts. */
    push: boolean;
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = { push: true };

function safeRead<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function safeWrite(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage full/blocked — alerts still work, persistence degrades
    }
}

/* ── Preferences ─────────────────────────────────────────────────────── */

export function getAlertPreferences(): AlertPreferences {
    const stored = safeRead<Partial<AlertPreferences>>(PREFS_KEY, {});
    return { ...DEFAULT_ALERT_PREFERENCES, ...stored };
}

export function setAlertPreferences(update: Partial<AlertPreferences>): AlertPreferences {
    const next = { ...getAlertPreferences(), ...update };
    safeWrite(PREFS_KEY, next);
    return next;
}

/* ── Acknowledgements ────────────────────────────────────────────────── */

export function getAcknowledgedAlertIds(): string[] {
    const ids = safeRead<unknown>(ACK_KEY, []);
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
}

export function acknowledgeAlertId(id: string): string[] {
    const ids = getAcknowledgedAlertIds();
    if (!ids.includes(id)) ids.push(id);
    const trimmed = ids.slice(-MAX_STORED_IDS);
    safeWrite(ACK_KEY, trimmed);
    return trimmed;
}

export function unacknowledgeAlertId(id: string): string[] {
    const ids = getAcknowledgedAlertIds().filter((x) => x !== id);
    safeWrite(ACK_KEY, ids);
    return ids;
}

/**
 * Drop stored acks whose alert is no longer active — keeps the store small
 * and lets a re-occurring (same-fingerprint) condition start unacked only if
 * it truly went away first.
 */
export function pruneAcknowledgedAlertIds(activeIds: string[]): string[] {
    const active = new Set(activeIds);
    const kept = getAcknowledgedAlertIds().filter((id) => active.has(id));
    safeWrite(ACK_KEY, kept);
    return kept;
}

/* ── Seen (push dedupe) ──────────────────────────────────────────────── */

export function getSeenAlertIds(): string[] {
    const ids = safeRead<unknown>(SEEN_KEY, []);
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
}

export function markAlertIdsSeen(ids: string[]): void {
    const seen = getSeenAlertIds();
    const merged = [...seen, ...ids.filter((id) => !seen.includes(id))].slice(-MAX_STORED_IDS);
    safeWrite(SEEN_KEY, merged);
}
