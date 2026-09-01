/**
 * @fileoverview Persistence for the operational alert system.
 *
 * Two small localStorage stores, both SSR-safe and parse-guarded:
 *  - preferences      — user-facing toggles (Settings → Notifications).
 *  - seen             — fingerprints that already fired a push/toast, so a
 *    reload or refetch never re-pushes the same condition.
 *
 * @module lib/alert-preferences
 */

const PREFS_KEY = "mb-alert-prefs";
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
    } catch (error) {
        console.warn(`Unable to read alert preference store ${key}:`, error);
        return fallback;
    }
}

function safeWrite(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Unable to write alert preference store ${key}:`, error);
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
