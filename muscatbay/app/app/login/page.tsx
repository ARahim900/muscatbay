"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, signUp } from "@/lib/auth";
import {
    validateEmail,
    validateFullName,
    getPasswordRequirements,
    checkRateLimit,
    resetRateLimit,
    recordRateLimitAttempt,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Waves,
    Shield,
    BarChart3,
    Droplets,
    LogIn,
    UserPlus,
    User,
    Briefcase,
    CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    // Dialog state
    const [showSignIn, setShowSignIn] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);

    // Sign In form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginEmailError, setLoginEmailError] = useState<string | null>(null);
    const [loginFocusedField, setLoginFocusedField] = useState<string | null>(null);

    // Sign Up form state
    const [signUpFullName, setSignUpFullName] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [signUpLoading, setSignUpLoading] = useState(false);
    const [signUpError, setSignUpError] = useState<string | null>(null);
    const [signUpEmailError, setSignUpEmailError] = useState<string | null>(null);
    const [signUpNameError, setSignUpNameError] = useState<string | null>(null);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    // Password requirements for sign up
    const passwordRequirements = getPasswordRequirements(signUpPassword);
    const allRequirementsMet = passwordRequirements.every((req) => req.met);

    // Reset sign in form
    const resetSignInForm = () => {
        setLoginEmail("");
        setLoginPassword("");
        setLoginError(null);
        setLoginEmailError(null);
        setLoginFocusedField(null);
    };

    // Reset sign up form
    const resetSignUpForm = () => {
        setSignUpFullName("");
        setSignUpEmail("");
        setSignUpPassword("");
        setSignUpConfirmPassword("");
        setSignUpError(null);
        setSignUpEmailError(null);
        setSignUpNameError(null);
        setSignUpSuccess(false);
    };

    // Handle Sign In
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setLoginEmailError(null);

        const rateLimit = checkRateLimit("login", 5, 60000, 300000);
        if (!rateLimit.isAllowed) {
            setLoginError(
                `Too many login attempts. Please try again in ${rateLimit.waitSeconds} seconds.`
            );
            return;
        }

        const emailValidation = validateEmail(loginEmail);
        if (!emailValidation.isValid) {
            setLoginEmailError(emailValidation.error || "Invalid email");
            return;
        }

        if (!loginPassword) {
            setLoginError("Please enter your password");
            return;
        }

        setLoginLoading(true);

        try {
            await signIn(loginEmail, loginPassword);
            resetRateLimit("login");
            router.push("/");
            router.refresh();
        } catch (err: unknown) {
            recordRateLimitAttempt("login");
            const errorMessage =
                err instanceof Error ? err.message : "Invalid email or password";
            setLoginError(errorMessage);
        } finally {
            setLoginLoading(false);
        }
    };

    // Handle Sign Up
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignUpError(null);
        setSignUpEmailError(null);
        setSignUpNameError(null);

        const rateLimit = checkRateLimit("signup", 3, 60000, 600000);
        if (!rateLimit.isAllowed) {
            setSignUpError(
                `Too many signup attempts. Please try again in ${Math.ceil(
                    (rateLimit.waitSeconds || 600) / 60
                )} minutes.`
            );
            return;
        }

        const nameValidation = validateFullName(signUpFullName);
        if (!signUpFullName.trim()) {
            setSignUpNameError("Full name is required");
            return;
        } else if (!nameValidation.isValid) {
            setSignUpNameError(nameValidation.error || "Invalid name");
            return;
        }

        const emailValidation = validateEmail(signUpEmail);
        if (!emailValidation.isValid) {
            setSignUpEmailError(emailValidation.error || "Invalid email");
            return;
        }

        if (signUpPassword !== signUpConfirmPassword) {
            setSignUpError("Passwords do not match");
            return;
        }

        if (!allRequirementsMet) {
            setSignUpError("Please meet all password requirements");
            return;
        }

        setSignUpLoading(true);

        try {
            await signUp(signUpEmail, signUpPassword, signUpFullName);
            resetRateLimit("signup");
            setSignUpSuccess(true);
        } catch (err: unknown) {
            recordRateLimitAttempt("signup");
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to create account. Please try again.";
            setSignUpError(errorMessage);
        } finally {
            setSignUpLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4E4456] via-[#5f5168] to-[#3A3341]">
                    {/* Animated Shapes */}
                    <div className="absolute top-20 left-20 w-72 h-72 bg-[#A8D5E3]/20 rounded-full blur-3xl animate-pulse" />
                    <div
                        className="absolute bottom-20 right-20 w-96 h-96 bg-[#A8D5E3]/15 rounded-full blur-3xl animate-pulse"
                        style={{ animationDelay: "1s" }}
                    />
                    <div
                        className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse"
                        style={{ animationDelay: "2s" }}
                    />

                    {/* Diagonal Lines Pattern */}
                    <svg
                        className="absolute inset-0 w-full h-full opacity-10"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <pattern
                                id="diagonalLines"
                                patternUnits="userSpaceOnUse"
                                width="40"
                                height="40"
                                patternTransform="rotate(45)"
                            >
                                <line
                                    x1="0"
                                    y="0"
                                    x2="0"
                                    y2="40"
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect
                            width="100%"
                            height="100%"
                            fill="url(#diagonalLines)"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between w-full p-12">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-2xl">
                            <Image
                                src="/logo.png"
                                alt="Muscat Bay Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Muscat Bay
                            </h1>
                            <p className="text-[#A8D5E3] text-sm font-medium">
                                Operations Dashboard
                            </p>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                Smart Operations
                                <br />
                                <span className="text-[#A8D5E3]">Management</span>
                            </h2>
                            <p className="text-white/70 text-lg max-w-md">
                                Monitor, analyze, and optimize your community
                                infrastructure with real-time insights and intelligent
                                reporting.
                            </p>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                                <Droplets className="h-6 w-6 text-[#A8D5E3] mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-white font-semibold text-sm">
                                    Water Systems
                                </h3>
                                <p className="text-white/60 text-xs mt-1">
                                    Real-time monitoring
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                                <BarChart3 className="h-6 w-6 text-[#A8D5E3] mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-white font-semibold text-sm">
                                    Analytics
                                </h3>
                                <p className="text-white/60 text-xs mt-1">
                                    Data-driven insights
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                                <Waves className="h-6 w-6 text-[#A8D5E3] mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-white font-semibold text-sm">
                                    STP Plants
                                </h3>
                                <p className="text-white/60 text-xs mt-1">
                                    Treatment tracking
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                                <Shield className="h-6 w-6 text-[#A8D5E3] mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-white font-semibold text-sm">
                                    Security
                                </h3>
                                <p className="text-white/60 text-xs mt-1">
                                    Enterprise-grade
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="flex gap-8">
                        <div>
                            <p className="text-3xl font-bold text-white">350+</p>
                            <p className="text-white/60 text-sm">Active Meters</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">24/7</p>
                            <p className="text-white/60 text-sm">Monitoring</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-white/60 text-sm">Uptime</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Welcome & Auth Options */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-[#4E4456] rounded-xl p-2 shadow-lg">
                                <Image
                                    src="/logo.png"
                                    alt="Muscat Bay Logo"
                                    fill
                                    className="object-contain p-1"
                                    priority
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Muscat Bay
                                </h1>
                                <p className="text-sm text-[#4E4456] dark:text-[#A8D5E3]">
                                    Operations Dashboard
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                            Welcome to Muscat Bay
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Access your operations dashboard or create a new account
                        </p>
                    </div>

                    {/* Auth Option Cards */}
                    <div className="space-y-4">
                        {/* Sign In Card */}
                        <button
                            onClick={() => {
                                resetSignInForm();
                                setShowSignIn(true);
                            }}
                            className="w-full group"
                        >
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#4E4456]/30 dark:hover:border-[#A8D5E3]/30 active:scale-[0.98]">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4E4456] to-[#5f5168] flex items-center justify-center shadow-lg shadow-[#4E4456]/20 group-hover:shadow-xl group-hover:shadow-[#4E4456]/30 transition-all duration-300">
                                    <LogIn className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Sign In
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Access your existing account
                                    </p>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 group-hover:text-[#4E4456] dark:group-hover:text-[#A8D5E3] transition-colors">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </button>

                        {/* Sign Up Card */}
                        <button
                            onClick={() => {
                                resetSignUpForm();
                                setShowSignUp(true);
                            }}
                            className="w-full group"
                        >
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#4E4456]/30 dark:hover:border-[#A8D5E3]/30 active:scale-[0.98]">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#A8D5E3] to-[#7EC8E3] flex items-center justify-center shadow-lg shadow-[#A8D5E3]/20 group-hover:shadow-xl group-hover:shadow-[#A8D5E3]/30 transition-all duration-300">
                                    <UserPlus className="h-6 w-6 text-[#3A3341]" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Sign Up
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Create a new account
                                    </p>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 group-hover:text-[#4E4456] dark:group-hover:text-[#A8D5E3] transition-colors">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Professional Application Link */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-3 text-slate-400">
                                    For Contractors
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <Link
                                href="/signup/professional"
                                className="inline-flex items-center gap-2 text-sm text-[#4E4456] dark:text-[#A8D5E3] hover:underline font-medium transition-colors"
                            >
                                <Briefcase className="h-4 w-4" />
                                Apply as a Professional / Contractor
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            By continuing, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="text-[#4E4456] dark:text-[#A8D5E3] hover:underline"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="text-[#4E4456] dark:text-[#A8D5E3] hover:underline"
                            >
                                Privacy Policy
                            </Link>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            &copy; 2026 Muscat Bay. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== SIGN IN DIALOG ===== */}
            <Dialog open={showSignIn} onOpenChange={(open) => setShowSignIn(open)}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            Sign In
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Enter your credentials to access the dashboard
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSignIn} className="space-y-5">
                        {/* Error Message */}
                        {loginError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                                {loginError}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="login-email"
                                className="text-slate-700 dark:text-slate-300 font-medium"
                            >
                                Email Address
                            </Label>
                            <div
                                className={`relative transition-all duration-300 ${
                                    loginFocusedField === "email"
                                        ? "scale-[1.01]"
                                        : ""
                                }`}
                            >
                                <div
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        loginFocusedField === "email"
                                            ? "text-[#4E4456]"
                                            : "text-slate-400"
                                    }`}
                                >
                                    <Mail className="h-4 w-4" />
                                </div>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@muscatbay.com"
                                    value={loginEmail}
                                    onChange={(e) => {
                                        setLoginEmail(e.target.value);
                                        setLoginEmailError(null);
                                    }}
                                    onFocus={() =>
                                        setLoginFocusedField("email")
                                    }
                                    onBlur={() => setLoginFocusedField(null)}
                                    className={`pl-10 h-11 rounded-xl border-2 transition-all duration-300 ${
                                        loginEmailError
                                            ? "border-red-500 focus:border-red-500"
                                            : loginFocusedField === "email"
                                            ? "border-[#4E4456] shadow-md shadow-[#4E4456]/10"
                                            : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                                    }`}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            {loginEmailError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full" />
                                    {loginEmailError}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="login-password"
                                    className="text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    Password
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-[#4E4456] dark:text-[#A8D5E3] hover:underline font-medium transition-colors"
                                    onClick={() => setShowSignIn(false)}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div
                                className={`relative transition-all duration-300 ${
                                    loginFocusedField === "password"
                                        ? "scale-[1.01]"
                                        : ""
                                }`}
                            >
                                <div
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        loginFocusedField === "password"
                                            ? "text-[#4E4456]"
                                            : "text-slate-400"
                                    }`}
                                >
                                    <Lock className="h-4 w-4" />
                                </div>
                                <Input
                                    id="login-password"
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={loginPassword}
                                    onChange={(e) =>
                                        setLoginPassword(e.target.value)
                                    }
                                    onFocus={() =>
                                        setLoginFocusedField("password")
                                    }
                                    onBlur={() => setLoginFocusedField(null)}
                                    className={`pl-10 pr-10 h-11 rounded-xl border-2 transition-all duration-300 ${
                                        loginFocusedField === "password"
                                            ? "border-[#4E4456] shadow-md shadow-[#4E4456]/10"
                                            : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                                    }`}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowLoginPassword(!showLoginPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4E4456] transition-colors duration-200"
                                >
                                    {showLoginPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-[#4E4456] to-[#5f5168] hover:from-[#3A3341] hover:to-[#4E4456] text-white font-semibold rounded-xl shadow-lg shadow-[#4E4456]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#4E4456]/30 active:scale-[0.98]"
                            disabled={loginLoading}
                        >
                            {loginLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </Button>

                        {/* Switch to Sign Up */}
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                            Don&apos;t have an account?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSignIn(false);
                                    resetSignUpForm();
                                    setShowSignUp(true);
                                }}
                                className="text-[#4E4456] dark:text-[#A8D5E3] hover:underline font-medium"
                            >
                                Sign Up
                            </button>
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ===== SIGN UP DIALOG ===== */}
            <Dialog open={showSignUp} onOpenChange={(open) => setShowSignUp(open)}>
                <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            {signUpSuccess ? "Check Your Email" : "Create Account"}
                        </DialogTitle>
                        {!signUpSuccess && (
                            <DialogDescription className="text-center">
                                Enter your details to get started
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {signUpSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                We&apos;ve sent a confirmation link to{" "}
                                <strong>{signUpEmail}</strong>. Please check your
                                inbox and click the link to activate your account.
                            </p>
                            <Button
                                onClick={() => {
                                    setShowSignUp(false);
                                    resetSignInForm();
                                    setShowSignIn(true);
                                }}
                                className="bg-gradient-to-r from-[#4E4456] to-[#5f5168] hover:from-[#3A3341] hover:to-[#4E4456] text-white"
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            {/* Error Message */}
                            {signUpError && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                                    {signUpError}
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="signup-name"
                                    className="text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="signup-name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={signUpFullName}
                                        onChange={(e) => {
                                            setSignUpFullName(e.target.value);
                                            setSignUpNameError(null);
                                        }}
                                        className={`pl-10 h-11 rounded-xl border-2 ${
                                            signUpNameError
                                                ? "border-red-500"
                                                : "border-slate-200 dark:border-slate-600"
                                        }`}
                                        required
                                        autoComplete="name"
                                        maxLength={100}
                                    />
                                </div>
                                {signUpNameError && (
                                    <p className="text-xs text-red-500">
                                        {signUpNameError}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="signup-email"
                                    className="text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="name@muscatbay.com"
                                        value={signUpEmail}
                                        onChange={(e) => {
                                            setSignUpEmail(e.target.value);
                                            setSignUpEmailError(null);
                                        }}
                                        className={`pl-10 h-11 rounded-xl border-2 ${
                                            signUpEmailError
                                                ? "border-red-500"
                                                : "border-slate-200 dark:border-slate-600"
                                        }`}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {signUpEmailError && (
                                    <p className="text-xs text-red-500">
                                        {signUpEmailError}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="signup-password"
                                    className="text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="signup-password"
                                        type={
                                            showSignUpPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Create a password"
                                        value={signUpPassword}
                                        onChange={(e) =>
                                            setSignUpPassword(e.target.value)
                                        }
                                        className="pl-10 pr-10 h-11 rounded-xl border-2 border-slate-200 dark:border-slate-600"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowSignUpPassword(
                                                !showSignUpPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showSignUpPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* Password requirements */}
                                {signUpPassword.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {passwordRequirements.map(
                                            (req, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            req.met
                                                                ? "bg-emerald-500"
                                                                : "bg-slate-300"
                                                        }`}
                                                    />
                                                    <span
                                                        className={
                                                            req.met
                                                                ? "text-emerald-600"
                                                                : "text-slate-500"
                                                        }
                                                    >
                                                        {req.label}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="signup-confirm-password"
                                    className="text-slate-700 dark:text-slate-300 font-medium"
                                >
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="signup-confirm-password"
                                        type={
                                            showSignUpPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm your password"
                                        value={signUpConfirmPassword}
                                        onChange={(e) =>
                                            setSignUpConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        className="pl-10 h-11 rounded-xl border-2 border-slate-200 dark:border-slate-600"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                {signUpConfirmPassword.length > 0 &&
                                    signUpPassword !== signUpConfirmPassword && (
                                        <p className="text-xs text-red-500">
                                            Passwords do not match
                                        </p>
                                    )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-[#4E4456] to-[#5f5168] hover:from-[#3A3341] hover:to-[#4E4456] text-white font-semibold rounded-xl shadow-lg shadow-[#4E4456]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#4E4456]/30 active:scale-[0.98]"
                                disabled={
                                    signUpLoading || !allRequirementsMet
                                }
                            >
                                {signUpLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    <span>Create Account</span>
                                )}
                            </Button>

                            {/* Professional signup link */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                                        or
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/signup/professional"
                                className="block"
                                onClick={() => setShowSignUp(false)}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-xl border-2 border-[#4E4456]/20 text-[#4E4456] hover:bg-[#4E4456]/5 dark:text-[#A8D5E3] dark:border-[#A8D5E3]/20 dark:hover:bg-[#A8D5E3]/5"
                                >
                                    <Briefcase className="h-4 w-4 mr-2" />
                                    Apply as a Professional / Contractor
                                </Button>
                            </Link>

                            {/* Switch to Sign In */}
                            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSignUp(false);
                                        resetSignInForm();
                                        setShowSignIn(true);
                                    }}
                                    className="text-[#4E4456] dark:text-[#A8D5E3] hover:underline font-medium"
                                >
                                    Sign In
                                </button>
                            </p>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
