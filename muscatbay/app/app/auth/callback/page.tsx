"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Loading authentication...</p>
            </div>
        }>
            <AuthCallbackContent />
        </React.Suspense>
    );
}

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                setError('Authentication service is not available. Please try again later.');
                return;
            }

            // Get parameters from query string
            const code = searchParams.get('code');
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type') as 'signup' | 'recovery' | 'email' | 'magiclink' | null;
            const next = searchParams.get('next') || '/';
            const errorParam = searchParams.get('error_description') || searchParams.get('error');

            if (errorParam) {
                setError(errorParam);
                return;
            }

            // ── Flow 1: PKCE code exchange (?code=...) ──
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        console.error('PKCE exchange error:', exchangeError.message);
                        setError(exchangeError.message);
                        return;
                    }
                    router.push(next);
                    router.refresh();
                    return;
                } catch (err) {
                    console.error('PKCE exchange exception:', err);
                    // Fall through to try other methods
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
                        setError(verifyError.message);
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

                if (hashError) {
                    setError(hashError);
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
                            setError(sessionError.message);
                            return;
                        }

                        // Clear hash from URL
                        window.history.replaceState(null, '', window.location.pathname);

                        if (hashType === 'recovery') {
                            router.push('/auth/reset-password');
                        } else {
                            router.push('/');
                        }
                        router.refresh();
                        return;
                    } catch (err) {
                        console.error('Hash fragment auth error:', err);
                        setError('Failed to process authentication');
                        return;
                    }
                }
            }

            // ── Flow 4: No auth params — check if already logged in ──
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push(next);
            } else {
                setError('No verification token found. The link may have expired. Please try signing up again.');
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Authentication Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-2.5 px-4 bg-[var(--mb-primary)] text-white rounded-lg hover:bg-[var(--mb-primary-hover)] transition-colors font-medium"
                        >
                            Go to Login
                        </button>
                        <button
                            onClick={() => router.push('/signup')}
                            className="w-full py-2.5 px-4 bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            Sign Up Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--mb-primary)] mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Verifying your account...</p>
        </div>
    );
}
