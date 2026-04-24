"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import { validateEmail, validateFullName, getPasswordRequirements, checkRateLimit, resetRateLimit, recordRateLimitAttempt } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, Eye, EyeOff, User, CheckCircle2 } from "lucide-react";

type SignUpStatus =
    | { kind: "form" }
    | { kind: "check-email"; email: string }; // confirmation required, email sent

export default function SignUpPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [status, setStatus] = useState<SignUpStatus>({ kind: "form" });

    // Use enhanced password requirements from validation library
    const passwordRequirements = getPasswordRequirements(password);
    const allRequirementsMet = passwordRequirements.every((req) => req.met);

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailError(null);
    };

    const handleNameChange = (value: string) => {
        setFullName(value);
        setNameError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setEmailError(null);
        setNameError(null);

        // Rate limiting for signup
        const rateLimit = checkRateLimit('signup', 3, 60000, 600000);
        if (!rateLimit.isAllowed) {
            setError(`Too many signup attempts. Please try again in ${Math.ceil((rateLimit.waitSeconds || 600) / 60)} minutes.`);
            return;
        }

        // Validate full name
        const nameValidation = validateFullName(fullName);
        if (!nameValidation.isValid) {
            setNameError(nameValidation.error || 'Invalid name');
            return;
        }

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error || 'Invalid email');
            return;
        }

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
            const data = await signUp(email, password, fullName);
            resetRateLimit('signup');

            // Supabase signUp response shape:
            //  - new user + confirmation off: { user, session }       → logged in
            //  - new user + confirmation on:  { user (identities:[*]), session: null } → email sent
            //  - existing user:               { user (identities:[]), session: null }  → already registered
            const sUser = data?.user;
            const identities = sUser?.identities ?? [];
            const session = data?.session;

            if (sUser && identities.length === 0) {
                // Supabase returned a shadow user — this email is already registered.
                // Don't reveal too much (prevents enumeration); point the user at login.
                setError("An account with this email may already exist. Try signing in, or reset your password.");
                return;
            }

            if (!session) {
                // Email confirmation is enabled — tell the user to check their inbox
                // instead of silently bouncing them through the protected-route redirect.
                setStatus({ kind: "check-email", email: email.trim().toLowerCase() });
                return;
            }

            // Session present — user is logged in, redirect to dashboard
            router.push("/");
            router.refresh();
            return;
        } catch (err: unknown) {
            recordRateLimitAttempt('signup');
            const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ── "Check your email" success state (email confirmation required) ──
    if (status.kind === "check-email") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md card-elevated">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-mb-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-mb-success-text" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            We&apos;ve sent a confirmation link to{" "}
                            <strong className="text-slate-700 dark:text-slate-200">{status.email}</strong>.
                            Click the link in the email to activate your account, then sign in.
                        </p>
                        <div className="space-y-3">
                            <Link href="/login" className="block">
                                <Button className="w-full bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white">
                                    Go to Login
                                </Button>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setStatus({ kind: "form" })}
                                className="text-sm text-slate-400 dark:text-slate-500 hover:text-[var(--mb-primary)] dark:hover:text-secondary transition-colors"
                            >
                                Use a different email
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--mb-primary)] flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">MB</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Muscat Bay</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-300">Operations Dashboard</p>
                        </div>
                    </div>
                </div>

                <Card className="card-elevated">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                        <CardDescription className="text-center">
                            Enter your details to get started
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-mb-danger-text bg-mb-danger-light rounded-lg border border-mb-danger/20">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        aria-describedby={nameError ? "name-error" : undefined}
                                        aria-invalid={nameError ? true : undefined}
                                        className={`pl-10 ${nameError ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="name"
                                        maxLength={100}
                                    />
                                </div>
                                {nameError && (
                                    <p id="name-error" className="text-xs text-destructive">{nameError}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@muscatbay.com"
                                        value={email}
                                        onChange={(e) => handleEmailChange(e.target.value)}
                                        aria-describedby={emailError ? "email-error" : undefined}
                                        aria-invalid={emailError ? true : undefined}
                                        className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {emailError && (
                                    <p id="email-error" className="text-xs text-destructive">{emailError}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password requirements */}
                                {password.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {passwordRequirements.map((req) => (
                                            <div key={req.label} className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${req.met ? "bg-mb-success" : "bg-slate-300"}`} />
                                                <span className={req.met ? "text-mb-success-text" : "text-slate-500"}>
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
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        aria-describedby={confirmPassword.length > 0 && password !== confirmPassword ? "confirm-password-error" : undefined}
                                        aria-invalid={confirmPassword.length > 0 && password !== confirmPassword ? true : undefined}
                                        className="pl-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                {confirmPassword.length > 0 && password !== confirmPassword && (
                                    <p id="confirm-password-error" className="text-xs text-destructive">Passwords do not match</p>
                                )}
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
                                        Creating account...
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </Button>

                            <p className="text-sm text-center text-slate-500 dark:text-slate-300">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[var(--mb-primary)] hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">
                                        or
                                    </span>
                                </div>
                            </div>

                            <Link href="/signup/professional" className="block">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-[var(--mb-primary)]/30 text-[var(--mb-primary)] hover:bg-[var(--mb-primary)]/5"
                                >
                                    Apply as a Professional / Contractor
                                </Button>
                            </Link>
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-xs text-slate-500 dark:text-slate-300 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
