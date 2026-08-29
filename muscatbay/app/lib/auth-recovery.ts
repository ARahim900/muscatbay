/**
 * @fileoverview Recovery-session handoff between /auth/callback and
 * /auth/reset-password.
 * @module lib/auth-recovery
 *
 * A password-reset link in this app does NOT land on /auth/reset-password.
 * It lands on /auth/callback, which redeems the single-use token
 * (`verifyOtp` for `?token_hash=…&type=recovery`, or `setSession` for the
 * implicit `#access_token=…&type=recovery`) and only then navigates to
 * /auth/reset-password.
 *
 * That matters for how the reset page can tell a genuine reset from an
 * ordinary visit. Supabase raises `PASSWORD_RECOVERY` at the moment of
 * redemption — which happens on the callback page, before the reset page
 * has mounted. `onAuthStateChange` does not replay it (a fresh subscriber
 * gets `INITIAL_SESSION`), so a reset page that waited for that event alone
 * would reject every real reset link. Hence this explicit marker: the
 * callback sets it where redemption is actually known to have happened.
 *
 * Scope and lifetime are deliberate:
 * - `sessionStorage`, so the marker dies with the tab. A bookmark opened in
 *   a new tab does not inherit it.
 * - Not consumed on read, so reloading the reset page mid-typing does not
 *   strand a legitimate user behind "link expired". It is cleared once the
 *   password is actually updated.
 *
 * What this is NOT: protection against someone with devtools on an already
 * signed-in browser. They can set this key by hand — but they can equally
 * call `supabase.auth.updateUser({ password })` from the console, so no
 * client-side gate helps there. Closing that properly needs server-side
 * reauthentication (Supabase's `secure_password_change`), which is a
 * dashboard/API concern rather than something this page can enforce.
 * This guard is against reaching the form by accident: a typed URL, a
 * bookmark, a stale tab, a shared device.
 */

const RECOVERY_KEY = 'mb.auth.recovery-handoff';

/**
 * Read `sessionStorage` without letting a hostile environment throw.
 * Safari private mode and "block site data" both make the accessor itself
 * raise, so every call is guarded rather than just the parse.
 */
function safeSessionStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
}

/**
 * Record that a recovery link was just redeemed on this tab.
 * Called by /auth/callback immediately before it hands off to the reset page.
 */
export function markRecoveryHandoff(): void {
    const store = safeSessionStorage();
    if (!store) return;
    try {
        store.setItem(RECOVERY_KEY, '1');
    } catch {
        // Storage full or blocked. The reset page will fall back to its
        // error state, which is the honest outcome: better to ask for a new
        // link than to open the form on no evidence at all.
    }
}

/** Whether this tab redeemed a recovery link. */
export function hasRecoveryHandoff(): boolean {
    const store = safeSessionStorage();
    if (!store) return false;
    try {
        return store.getItem(RECOVERY_KEY) === '1';
    } catch {
        return false;
    }
}

/** Drop the marker once the password has actually been changed. */
export function clearRecoveryHandoff(): void {
    const store = safeSessionStorage();
    if (!store) return;
    try {
        store.removeItem(RECOVERY_KEY);
    } catch {
        // Nothing to do — the marker dies with the tab regardless.
    }
}
