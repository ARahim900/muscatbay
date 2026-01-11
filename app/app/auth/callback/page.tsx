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
                setError('Supabase configuration missing');
                return;
            }

            // Get parameters from query string
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/';
            const errorDescription = searchParams.get('error_description');

            if (errorDescription) {
                setError(errorDescription);
                return;
            }

            // Handle hash fragment (magic link / implicit flow)
            // Supabase may send tokens as hash fragments: #access_token=...&type=signup
            if (typeof window !== 'undefined' && window.location.hash) {
                const hashParams = new URLSearchParams(
                    window.location.hash.substring(1) // Remove the leading '#'
                );
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const hashError = hashParams.get('error_description');

                if (hashError) {
                    setError(hashError);
                    return;
                }

                // Handle email confirmation or recovery via hash fragment
                if (accessToken && (type === 'signup' || type === 'recovery' || type === 'magiclink')) {
                    try {
                        // Set the session from the token in the hash
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (sessionError) {
                            setError(sessionError.message);
                            return;
                        }

                        // Clear the hash from the URL for cleaner navigation
                        window.history.replaceState(null, '', window.location.pathname);

                        // For recovery (password reset), redirect to reset page
                        if (type === 'recovery') {
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

            // Handle PKCE code flow (query parameter: ?code=...)
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        setError(exchangeError.message);
                    } else {
                        // Successful exchange - verify we have a session
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            router.push(next);
                            router.refresh();
                        } else {
                            setError('Failed to establish session');
                        }
                    }
                } catch (err) {
                    setError('An unexpected error occurred during authentication');
                    console.error(err);
                }
            } else {
                // No code or hash token - check if already logged in
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.push(next);
                } else {
                    router.push('/login');
                }
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full py-2 px-4 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Verifying your session...</p>
        </div>
    );
}
