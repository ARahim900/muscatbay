"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { canAccessModule, type ModuleKey, ROLE_LABEL } from "@/lib/rbac";
import { useAuth } from "@/components/auth/auth-provider";
import { ShieldOff } from "lucide-react";

interface RequireRoleProps {
    /** Module key this route belongs to — see lib/rbac.ts ROLE_MODULES. */
    module: ModuleKey;
    /** Page contents to render when access is granted. */
    children: ReactNode;
}

/**
 * Wraps a page route. If the current user's role lacks access to the named
 * module, renders a "no access" panel instead of the children and (optionally)
 * redirects to the dashboard after a short delay.
 *
 * This is a soft gate — the hard gate is Supabase RLS on the underlying data.
 * UI hiding stops accidental discovery; RLS stops actual data access.
 */
export function RequireRole({ module, children }: RequireRoleProps) {
    const role = useUserRole();
    const { isDevMode } = useAuth();
    const router = useRouter();
    const allowed = isDevMode || canAccessModule(role, module);

    useEffect(() => {
        if (!allowed) {
            const t = setTimeout(() => router.push("/"), 4000);
            return () => clearTimeout(t);
        }
    }, [allowed, router]);

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
                        Returning you to the dashboard shortly.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                >
                    Go to dashboard now
                </button>
            </div>
        </div>
    );
}
