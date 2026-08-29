"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { getPasswordRequirements } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import {
    clearRecoveryHandoff,
    hasRecoveryHandoff,
    markRecoveryHandoff,
} from "@/lib/auth-recovery";

/**
 * Whether this page load is entitled to show the form.
 *
 * `denied` carries its reason so the page can say which thing went wrong
 * instead of showing one blurred message for two different situations.
 */
type Gate =
    | { status: "checking" }
    | { status: "allowed" }
    | { status: "denied"; reason: "unconfigured" | "no-recovery" };

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [gate, setGate] = useState<Gate>({ status: "checking" });

    // Password requirements
    const passwordRequirements = getPasswordRequirements(password);
    const allRequirementsMet = passwordRequirements.every((req) => req.met);

    // A live session is NOT on its own evidence that a reset link was
    // followed: an ordinary signed-in user reaching this URL — a typed
    // address, a bookmark, a stale tab, a shared control-room tablet — has
    // one too, and the old check let them straight through to the form.
    //
    // So require both a session (to have something to call updateUser with)
    // AND proof that this tab redeemed a recovery link. See
    // lib/auth-recovery.ts for why that proof is an explicit marker rather
    // than the PASSWORD_RECOVERY event alone: the link lands on
    // /auth/callback, which redeems it and only then navigates here, so the
    // event has already fired by the time this page mounts and a subscriber
    // here would never see it.
    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setGate({ status: "denied", reason: "unconfigured" });
            return;
        }

        let active = true;

        // Still subscribe: if a recovery is ever redeemed while this page is
        // mounted (a link pointed straight here, or Supabase's own
        // detectSessionInUrl processing a recovery hash), that event is
        // first-hand evidence and is recorded as such.
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
            if (event !== "PASSWORD_RECOVERY") return;
            markRecoveryHandoff();
            if (active) setGate({ status: "allowed" });
        });

        void (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!active) return;
            const entitled = Boolean(session) && hasRecoveryHandoff();
            // Never downgrade a decision the event above already made: these
            // two run concurrently and the await can settle second.
            setGate((current) =>
                current.status === "allowed"
                    ? current
                    : entitled
                        ? { status: "allowed" }
                        : { status: "denied", reason: "no-recovery" },
            );
        })();

        return () => {
            active = false;
            authListener.subscription.unsubscribe();
        };
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
            // The link has now been spent. Drop the marker so a later visit
            // to this URL on the same tab has to present a fresh one.
            clearRecoveryHandoff();
            setSuccess(true);
            // Sign out to force re-login with new password, or redirect to home?
            // Usually re-login is safer or just redirect to dashboard
            setTimeout(() => {
                router.push("/login?message=Password updated successfully");
            }, 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update password. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (gate.status === "checking") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted">
                <Loader2 className="h-10 w-10 motion-safe:animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md card-elevated">
                    <CardContent role="status" aria-live="polite" className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-mb-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-mb-success-text" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Password Updated</h2>
                        <p className="text-muted-foreground mb-6">
                            Your password has been successfully reset. Redirecting you to login...
                        </p>
                        <Button
                            onClick={() => router.push("/login")}
                            className="bg-mb-primary hover:bg-mb-primary-hover text-primary-foreground"
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No recovery link behind this page load. Say that plainly rather than
    // bouncing to the dashboard — a silent redirect would leave the user
    // guessing whether their reset worked.
    if (gate.status === "denied") {
        const unconfigured = gate.reason === "unconfigured";
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted p-4">
                <div
                    role="alert"
                    className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border border-mb-danger/30"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle aria-hidden="true" className="h-5 w-5 text-mb-danger-text" />
                        <h2 className="text-xl font-bold text-destructive">
                            {unconfigured
                                ? "Password reset unavailable"
                                : "This reset link is missing or expired"}
                        </h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        {unconfigured
                            ? "The app cannot reach its authentication service, so passwords cannot be changed right now. Please contact your administrator."
                            : "Open the most recent link from your password-reset email — this page can only set a new password straight after that link is followed. If the link has expired, request a new one."}
                    </p>
                    {!unconfigured && (
                        <Button
                            onClick={() => router.push("/forgot-password")}
                            className="w-full"
                        >
                            Request New Link
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-mb-primary flex items-center justify-center shadow-lg">
                            <span className="text-primary-foreground font-bold text-xl">MB</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground">Muscat Bay</h1>
                            <p className="text-sm text-muted-foreground">Operations Dashboard</p>
                        </div>
                    </div>
                </div>

                <Card className="card-elevated">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-center">Set new password</CardTitle>
                        <CardDescription className="text-center">
                            Please enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div id="reset-error" role="alert" className="p-3 text-sm text-mb-danger-text bg-mb-danger-light rounded-lg border border-mb-danger/20">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password <span aria-hidden="true" className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        aria-describedby={password.length > 0 ? "password-requirements" : undefined}
                                        className="ps-10 pe-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password requirements */}
                                {password.length > 0 && (
                                    <div id="password-requirements" className="space-y-1 mt-2">
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${req.met ? "bg-mb-success" : "bg-border"}`} />
                                                <span className={req.met ? "text-mb-success-text" : "text-muted-foreground"}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password <span aria-hidden="true" className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        aria-invalid={error ? true : undefined}
                                        aria-describedby={error ? "reset-error" : undefined}
                                        className="ps-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-mb-primary hover:bg-mb-primary-hover text-primary-foreground"
                                disabled={loading || !allRequirementsMet}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
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
