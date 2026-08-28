"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthBrandLockup } from '@/components/auth/brand-lockup';
import { Loader2, AlertCircle, ArrowLeft, HelpCircle, Info } from 'lucide-react';

// ── Friendly error mapping ──────────────────────────────────────────────
// Supabase errors are technical — map known patterns to user-friendly copy.
const ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
    { pattern: /token.*expired|token.*invalid|otp.*expired/i, message: 'Your verification link has expired. Please request a new one.' },
    { pattern: /refresh.token.*already.used/i, message: 'This link has already been used. Please request a new one if needed.' },
    { pattern: /user.*not.found/i, message: 'We couldn\'t find an account with this email. Please sign up first.' },
    { pattern: /email.*not.confirmed/i, message: 'Your email hasn\'t been confirmed yet. Please check your inbox for a verification link.' },
    { pattern: /invalid.*credentials|invalid.*login/i, message: 'Your login credentials are invalid. Please try signing in again.' },
    { pattern: /rate.limit|too.many/i, message: 'Too many attempts. Please wait a moment and try again.' },
    // OAuth (Google) failure modes
    { pattern: /provider.*not.*enabled|unsupported.*provider/i, message: 'Google sign-in isn\'t switched on for this app yet. Please sign in with your email and password, or contact support.' },
    { pattern: /flow.state|code.verifier/i, message: 'Your sign-in attempt expired or finished in a different browser. Please start again from this device.' },
    { pattern: /access.denied|consent.*(denied|cancel)/i, message: 'Google sign-in was cancelled before finishing. Please try again.' },
    { pattern: /error.getting.user.*(email|profile)|external.provider/i, message: 'Google didn\'t share your account details with us. Please try again.' },
];

function friendlyError(raw: string): string {
    for (const { pattern, message } of ERROR_MAP) {
        if (pattern.test(raw)) return message;
    }
    if (raw.length < 80 && !/[_{}()[\]]/.test(raw)) return raw;
    return 'Something went wrong during verification. Please try again.';
}

// ── Detect auth flow from params ────────────────────────────────────────
type AuthFlow = 'recovery' | 'signup' | 'oauth' | 'generic';

function detectFlow(
    type: string | null,
    next: string,
    hashType: string | null,
    flowParam: string | null
): AuthFlow {
    // flow=oauth is set by signInWithGoogle()'s redirectTo and survives the
    // Google → Supabase → app round-trip (GoTrue preserves redirect_to query).
    if (flowParam === 'oauth') return 'oauth';
    if (type === 'recovery' || hashType === 'recovery' || next.includes('reset-password')) return 'recovery';
    if (type === 'signup' || type === 'email' || hashType === 'signup') return 'signup';
    return 'generic';
}

interface FlowConfig {
    title: string;
    description: string;
    secondaryLabel: string;
    secondaryHref: string;
    /** 'google' makes the secondary button restart Google OAuth in place. */
    retry?: 'google';
    tips: string[];
}

const FLOW_CONFIG: Record<AuthFlow, FlowConfig> = {
    recovery: {
        title: 'Password reset didn\'t work',
        description: 'We couldn\'t complete your password reset',
        secondaryLabel: 'Try Resetting Again',
        secondaryHref: '/forgot-password',
        tips: [
            'Password reset links expire after 24 hours',
            'Check your latest email — earlier links are deactivated',
            'Some corporate email filters may click links automatically',
        ],
    },
    signup: {
        title: 'We couldn\'t verify you',
        description: 'Your account verification didn\'t go through',
        secondaryLabel: 'Sign Up Again',
        secondaryHref: '/signup',
        tips: [
            'Verification links expire after 24 hours',
            'Check your latest email — earlier links are deactivated',
            'Some corporate email filters may click links automatically',
        ],
    },
    oauth: {
        title: 'Google sign-in didn\'t work',
        description: 'We couldn\'t complete your sign-in with Google',
        secondaryLabel: 'Retry with Google',
        secondaryHref: '/login',
        retry: 'google',
        tips: [
            'If you cancelled on the Google screen, just try again',
            'Make sure your browser allows redirects to accounts.google.com',
            'You can always sign in with your email and password instead',
        ],
    },
    generic: {
        title: 'Verification didn\'t work',
        description: 'We couldn\'t complete the verification process',
        secondaryLabel: 'Sign Up Again',
        secondaryHref: '/signup',
        tips: [
            'Verification links expire after 24 hours',
            'If you clicked an older link, request a new one',
            'Some corporate email filters may click links automatically',
        ],
    },
};

// ── Shared brand logo — one lockup across the whole auth flow ───────────
function BrandLogo() {
    return (
        <div className="flex justify-center mb-8">
            <AuthBrandLockup />
        </div>
    );
}

// ── Loading state ───────────────────────────────────────────────────────
function LoadingSpinner({ message }: { message: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <BrandLogo />
                <Card className="card-elevated">
                    <CardContent className="pt-8 pb-8">
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex flex-col items-center gap-4"
                        >
                            <Loader2 className="h-10 w-10 animate-spin text-mb-primary" />
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 hover:text-mb-primary dark:hover:text-secondary transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

// ── Page entry ──────────────────────────────────────────────────────────
export default function AuthCallbackPage() {
    return (
        <React.Suspense fallback={<LoadingSpinner message="Loading authentication..." />}>
            <AuthCallbackContent />
        </React.Suspense>
    );
}

// ── Main logic ──────────────────────────────────────────────────────────
function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [flow, setFlow] = useState<AuthFlow>('generic');
    const [retrying, setRetrying] = useState(false);
    const primaryButtonRef = useRef<HTMLButtonElement>(null);
    // Both credentials this page redeems — the PKCE `code` and the
    // email `token_hash` — are single-use, and a second redemption of
    // a spent one always fails. React runs an effect again whenever
    // its deps change (and twice per mount under StrictMode), so run
    // the handler once per mount: without this the retry raced the
    // first attempt and could paint a failure over a sign-in that
    // worked.
    const handledRef = useRef(false);

    // Present from the first render when signInWithGoogle() started the trip,
    // so both the spinner copy and the error state are Google-flavoured.
    const isOAuthFlow = searchParams.get('flow') === 'oauth';

    // Auto-focus primary CTA when error state renders (keyboard users can press Enter)
    useEffect(() => {
        if (error && primaryButtonRef.current) {
            primaryButtonRef.current.focus();
        }
    }, [error]);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const handleAuthCallback = async () => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                setError('Authentication service is not available. Please try again later.');
                return;
            }

            // ── Why a failed redemption is not a failed sign-in ──
            //
            // GoTrue redeems the PKCE `?code=` itself, from its own
            // constructor: `detectSessionInUrl` is on, and the client
            // is built during THIS page load, while the code is still
            // in the URL. That exchange succeeds, saves the session —
            // and deletes the stored code verifier.
            //
            // exchangeCodeForSession() below awaits that same
            // initialisation (GoTrueClient awaits `initializePromise`
            // before redeeming), so it always runs second, finds the
            // verifier gone, and fails with "PKCE code verifier not
            // found in storage". That is what put every Google sign-in
            // on the "Google sign-in didn't work" card — over a session
            // that had in fact just been created.
            //
            // The flag cannot be turned off from here: `@supabase/ssr`'s
            // createBrowserClient spreads `options.auth` FIRST and then
            // hardcodes `detectSessionInUrl`, so passing it is silently
            // discarded. Don't spend time trying that again.
            //
            // So a failed exchange is forgiven ONLY when both are
            // true: the error says the verifier was already spent,
            // AND a session is live. Together those mean something
            // else completed this very exchange — the sign-in worked.
            //
            // Deliberately narrow. Forgiving *any* failed exchange
            // whenever some session exists would silently carry a
            // signed-in user on from a genuinely expired link
            // instead of telling them it expired, and an honest
            // error is worth more than a smooth redirect.
            const ALREADY_SPENT = /code.verifier|flow.state/i;

            const spentButSignedIn = async (message: string): Promise<boolean> => {
                if (!ALREADY_SPENT.test(message)) return false;
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    return !!session;
                } catch {
                    return false;
                }
            };

            const code = searchParams.get('code');
            const tokenHash = searchParams.get('token_hash');
            const rawType = searchParams.get('type');
            const VALID_TYPES = ['signup', 'recovery', 'email', 'magiclink'] as const;
            const type = rawType && VALID_TYPES.includes(rawType as typeof VALID_TYPES[number])
                ? (rawType as typeof VALID_TYPES[number])
                : null;
            const next = searchParams.get('next') || '/';
            const flowParam = searchParams.get('flow');
            const errorParam = searchParams.get('error_description') || searchParams.get('error');

            setFlow(detectFlow(type, next, null, flowParam));

            if (errorParam) {
                setError(friendlyError(errorParam));
                return;
            }

            // ── Flow 1: PKCE code exchange (?code=...) ──
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        if (await spentButSignedIn(exchangeError.message)) {
                            router.push(next);
                            router.refresh();
                            return;
                        }
                        console.error('PKCE exchange error:', exchangeError.message);
                        setError(friendlyError(exchangeError.message));
                        return;
                    }
                    router.push(next);
                    router.refresh();
                    return;
                } catch (err) {
                    console.error('PKCE exchange exception:', err);
                }
            }

            // ── Flow 2: Token hash verification (?token_hash=...&type=...) ──
            if (tokenHash && type) {
                try {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type,
                    });
                    if (verifyError) {
                        console.error('Token hash verify error:', verifyError.message);
                        setError(friendlyError(verifyError.message));
                        return;
                    }
                    if (type === 'recovery') {
                        router.push('/auth/reset-password');
                    } else {
                        router.push(next);
                    }
                    router.refresh();
                    return;
                } catch (err) {
                    console.error('Token hash verify exception:', err);
                }
            }

            // ── Flow 3: Hash fragment — implicit flow (#access_token=...) ──
            if (typeof window !== 'undefined' && window.location.hash) {
                const hashParams = new URLSearchParams(
                    window.location.hash.substring(1)
                );
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const hashType = hashParams.get('type');
                const hashError = hashParams.get('error_description');

                setFlow(detectFlow(type, next, hashType, flowParam));

                if (hashError) {
                    setError(friendlyError(hashError));
                    return;
                }

                if (accessToken && refreshToken) {
                    try {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            console.error('Hash session error:', sessionError.message);
                            setError(friendlyError(sessionError.message));
                            return;
                        }

                        window.history.replaceState(null, '', window.location.pathname);

                        if (hashType === 'recovery') {
                            router.push('/auth/reset-password');
                        } else {
                            router.push(next);
                        }
                        router.refresh();
                        return;
                    } catch (err) {
                        console.error('Hash fragment auth error:', err);
                        setError('Failed to process authentication. Please try again.');
                        return;
                    }
                }
            }

            // ── Flow 4: No auth params — check if already logged in ──
            const { data: { user }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError) {
                console.error('Get user error:', getUserError.message);
            }
            if (user) {
                router.push(next);
            } else if (flowParam === 'oauth') {
                setError('We didn\'t get a sign-in result back from Google. Please try again.');
            } else {
                setError('Your verification link may have expired or is no longer valid. Please request a new one.');
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    if (error) {
        const config = FLOW_CONFIG[flow];

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <BrandLogo />

                    <Card className="card-elevated">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">{config.title}</CardTitle>
                            <CardDescription className="text-center">
                                {config.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error Alert */}
                            <div
                                role="alert"
                                aria-live="assertive"
                                className="p-4 text-sm text-mb-danger-text bg-mb-danger-light rounded-xl border border-mb-danger/20 flex items-center gap-3 motion-safe:animate-in motion-safe:slide-in-from-top-2 duration-200"
                            >
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>

                            {/* Contextual Tips — proactive error prevention */}
                            <div className="rounded-lg bg-muted dark:bg-muted/50 p-3.5 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Common causes</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-muted-foreground" aria-label="Common causes for this error">
                                    {config.tips.map((tip) => (
                                        <li key={tip} className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-border dark:bg-muted shrink-0" aria-hidden="true" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-2">
                                <Button
                                    ref={primaryButtonRef}
                                    onClick={() => router.push('/login')}
                                    className="w-full h-12 bg-mb-primary hover:bg-mb-primary-hover text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                                >
                                    Go to Login
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={retrying}
                                    onClick={() => {
                                        if (config.retry === 'google') {
                                            // Restart OAuth in place — bouncing via /login
                                            // just to press the same button again is a
                                            // wasted step. On success the page unloads.
                                            setRetrying(true);
                                            signInWithGoogle().catch((err: unknown) => {
                                                setRetrying(false);
                                                setError(friendlyError(err instanceof Error ? err.message : 'Google sign-in failed'));
                                            });
                                        } else {
                                            router.push(config.secondaryHref);
                                        }
                                    }}
                                    className="w-full h-12 border-mb-primary/30 text-mb-primary dark:text-secondary dark:border-secondary/30 hover:bg-mb-primary/5 dark:hover:bg-secondary/5 font-semibold rounded-xl transition-all duration-200"
                                >
                                    {retrying ? (
                                        <>
                                            <Loader2 className="me-2 h-4 w-4 motion-safe:animate-spin" />
                                            Redirecting to Google…
                                        </>
                                    ) : (
                                        config.secondaryLabel
                                    )}
                                </Button>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-mb-primary dark:hover:text-secondary transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>

                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>Still having trouble?</span>
                                <a
                                    href="mailto:support@muscatbay.com"
                                    className="underline hover:text-mb-primary dark:hover:text-secondary transition-colors"
                                >
                                    Contact support
                                </a>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return <LoadingSpinner message={isOAuthFlow ? 'Completing sign-in with Google...' : 'Verifying your account...'} />;
}
