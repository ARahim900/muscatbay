import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthCallbackPage from '@/app/auth/callback/page';

const push = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push, refresh, replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/auth/callback',
    useSearchParams: () => searchParams,
}));

const exchangeCodeForSession = vi.fn();
const getSession = vi.fn();
const getUser = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/lib/supabase', () => ({
    getSupabaseClient: () => ({
        auth: { exchangeCodeForSession, getSession, getUser, verifyOtp },
    }),
}));

vi.mock('@/lib/auth', () => ({ signInWithGoogle: vi.fn() }));

// The message /auth/callback shows for a spent PKCE verifier.
const VERIFIER_MISSING =
    'PKCE code verifier not found in storage. This can happen if the auth ' +
    'flow was initiated in a different browser or device.';

const noSession = { data: { session: null } };
const withSession = { data: { session: { user: { id: 'u1' } } } };

function renderCallback(query: string) {
    searchParams = new URLSearchParams(query);
    return render(<AuthCallbackPage />);
}

describe('/auth/callback — Google (PKCE) return', () => {
    beforeEach(() => {
        push.mockClear();
        refresh.mockClear();
        exchangeCodeForSession.mockReset();
        getSession.mockReset().mockResolvedValue(noSession);
        getUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
        verifyOtp.mockReset();
    });

    it('lands the user on `next` after a successful exchange', async () => {
        exchangeCodeForSession.mockResolvedValue({ error: null });

        renderCallback('flow=oauth&code=abc123');

        await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
        expect(exchangeCodeForSession).toHaveBeenCalledWith('abc123');
    });

    // ── The reported bug ──────────────────────────────────
    // Something else redeemed the single-use code first (this
    // was GoTrue's own detectSessionInUrl, firing while the
    // client was constructed on this very page load). The
    // session is live, so the sign-in DID work — showing
    // "Google sign-in didn't work" over it was the failure.
    it('continues when the code was already spent but a session exists', async () => {
        exchangeCodeForSession.mockResolvedValue({
            error: { message: VERIFIER_MISSING },
        });
        getSession.mockResolvedValue(withSession);

        renderCallback('flow=oauth&code=abc123');

        await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not forgive an unrelated exchange failure', async () => {
        // Only "the verifier was already spent" is forgiven. Any
        // other failure is a real one, session or not.
        exchangeCodeForSession.mockResolvedValue({
            error: { message: 'Token has expired or is invalid' },
        });
        getSession.mockResolvedValue(withSession);

        renderCallback('flow=oauth&code=abc123');

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('shows the Google error card when the exchange fails with no session', async () => {
        exchangeCodeForSession.mockResolvedValue({
            error: { message: VERIFIER_MISSING },
        });

        renderCallback('flow=oauth&code=abc123');

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /sign-in attempt expired or finished in a different browser/i,
        );
        expect(
            screen.getByRole('heading', { name: /Google sign-in didn't work/i }),
        ).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('redeems the single-use code only once across re-renders', async () => {
        exchangeCodeForSession.mockResolvedValue({ error: null });

        const { rerender } = renderCallback('flow=oauth&code=abc123');
        await waitFor(() => expect(push).toHaveBeenCalledWith('/'));

        rerender(<AuthCallbackPage />);
        rerender(<AuthCallbackPage />);

        await waitFor(() => expect(exchangeCodeForSession).toHaveBeenCalledOnce());
    });

    it('honours ?next= on the way in', async () => {
        exchangeCodeForSession.mockResolvedValue({ error: null });

        renderCallback('flow=oauth&code=abc123&next=/water');

        await waitFor(() => expect(push).toHaveBeenCalledWith('/water'));
    });
});

describe('/auth/callback — email token_hash return', () => {
    beforeEach(() => {
        push.mockClear();
        refresh.mockClear();
        exchangeCodeForSession.mockReset();
        getSession.mockReset().mockResolvedValue(noSession);
        getUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
        verifyOtp.mockReset();
    });

    it('sends a verified recovery link to the reset-password page', async () => {
        verifyOtp.mockResolvedValue({ error: null });

        renderCallback('token_hash=hash123&type=recovery');

        await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/reset-password'));
    });

    it('still reports an expired link even when a session is live', async () => {
        // Deliberately NOT forgiven. A signed-in user clicking a
        // genuinely expired link must be told it expired, not
        // silently carried on to the dashboard.
        verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });
        getSession.mockResolvedValue(withSession);

        renderCallback('token_hash=hash123&type=recovery');

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /verification link has expired/i,
        );
        expect(push).not.toHaveBeenCalled();
    });

    it('shows the recovery error card when verification genuinely fails', async () => {
        verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });

        renderCallback('token_hash=hash123&type=recovery');

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /verification link has expired/i,
        );
        expect(push).not.toHaveBeenCalled();
    });
});
