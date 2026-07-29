"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import {
    canAccessModule,
    resolveModuleFromPathname,
    type ModuleKey,
    ROLE_LABEL,
} from "@/lib/rbac";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2, ShieldOff } from "lucide-react";

/**
 * How long to wait for the user's profile (and therefore their role) before
 * falling back to the least-privileged default. AuthProvider fetches the
 * profile in the background after auth resolves; until it lands the role
 * normalises to "viewer". Rendering the page during that window would flash
 * a false "no access" panel at an admin, and rendering the children would
 * leak a restricted module — so we hold a neutral "checking" state instead,
 * bounded so a permanently failing profile fetch can never brick the app.
 */
const PROFILE_GRACE_MS = 4000;

interface RequireRoleProps {
    /** Module key this route belongs to — see lib/rbac.ts ROLE_MODULES. */
    module: ModuleKey;
    /** Page contents to render when access is granted. */
    children: ReactNode;
}

/**
 * Wraps a page route. If the current user's role lacks access to the named
 * module, renders a "no access" panel instead of the children and redirects to
 * the dashboard after a short delay.
 *
 * This is a soft gate — the hard gate is Supabase RLS on the underlying data.
 * UI hiding stops accidental discovery; RLS stops actual data access.
 *
 * Fails closed: while the role is unknown the children are NOT rendered.
 */
export function RequireRole({ module, children }: RequireRoleProps) {
    const role = useUserRole();
    const { isDevMode, user, profile, loading } = useAuth();
    const router = useRouter();

    // Role is only trustworthy once the profile has landed (or the grace
    // window has expired, after which "viewer" is the deliberate fallback).
    const [graceExpired, setGraceExpired] = useState(false);
    const roleUnknown = !isDevMode && !loading && !!user && !profile && !graceExpired;

    useEffect(() => {
        if (!roleUnknown) return;
        const t = setTimeout(() => setGraceExpired(true), PROFILE_GRACE_MS);
        return () => clearTimeout(t);
    }, [roleUnknown]);

    const allowed = isDevMode || canAccessModule(role, module);

    // NOTE — there is deliberately no auto-redirect here any more.
    //
    // A blocked module used to bounce to the dashboard after 4 s. On a phone
    // that is indistinguishable from a crash: you tap a module, the page does
    // not render, and moments later you are back at the start screen. That is
    // precisely how this was reported on 2026-07-28 ("the app crashed and
    // restarted from the beginning"). Navigating away from a page the user
    // asked for, without them touching anything, is the wrong default — the
    // panel below explains the situation and offers an explicit way back.

    if (roleUnknown) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center"
            >
                <Loader2 className="h-5 w-5 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Checking your permissions…</p>
            </div>
        );
    }

    if (allowed) return <>{children}</>;

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-6">
            <div role="alert" className="max-w-md text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                    <ShieldOff className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">
                        Module not available for your role
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Your account is a <strong className="text-foreground">{ROLE_LABEL[role]}</strong> and this module is restricted.
                        Ask an administrator to change your role if you need access.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="min-h-11 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Go to dashboard
                </button>
            </div>
        </div>
    );
}

/**
 * App-wide route gate. Resolves the current pathname to a ModuleKey and applies
 * <RequireRole> automatically, so route access is enforced at the layout level
 * rather than depending on every page remembering to opt in. Mounted once in
 * `components/layout/client-layout.tsx`.
 *
 * Pathnames that map to no module (auth callbacks, /privacy, /terms, profile
 * pages) are not RBAC-scoped and pass straight through — those routes carry no
 * module data of their own.
 */
export function RouteRoleGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const moduleKey = resolveModuleFromPathname(pathname ?? "/");

    if (!moduleKey) return <>{children}</>;

    return <RequireRole module={moduleKey}>{children}</RequireRole>;
}
