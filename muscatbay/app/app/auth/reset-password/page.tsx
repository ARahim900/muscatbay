"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { getPasswordRequirements } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(true);

    // Password requirements
    const passwordRequirements = getPasswordRequirements(password);
    const allRequirementsMet = passwordRequirements.every((req) => req.met);

    // Check if we have a valid session (which means the reset link worked)
    useEffect(() => {
        const checkSession = async () => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                setError("System configuration error");
                setVerifying(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Invalid or expired reset link. Please try again.");
            }
            setVerifying(false);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!allRequirementsMet) {
            setError("Please meet all password requirements");
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            setSuccess(true);
            // Sign out to force re-login with new password, or redirect to home?
            // Usually re-login is safer or just redirect to dashboard
            setTimeout(() => {
                router.push("/login?message=Password updated successfully");
            }, 3000);
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update password. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Verifying reset link...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="w-full max-w-md glass-card">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Password Updated</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Your password has been successfully reset. Redirecting you to login...
                        </p>
                        <Button
                            onClick={() => router.push("/login")}
                            className="bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white"
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !loading && !password) { // Show error state if session check failed
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Reset Password Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                    <Button
                        onClick={() => router.push('/forgot-password')}
                        className="w-full"
                    >
                        Request New Link
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
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

                <Card className="glass-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-center">Set new password</CardTitle>
                        <CardDescription className="text-center">
                            Please enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password requirements */}
                                {password.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${req.met ? "bg-emerald-500" : "bg-slate-300"}`} />
                                                <span className={req.met ? "text-emerald-600" : "text-slate-500"}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white"
                                disabled={loading || !allRequirementsMet}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Reset password"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
