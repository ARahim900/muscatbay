"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { signIn } from "@/lib/auth";
import { validateEmail, checkRateLimit, resetRateLimit, recordRateLimitAttempt } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrandLockup } from "@/components/auth/brand-lockup";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

// The bay backdrop loads after the form is interactive — sign-in never waits on WebGL.
// next/dynamic runs the loader on FIRST RENDER, so gating the JSX below (see
// `mountAmbient`) also gates the three.js chunk download, not just its boot.
const AmbientBay = dynamic(() => import("@/components/three/ambient-bay"), { ssr: false });

/**
 * Network Information API — not in lib.dom, so the two fields we read are
 * declared here rather than reaching for `any`. Both are absent on Safari and
 * Firefox, which simply means "no reason to skip".
 */
interface NetworkInformationLike {
    saveData?: boolean;
    effectiveType?: string;
}

/**
 * Should the decorative water field be downloaded and booted at all?
 *
 * ambient-bay is already code-split and ssr:false, and it disposes cleanly —
 * but /login is the first route every unauthenticated visitor meets, and a
 * WebGL renderer plus an 8,100-point shader is a real cost on a phone over a
 * mobile link. The panel it decorates is purely ornamental: its token gradient
 * sits underneath and the page is complete without the canvas.
 *
 * Skip entirely when:
 *   - reduced motion is requested (the component would idle anyway, but the
 *     download is the cost that matters);
 *   - the connection reports Data Saver or a 2g-class effective type;
 *   - the viewport is below `lg`, where the brand panel is `hidden` and the
 *     canvas would never be seen.
 *
 * Evaluated once, at idle. A visitor who later widens a narrow window keeps the
 * gradient — deliberately, since re-checking on resize would hand the heaviest
 * asset on the page to someone who has already started reading the form.
 */
function shouldMountAmbientBay(): boolean {
    if (prefersReducedMotion()) return false;

    // The panel is `hidden lg:flex` — 1024px is Tailwind's lg breakpoint.
    if (!window.matchMedia("(min-width: 1024px)").matches) return false;

    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    if (connection?.saveData) return false;
    if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return false;

    return true;
}

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
    const rootRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [mountAmbient, setMountAmbient] = useState(false);

    // Defer the WebGL backdrop until the browser is idle, and only where it
    // earns its weight (see shouldMountAmbientBay). Signing in never competes
    // with three.js for bandwidth or main-thread time.
    useEffect(() => {
        if (!shouldMountAmbientBay()) return;

        const mount = () => setMountAmbient(true);

        // requestIdleCallback is unavailable on Safari < 17 — fall back to a
        // timeout well past first interaction.
        if (typeof window.requestIdleCallback === "function") {
            const handle = window.requestIdleCallback(mount, { timeout: 2500 });
            return () => window.cancelIdleCallback(handle);
        }
        const handle = window.setTimeout(mount, 1500);
        return () => window.clearTimeout(handle);
    }, []);

    // Entrance choreography: brand panel and form settle in as one sequence.
    // DOM order drives the stagger, so the story reads logo → headline →
    // capability list → form. Skipped entirely under prefers-reduced-motion.
    useIsomorphicLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
            if (items.length === 0) return;
            // .gsap-lift promotes each revealed surface to its own layer so the
            // first frame doesn't pay for the promotion mid-tween. It is added
            // here rather than in JSX, and dropped on completion, because
            // will-change costs memory for as long as it is set and this
            // timeline runs exactly once — the form then re-renders on every
            // keystroke, which would reinstate a JSX-declared class forever.
            items.forEach((el) => el.classList.add("gsap-lift"));
            gsap.set(items, { autoAlpha: 0, y: 22 });
            gsap.to(items, {
                autoAlpha: 1,
                y: 0,
                duration: MOTION.dur.lg,
                ease: MOTION.ease.outExpo,
                stagger: MOTION.stagger.base,
                delay: 0.05,
                clearProps: "opacity,visibility,transform",
                onComplete: () => items.forEach((el) => el.classList.remove("gsap-lift")),
            });
        }, root);
        return () => {
            ctx.revert();
            // Unmounting mid-entrance must not strand the hint on the nodes.
            root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.remove("gsap-lift"));
        };
    }, []);

    // Pick up error/success messages from redirects (?error=... or ?message=...)
    // — e.g. reset-password routes back here with a success message.
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
        }
        const messageParam = searchParams.get('message');
        if (messageParam) {
            setSuccessMessage(messageParam);
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
        <div ref={rootRef} className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary bg-[linear-gradient(150deg,var(--primary)_0%,var(--sidebar)_100%)]">

                {/* Ambient bay water field — the literal subject of the brand.
                    Decorative and gated: the panel's own gradient is the
                    fallback whenever the canvas is skipped. */}
                <div className="absolute inset-0" aria-hidden="true">
                    {mountAmbient && <AmbientBay className="absolute inset-0" intensity="bold" />}
                    <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_80%_-10%,color-mix(in_srgb,var(--secondary)_14%,transparent),transparent_60%)]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between w-full p-12">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4" data-reveal>
                        <div className="relative w-14 h-14 bg-white/10 rounded-2xl p-2 border border-white/20 shadow-2xl">
                            <Image
                                src="/logo.png"
                                alt="Muscat Bay Logo"
                                fill
                                sizes="56px"
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">Muscat Bay</h1>
                            <p className="text-secondary text-sm font-medium">Operations Dashboard</p>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="space-y-8">
                        <div data-reveal>
                            <h2 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
                                Smart Operations<br />
                                <span className="text-secondary">Management</span>
                            </h2>
                            <p className="text-primary-foreground/90 text-lg max-w-md">
                                Monitor, analyze, and optimize your community infrastructure with real-time insights and intelligent reporting.
                            </p>
                        </div>

                        {/* What the app covers.
                            NOTE: this panel renders BEFORE authentication, so it
                            has no access to any operational data — it must never
                            display readings, statuses or counts. A previous
                            version hardcoded "Water Production 2,847 m³ today",
                            "Electricity 148 kWh" and "STP Treated 892 m³" under a
                            "Live System Status" heading with pulsing status pills:
                            entirely fabricated figures presented as live telemetry.
                            Keep this list to capability names only. */}
                        <div className="space-y-2">
                            <p className="text-primary-foreground/50 text-[10px] font-semibold uppercase tracking-[0.14em]" data-reveal>
                                What you can manage
                            </p>

                            {([
                                { label: "Water", detail: "Supply chain, zone loss and meter-level consumption", color: "var(--module-water)" },
                                { label: "Electricity", detail: "Meter readings, load profile and tariff cost", color: "var(--module-electricity)" },
                                { label: "STP Plant", detail: "Daily inlet, treated irrigation output and recovery", color: "var(--module-stp)" },
                                { label: "Operations", detail: "Assets, contractors, HVAC, fire safety and pest control", color: "var(--module-assets)" },
                            ] as const).map((sys) => (
                                <div
                                    key={sys.label}
                                    data-reveal
                                    className="flex items-center gap-3 bg-white/[0.06] rounded-lg px-4 py-3 border border-white/[0.05] backdrop-blur-[2px]"
                                >
                                    {/* Module colour accent */}
                                    <div
                                        className="w-[3px] self-stretch rounded-full flex-shrink-0"
                                        aria-hidden="true"
                                        style={{ backgroundColor: sys.color }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-primary-foreground font-semibold text-sm leading-none mb-1">
                                            {sys.label}
                                        </p>
                                        <p className="text-primary-foreground/55 text-xs leading-snug">
                                            {sys.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Grounding footer — location only. Any figure here
                                would be an unverifiable claim shown to signed-out
                                visitors. */}
                            <div className="flex items-center gap-3 pt-0.5" data-reveal>
                                <span className="text-primary-foreground/40 text-xs">Muscat Bay, Oman</span>
                                <span aria-hidden="true" className="w-px h-2.5 bg-white/15 flex-shrink-0" />
                                <span className="text-primary-foreground/40 text-xs">Sign in to view live operations data</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-primary-foreground/40 text-sm" data-reveal>
                        &copy; 2026 Muscat Bay
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo — shared lockup (see components/auth/brand-lockup) */}
                    <div className="flex justify-center mb-8 lg:hidden" data-reveal>
                        <AuthBrandLockup />
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center lg:text-left mb-8" data-reveal>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Welcome back
                        </h2>
                        <p className="text-muted-foreground">
                            Sign in to access your dashboard and manage operations
                        </p>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-card rounded-2xl shadow-xl border border-border p-8" data-reveal>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Success Message (e.g. after password reset) */}
                            {successMessage && !error && (
                                <div role="status" aria-live="polite" className="p-4 text-sm text-mb-success-text bg-mb-success-light rounded-xl border border-mb-success/20 flex items-center gap-3 animate-in slide-in-from-top duration-200">
                                    <div className="w-2 h-2 bg-mb-success rounded-full" />
                                    {successMessage}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div id="password-error" role="alert" aria-live="assertive" className="p-4 text-sm text-mb-danger-text bg-mb-danger-light rounded-xl border border-mb-danger/20 flex items-center gap-3 animate-in slide-in-from-top duration-200">
                                    <div className="w-2 h-2 bg-mb-danger rounded-full animate-pulse" />
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground font-medium">
                                    Email Address <span aria-hidden="true" className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <div className={`absolute start-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>
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
                                        className={`ps-12 h-12 rounded-xl border-2 transition-design ${emailError
                                            ? 'border-destructive focus:border-destructive'
                                            : focusedField === 'email'
                                                ? 'border-primary shadow-lg shadow-primary/10'
                                                : 'border-border hover:border-muted-foreground/40'
                                            }`}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                {emailError && (
                                    <p id="email-error" className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top duration-200">
                                        <span className="w-1 h-1 bg-destructive rounded-full" />
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-foreground font-medium">
                                        Password <span aria-hidden="true" className="text-destructive">*</span>
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-primary dark:text-secondary hover:underline font-medium transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className={`absolute start-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`}>
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
                                        className={`ps-12 pe-12 h-12 rounded-xl border-2 transition-design ${focusedField === 'password'
                                            ? 'border-primary shadow-lg shadow-primary/10'
                                            : 'border-border hover:border-muted-foreground/40'
                                            }`}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 transition-design hover:shadow-xl"
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

                            {/* Divider — password sign-in vs Google OAuth */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-3 text-muted-foreground">
                                        or
                                    </span>
                                </div>
                            </div>

                            {/* Google OAuth — one button covers sign-in AND first-time
                                sign-up: Google has already verified the address, so new
                                users skip the confirmation-email round-trip entirely. */}
                            <div className="space-y-2">
                                <GoogleSignInButton
                                    onError={setError}
                                    className="h-12 rounded-xl border-2 border-border hover:border-muted-foreground/40 transition-design"
                                />
                                <p className="text-xs text-center text-muted-foreground">
                                    New here? Google creates your account instantly — no verification email needed.
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-3 text-muted-foreground">
                                        New to Muscat Bay?
                                    </span>
                                </div>
                            </div>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center justify-center w-full h-12 border-2 border-primary/20 hover:border-primary text-primary dark:text-secondary dark:border-secondary/20 dark:hover:border-secondary font-semibold rounded-xl transition-design hover:bg-primary/5 dark:hover:bg-secondary/5"
                                >
                                    Create an account
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center" data-reveal>
                        <p className="text-xs text-muted-foreground">
                            By signing in, you agree to our{' '}
                            <Link href="/terms" className="text-primary dark:text-secondary hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-primary dark:text-secondary hover:underline">
                                Privacy Policy
                            </Link>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            © 2026 Muscat Bay. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
