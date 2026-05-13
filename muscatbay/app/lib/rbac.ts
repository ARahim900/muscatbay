/**
 * Role-based access control (RBAC) — single source of truth for who sees what.
 *
 * Used by:
 *   - components/auth/require-role.tsx  (route gating)
 *   - components/layout/sidebar.tsx     (nav item visibility)
 *   - components/layout/bottom-nav.tsx  (mobile nav)
 *
 * Mirrors the Supabase RLS policies in sql/migrations/20260513_rbac.sql.
 * If you change ROLE_MODULES here, also update the matching RLS policy.
 */

export type Role = "admin" | "manager" | "operator" | "contractor" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
    admin: "Administrator",
    manager: "Manager",
    operator: "Operator",
    contractor: "Contractor",
    viewer: "Viewer",
};

/** All app modules that can be gated. Keep route keys aligned with `app/<route>` folders. */
export type ModuleKey =
    | "dashboard"
    | "water"
    | "electricity"
    | "stp"
    | "contractors"
    | "hvac"
    | "assets"
    | "pest-control"
    | "firefighting"
    | "settings";

/** Which modules each role can see. Roles inherit nothing — list exhaustively. */
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
    admin: [
        "dashboard", "water", "electricity", "stp",
        "contractors", "hvac", "assets", "pest-control", "firefighting",
        "settings",
    ],
    manager: [
        "dashboard", "water", "electricity", "stp",
        "contractors", "hvac", "assets", "pest-control", "firefighting",
        "settings",
    ],
    operator: [
        "dashboard", "water", "electricity", "stp",
        "hvac", "assets", "pest-control", "firefighting",
        "settings",
    ],
    contractor: [
        // Contractors see only their assigned module(s). Default: HVAC.
        // Override per-user via user_profiles.module_scope (JSONB array) if needed.
        "dashboard", "hvac", "settings",
    ],
    viewer: [
        // Read-only board-presentation profile.
        "dashboard", "water", "electricity", "stp", "settings",
    ],
};

/** Module → route mapping (used by sidebar + bottom-nav). */
export const MODULE_ROUTE: Record<ModuleKey, string> = {
    "dashboard": "/",
    "water": "/water",
    "electricity": "/electricity",
    "stp": "/stp",
    "contractors": "/contractors",
    "hvac": "/hvac",
    "assets": "/assets",
    "pest-control": "/pest-control",
    "firefighting": "/firefighting",
    "settings": "/settings",
};

/** Reverse map for resolving the current pathname back to a ModuleKey. */
const ROUTE_TO_MODULE: Record<string, ModuleKey> = Object.fromEntries(
    Object.entries(MODULE_ROUTE).map(([k, v]) => [v, k as ModuleKey])
) as Record<string, ModuleKey>;
const MODULE_ROUTE_ENTRIES = Object.entries(MODULE_ROUTE) as Array<[ModuleKey, string]>;

export function resolveModuleFromPathname(pathname: string): ModuleKey | null {
    // Match exact first, then prefix (e.g. /firefighting/quotes → firefighting)
    if (ROUTE_TO_MODULE[pathname]) return ROUTE_TO_MODULE[pathname];
    for (const [mod, route] of MODULE_ROUTE_ENTRIES) {
        if (route === "/") continue; // skip catch-all
        if (pathname.startsWith(route + "/") || pathname === route) return mod;
    }
    return null;
}

/** Normalize an arbitrary string from the DB into a Role.
 *
 * Default is "admin" — chosen for backward compatibility: every existing
 * account in the database predates the RBAC migration and has either no
 * role or the legacy `'user'` value. We do NOT want to silently strip
 * their access. Once the migration in
 * `sql/migrations/20260513_rbac_role_column_and_rls.sql` is applied and
 * explicit roles are assigned, anyone NOT set to admin is restricted
 * deliberately.
 *
 * If you'd rather be safe-by-default (viewer until explicitly promoted),
 * change the fallback below — but plan to assign admin to all existing
 * users at the same time, or they will lose access.
 */
export function normalizeRole(raw: string | null | undefined): Role {
    if (!raw) return "admin";
    const r = raw.toLowerCase();
    if (r === "admin" || r === "manager" || r === "operator" || r === "contractor" || r === "viewer") {
        return r;
    }
    // Legacy values ("user", anything else) → admin until intentionally re-scoped.
    return "admin";
}

/** Does this role have access to the given module? */
export function canAccessModule(role: Role, module: ModuleKey): boolean {
    return ROLE_MODULES[role].includes(module);
}

/** Convenience: given role + pathname, are they allowed in? */
export function canAccessRoute(role: Role, pathname: string): boolean {
    const mod = resolveModuleFromPathname(pathname);
    if (!mod) return true; // unknown routes (e.g. /auth/*) are not RBAC-scoped here
    return canAccessModule(role, mod);
}
