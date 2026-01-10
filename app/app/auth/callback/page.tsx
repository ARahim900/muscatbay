"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/';
            const errorDescription = searchParams.get('error_description');

            if (errorDescription) {
                setError(errorDescription);
                return;
            }

            if (code) {
                const supabase = getSupabaseClient();
                if (!supabase) {
                    setError('Supabase configuration missing');
                    return;
                }

                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        setError(error.message);
                    } else {
                        // Successful exchange - clean up URL and redirect
                        // Verify we have a session
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
                // No code implies we might already be logged in or just visited the page directly
                // Check session
                const supabase = getSupabaseClient();
                if (!supabase) {
                    router.push('/login');
                    return;
                }
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
