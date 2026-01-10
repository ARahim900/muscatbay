"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import { validateEmail, validateFullName, getPasswordRequirements, checkRateLimit, resetRateLimit } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, Eye, EyeOff, User, CheckCircle2 } from "lucide-react";

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
    const [success, setSuccess] = useState(false);

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
            await signUp(email, password, fullName);
            resetRateLimit('signup');
            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="w-full max-w-md glass-card">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                            Please check your inbox and click the link to activate your account.
                        </p>
                        <Button
                            onClick={() => router.push("/login")}
                            className="bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white"
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
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
                        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                        <CardDescription className="text-center">
                            Enter your details to get started
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
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className={`pl-10 ${nameError ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="name"
                                        maxLength={100}
                                    />
                                </div>
                                {nameError && (
                                    <p className="text-xs text-red-500">{nameError}</p>
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
                                        className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {emailError && (
                                    <p className="text-xs text-red-500">{emailError}</p>
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
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                {confirmPassword.length > 0 && password !== confirmPassword && (
                                    <p className="text-xs text-red-500">Passwords do not match</p>
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

                            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[var(--mb-primary)] hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
