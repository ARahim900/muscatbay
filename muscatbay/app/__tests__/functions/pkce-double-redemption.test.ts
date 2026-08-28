/**
 * Integration proof for the Google sign-in failure, against the REAL
 * @supabase/ssr + @supabase/auth-js — no mocking of Supabase itself.
 *
 * The unit tests in __tests__/pages/auth-callback.test.tsx stub the auth
 * client, so they prove /auth/callback's logic but NOT the library
 * behaviour that logic exists to survive. This file pins that behaviour,
 * so a dependency bump that changes it fails here instead of silently
 * breaking sign-in in production again.
 *
 * Only the network is stubbed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';

const PROJECT_REF = 'testproj';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
// Not a credential — auth-js only parses the project ref out of the URL.
const ANON_KEY = 'eyJtest-anon-key';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;
const VERIFIER_COOKIE = `${STORAGE_KEY}-code-verifier`;

const SESSION = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
        id: 'user-1',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'operator@muscatbay.com',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
    },
};

/** Answers the PKCE token exange; everything else is an empty 200. */
function stubNetwork() {
    return vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('grant_type=pkce')) {
            return new Response(JSON.stringify(SESSION), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    });
}

function clearCookies() {
    for (const entry of document.cookie.split(';')) {
        const name = entry.split('=')[0]?.trim();
        if (name) document.cookie = `${name}=; path=/; max-age=0`;
    }
}

/** A fresh client, as a real page load builds one. */
function newClient(authOptions: Record<string, unknown> = {}) {
    return createBrowserClient(SUPABASE_URL, ANON_KEY, {
        isSingleton: false,
        auth: authOptions,
    });
}

/** Let the constructor's fire-and-forget initialize() settle. */
async function settle() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('PKCE double redemption (real @supabase/ssr + auth-js)', () => {
    beforeEach(() => {
        clearCookies();
        vi.stubGlobal('fetch', stubNetwork());
        window.history.replaceState({}, '', '/login');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearCookies();
    });

    it('cannot be disabled: createBrowserClient overrides detectSessionInUrl', () => {
        // The first fix attempted was passing this through. @supabase/ssr
        // spreads `options.auth` FIRST and then hardcodes the flag, so the
        // override is silently dropped. Asserting the option was *passed*
        // would have gone green while production stayed broken.
        const client = newClient({ detectSessionInUrl: false });

        const detect = (client.auth as unknown as { detectSessionInUrl: unknown })
            .detectSessionInUrl;
        expect(detect).toBe(true);
    });

    it('redeems ?code= at construction, then fails the explicit exchange', async () => {
        // 1. Start OAuth so auth-js writes a real code verifier itself.
        const starter = newClient();
        await starter.auth.signInWithOAuth({
            provider: 'google',
            options: { skipBrowserRedirect: true },
        });
        expect(document.cookie).toContain(VERIFIER_COOKIE);

        // 2. Google returns to /auth/callback — a full page load, so a
        //    fresh client is built while ?code= is still in the URL.
        window.history.replaceState({}, '', '/auth/callback?flow=oauth&code=auth-code-1');
        const callbackClient = newClient({ detectSessionInUrl: false });
        await settle();

        // 3. The constructor already redeemed the code and DELETED the
        //    verifier — this is the bug's engine.
        expect(document.cookie).not.toContain(VERIFIER_COOKIE);

        // 4. So /auth/callback's own exchange always loses the race.
        const { error } = await callbackClient.auth.exchangeCodeForSession('auth-code-1');
        expect(error).not.toBeNull();
        // This message is what /auth/callback maps to "your sign-in attempt
        // expired or finished in a different browser" — the reported screen.
        expect(error?.message).toMatch(/code.verifier/i);

        // 5. And the whole point: the sign-in DID work. That error sat on
        //    top of a live session, which is exactly why /auth/callback
        //    now trusts getSession() over the error.
        const { data } = await callbackClient.auth.getSession();
        expect(data.session?.access_token).toBe('access-token');
        expect(data.session?.user.email).toBe('operator@muscatbay.com');
    });

    it('a genuine failure leaves no session, so the error still shows', async () => {
        // The guard on the fix. /auth/callback now forgives a failed
        // exchange when a session is live — so it must be true that a
        // REAL failure leaves none, or the fix would mask every
        // broken sign-in behind a redirect to the dashboard.
        //
        // This is a sign-in that arrives with no verifier at all (a
        // different browser or device, cleared storage) — the case the
        // error card's copy actually describes.
        window.history.replaceState({}, '', '/auth/callback?flow=oauth&code=auth-code-2');
        const client = newClient();
        await settle();

        const { error } = await client.auth.exchangeCodeForSession('auth-code-2');
        expect(error?.message).toMatch(/code.verifier/i);

        const { data } = await client.auth.getSession();
        expect(data.session).toBeNull();
    });
});
