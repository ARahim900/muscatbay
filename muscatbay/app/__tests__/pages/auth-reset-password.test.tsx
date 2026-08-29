import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import { markRecoveryHandoff } from '@/lib/auth-recovery';

const USER = 'u1';
const OTHER_USER = 'u2';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push, refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/auth/reset-password',
    useSearchParams: () => new URLSearchParams(),
}));

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
let supabaseClient: unknown = null;

vi.mock('@/lib/supabase', () => ({
    getSupabaseClient: () => supabaseClient,
}));

vi.mock('@/lib/auth', () => ({ updatePassword: vi.fn() }));

const noSession = { data: { session: null } };
const withSession = { data: { session: { user: { id: USER } } } };

type RecoverySession = typeof withSession.data.session;

/**
 * Stand in for Supabase raising PASSWORD_RECOVERY on subscribe, handing the
 * callback the session it just established (or none, to pin that case).
 */
function fireRecovery(session: RecoverySession | null) {
    return (cb: (event: string, session: RecoverySession | null) => void) => {
        cb('PASSWORD_RECOVERY', session);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
    };
}

/** The heading shown when the page refuses to open the form. */
const REFUSED = /this reset link is missing or expired/i;
/** The form's own heading, shown only once the gate is satisfied. */
const FORM = /set new password/i;

describe('/auth/reset-password — gates on a recovery link, not any session', () => {
    beforeEach(() => {
        push.mockClear();
        getSession.mockReset().mockResolvedValue(noSession);
        onAuthStateChange.mockReset().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        supabaseClient = { auth: { getSession, onAuthStateChange } };
        window.sessionStorage.clear();
    });

    // ── The reported hole ─────────────────────────────────
    // A user already signed in normally — a typed URL, a
    // bookmark, a stale tab, a shared control-room tablet —
    // used to reach the form and set a new password without
    // ever holding a reset link.
    it('refuses an ordinary signed-in session with no recovery link', async () => {
        getSession.mockResolvedValue(withSession);

        render(<ResetPasswordPage />);

        expect(await screen.findByText(REFUSED)).toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('opens the form for a session that followed a recovery link', async () => {
        markRecoveryHandoff(USER);
        getSession.mockResolvedValue(withSession);

        render(<ResetPasswordPage />);

        expect(await screen.findByText(FORM)).toBeInTheDocument();
        expect(screen.queryByText(REFUSED)).not.toBeInTheDocument();
    });

    it('refuses when there is no session at all', async () => {
        getSession.mockResolvedValue(noSession);

        render(<ResetPasswordPage />);

        expect(await screen.findByText(REFUSED)).toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
    });

    // A stale marker is not a substitute for being signed in: without a
    // session there is nothing to call updateUser against.
    it('refuses a recovery marker with no session behind it', async () => {
        markRecoveryHandoff(USER);
        getSession.mockResolvedValue(noSession);

        render(<ResetPasswordPage />);

        expect(await screen.findByText(REFUSED)).toBeInTheDocument();
    });

    // A link that lands straight here (rather than via /auth/callback)
    // raises PASSWORD_RECOVERY while this page is mounted. That is
    // first-hand evidence and must open the form even though no marker
    // was set before the page loaded.
    it('opens the form when PASSWORD_RECOVERY fires on this page', async () => {
        getSession.mockResolvedValue(noSession);
        onAuthStateChange.mockImplementation(fireRecovery(withSession.data.session));

        render(<ResetPasswordPage />);

        expect(await screen.findByText(FORM)).toBeInTheDocument();
    });

    // Supabase hands the callback the session it just established. Without
    // one there is nothing to update, so the event name alone is not enough.
    it('refuses a PASSWORD_RECOVERY event that carries no session', async () => {
        getSession.mockResolvedValue(noSession);
        onAuthStateChange.mockImplementation(fireRecovery(null));

        render(<ResetPasswordPage />);

        expect(await screen.findByText(REFUSED)).toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
    });

    // A marker left by one account must not vouch for the next person to
    // sign in on the same tab — a shared control-room tablet is exactly
    // where an account switch happens.
    it('refuses a marker minted for a different user', async () => {
        markRecoveryHandoff(OTHER_USER);
        getSession.mockResolvedValue(withSession);

        render(<ResetPasswordPage />);

        expect(await screen.findByText(REFUSED)).toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
    });

    // The event and the getSession() check race. The event settling first
    // must not be undone by the slower check reporting "no session".
    it('keeps the form open when the session check settles after the event', async () => {
        let release: (value: typeof noSession) => void = () => {};
        getSession.mockReturnValue(
            new Promise<typeof noSession>((resolve) => {
                release = resolve;
            }),
        );
        onAuthStateChange.mockImplementation(fireRecovery(withSession.data.session));

        render(<ResetPasswordPage />);
        expect(await screen.findByText(FORM)).toBeInTheDocument();

        release(noSession);

        await waitFor(() => expect(getSession).toHaveBeenCalled());
        expect(screen.getByText(FORM)).toBeInTheDocument();
        expect(screen.queryByText(REFUSED)).not.toBeInTheDocument();
    });

    // A failed session lookup is not an expired link. Saying it was would
    // be a plausible wrong answer over a real fault.
    it('reports a session-check failure as its own fault, not an expired link', async () => {
        getSession.mockResolvedValue({
            data: { session: null },
            error: { message: 'network unreachable' },
        });

        render(<ResetPasswordPage />);

        expect(await screen.findByText(/could not check your reset link/i)).toBeInTheDocument();
        expect(screen.queryByText(REFUSED)).not.toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
    });

    it('says so honestly when Supabase is not configured', async () => {
        supabaseClient = null;

        render(<ResetPasswordPage />);

        expect(await screen.findByText(/password reset unavailable/i)).toBeInTheDocument();
        expect(screen.queryByText(FORM)).not.toBeInTheDocument();
        // Not a silent bounce to the dashboard.
        expect(push).not.toHaveBeenCalled();
    });

    it('never redirects away instead of explaining', async () => {
        getSession.mockResolvedValue(withSession);

        render(<ResetPasswordPage />);

        await screen.findByText(REFUSED);
        expect(push).not.toHaveBeenCalled();
    });
});
