"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";
import { validateEmail, checkRateLimit, resetRateLimit, recordRateLimitAttempt } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff, Waves, Shield, BarChart3, Droplets } from "lucide-react";

export default function LoginPage() {
    return (
        <React.Suspense fallback={null}>
            <LoginContent />
        </React.Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Pick up error messages from auth callback redirects (?error=...)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
        }
    }, [searchParams]);

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setEmailError(null);

        const rateLimit = checkRateLimit('login', 5, 60000, 300000);
        if (!rateLimit.isAllowed) {
            setError(`Too many login attempts. Please try again in ${rateLimit.waitSeconds} seconds.`);
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error || 'Invalid email');
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            resetRateLimit('login');
            router.push("/");
            router.refresh();
        } catch (err: unknown) {
            recordRateLimitAttempt('login');
            const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">

                {/* Content */}
                <div className="flex flex-col justify-between w-full p-12">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 bg-white/10 rounded-2xl p-2 border border-white/20 shadow-2xl">
                            <Image
                                src="/logo.png"
                                alt="Muscat Bay Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Muscat Bay</h1>
                            <p className="text-secondary text-sm font-medium">Operations Dashboard</p>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                Smart Operations<br />
                                <span className="text-secondary">Management</span>
                            </h2>
                            <p className="text-white/90 text-lg max-w-md">
                                Monitor, analyze, and optimize your community infrastructure with real-time insights and intelligent reporting.
                            </p>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 group">
                                <Droplets className="h-6 w-6 text-secondary mb-2 transition-colors" />
                                <h3 className="text-white font-semibold text-sm">Water Systems</h3>
                                <p className="text-white/85 text-xs mt-1">Real-time monitoring</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 group">
                                <BarChart3 className="h-6 w-6 text-secondary mb-2 transition-colors" />
                                <h3 className="text-white font-semibold text-sm">Analytics</h3>
                                <p className="text-white/85 text-xs mt-1">Data-driven insights</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 group">
                                <Waves className="h-6 w-6 text-secondary mb-2 transition-colors" />
                                <h3 className="text-white font-semibold text-sm">STP Plants</h3>
                                <p className="text-white/85 text-xs mt-1">Treatment tracking</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 group">
                                <Shield className="h-6 w-6 text-secondary mb-2 transition-colors" />
                                <h3 className="text-white font-semibold text-sm">Security</h3>
                                <p className="text-white/85 text-xs mt-1">Enterprise-grade</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-white/40 text-sm">
                        &copy; 2026 Muscat Bay
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-primary rounded-xl p-2 shadow-lg">
                                <Image
                                    src="/logo.png"
                                    alt="Muscat Bay Logo"
                                    fill
                                    className="object-contain p-1"
                                    priority
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Muscat Bay</h1>
                                <p className="text-sm text-primary dark:text-secondary">Operations Dashboard</p>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Welcome back
                        </h2>
                        <p className="text-slate-500 dark:text-slate-300">
                            Sign in to access your dashboard and manage operations
                        </p>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div id="password-error" role="alert" aria-live="assertive" className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 animate-in slide-in-from-top duration-200">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Email Address
                                </Label>
                                <div className="relative transition-all duration-200">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-primary' : 'text-slate-400'}`}>
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@muscatbay.com"
                                        value={email}
                                        onChange={(e) => handleEmailChange(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        aria-describedby={emailError ? "email-error" : undefined}
                                        aria-invalid={emailError ? true : undefined}
                                        className={`pl-12 h-12 rounded-xl border-2 transition-all duration-200 ${emailError
                                            ? 'border-red-500 focus:border-red-500'
                                            : focusedField === 'email'
                                                ? 'border-primary shadow-lg shadow-primary/10'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                            }`}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {emailError && (
                                    <p id="email-error" className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top duration-200">
                                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                                        Password
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-primary dark:text-secondary hover:underline font-medium transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative transition-all duration-200">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-primary' : 'text-slate-400'}`}>
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        aria-describedby={error ? "password-error" : undefined}
                                        aria-invalid={error ? true : undefined}
                                        className={`pl-12 pr-12 h-12 rounded-xl border-2 transition-all duration-200 ${focusedField === 'password'
                                            ? 'border-primary shadow-lg shadow-primary/10'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                            }`}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors duration-200"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <span>Sign in to Dashboard</span>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-800/50 px-3 text-slate-400">
                                        New to Muscat Bay?
                                    </span>
                                </div>
                            </div>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center justify-center w-full h-12 border-2 border-primary/20 hover:border-primary text-primary dark:text-secondary dark:border-secondary/20 dark:hover:border-secondary font-semibold rounded-xl transition-all duration-200 hover:bg-primary/5 dark:hover:bg-secondary/5"
                                >
                                    Create an account
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                            By signing in, you agree to our{' '}
                            <Link href="/terms" className="text-primary dark:text-secondary hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-primary dark:text-secondary hover:underline">
                                Privacy Policy
                            </Link>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
                            © 2026 Muscat Bay. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
