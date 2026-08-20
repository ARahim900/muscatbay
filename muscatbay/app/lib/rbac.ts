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
    | "monitoring"
    | "settings";

/** Every module in the app, in sidebar order. */
const ALL_MODULES: ModuleKey[] = [
    "dashboard", "water", "electricity", "stp",
    "contractors", "hvac", "assets", "pest-control", "firefighting",
    "monitoring", "settings",
];

/**
 * Which modules each role can see.
 *
 * **Every role sees every module — decided by the owner on 2026-07-29.**
 *
 * This map used to differ per role, and that caused a real incident. A
 * colleague signed up on 2026-07-28, landed on the `viewer` default (which is
 * also the `profiles.role` column default, so it is what EVERY new sign-up
 * gets), and could reach only Water, Electricity and STP. The Modules sheet
 * showed 3 of 8 entries, and the dashboard's coverage rail still linked to the
 * 5 hidden modules — so tapping one hit `RouteRoleGuard`, which bounced back to
 * the dashboard. It read as "the app crashed and restarted".
 *
 * The instruction is that all users may view all sections, so the per-role
 * split is gone rather than patched: a new sign-up now sees the whole app with
 * no manual promotion step. The `Role` type is kept because it still labels the
 * account in the UI (`ROLE_LABEL`), and the machinery below is unchanged — if
 * modules ever need restricting again, narrow a role here and the sidebar,
 * bottom nav and route guard all follow.
 *
 * Note this governs VISIBILITY only. It never was, and is not, a data-access
 * control: the hard gate is Supabase RLS on the underlying tables.
 */
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
    admin: ALL_MODULES,
    manager: ALL_MODULES,
    operator: ALL_MODULES,
    contractor: ALL_MODULES,
    viewer: ALL_MODULES,
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
    "monitoring": "/monitoring",
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
 * Safe-by-default: an absent, empty or unrecognised role resolves to the
 * least-privileged `"viewer"`, so a new or misconfigured account can never
 * silently inherit administrator access (the previous behaviour, which
 * defaulted every unknown value to `"admin"`, meant all legacy `'user'`
 * accounts were treated as admins).
 *
 * The single exception is the legacy `'user'` value: it is grandfathered to
 * `"admin"` so the accounts that predate the RBAC migration keep their
 * access on deploy (zero lockout). The companion migration
 * `sql/migrations/20260718_security_hardening.sql` converts those rows to an
 * explicit `'admin'` and sets the `profiles.role` column default to
 * `'viewer'`, after which no `'user'` rows remain and new sign-ups are
 * viewers until promoted — so this grandfather branch becomes inert.
 */
export function normalizeRole(raw: string | null | undefined): Role {
    if (!raw) return "viewer";
    const r = raw.toLowerCase();
    if (r === "admin" || r === "manager" || r === "operator" || r === "contractor" || r === "viewer") {
        return r;
    }
    // Legacy pre-migration accounts stored `'user'` — keep them admin so no one
    // is locked out on deploy. Every other unknown value is least-privilege.
    if (r === "user") return "admin";
    return "viewer";
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
