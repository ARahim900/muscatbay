"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
];

function friendlyError(raw: string): string {
    for (const { pattern, message } of ERROR_MAP) {
        if (pattern.test(raw)) return message;
    }
    if (raw.length < 80 && !/[_{}()[\]]/.test(raw)) return raw;
    return 'Something went wrong during verification. Please try again.';
}

// ── Detect auth flow from params ────────────────────────────────────────
type AuthFlow = 'recovery' | 'signup' | 'generic';

function detectFlow(
    type: string | null,
    next: string,
    hashType: string | null
): AuthFlow {
    if (type === 'recovery' || hashType === 'recovery' || next.includes('reset-password')) return 'recovery';
    if (type === 'signup' || type === 'email' || hashType === 'signup') return 'signup';
    return 'generic';
}

interface FlowConfig {
    title: string;
    description: string;
    secondaryLabel: string;
    secondaryHref: string;
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

// ── Shared brand logo ───────────────────────────────────────────────────
function BrandLogo() {
    return (
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--mb-primary)] flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">MB</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Muscat Bay</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Operations Dashboard</p>
                </div>
            </div>
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
                            <Loader2 className="h-10 w-10 animate-spin text-[var(--mb-primary)]" />
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500 hover:text-[var(--mb-primary)] dark:hover:text-secondary transition-colors"
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
    const primaryButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-focus primary CTA when error state renders (keyboard users can press Enter)
    useEffect(() => {
        if (error && primaryButtonRef.current) {
            primaryButtonRef.current.focus();
        }
    }, [error]);

    useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                setError('Authentication service is not available. Please try again later.');
                return;
            }

            const code = searchParams.get('code');
            const tokenHash = searchParams.get('token_hash');
            const rawType = searchParams.get('type');
            const VALID_TYPES = ['signup', 'recovery', 'email', 'magiclink'] as const;
            const type = rawType && VALID_TYPES.includes(rawType as typeof VALID_TYPES[number])
                ? (rawType as typeof VALID_TYPES[number])
                : null;
            const next = searchParams.get('next') || '/';
            const errorParam = searchParams.get('error_description') || searchParams.get('error');

            setFlow(detectFlow(type, next, null));

            if (errorParam) {
                setError(friendlyError(errorParam));
                return;
            }

            // ── Flow 1: PKCE code exchange (?code=...) ──
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
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

                setFlow(detectFlow(type, next, hashType));

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
                                className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 motion-safe:animate-in motion-safe:slide-in-from-top-2 duration-200"
                            >
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>

                            {/* Contextual Tips — proactive error prevention */}
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Common causes</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400" aria-label="Common causes for this error">
                                    {config.tips.map((tip) => (
                                        <li key={tip} className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" aria-hidden="true" />
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
                                    className="w-full h-12 bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                                >
                                    Go to Login
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(config.secondaryHref)}
                                    className="w-full h-12 border-[var(--mb-primary)]/30 text-[var(--mb-primary)] dark:text-secondary dark:border-secondary/30 hover:bg-[var(--mb-primary)]/5 dark:hover:bg-secondary/5 font-semibold rounded-xl transition-all duration-200"
                                >
                                    {config.secondaryLabel}
                                </Button>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[var(--mb-primary)] dark:hover:text-secondary transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>

                            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>Still having trouble?</span>
                                <a
                                    href="mailto:support@muscatbay.com"
                                    className="underline hover:text-[var(--mb-primary)] dark:hover:text-secondary transition-colors"
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

    return <LoadingSpinner message="Verifying your account..." />;
}
