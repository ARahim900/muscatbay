"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { normalizeRole, type Role } from "@/lib/rbac";

/**
 * Returns the current user's normalized role (defaults to "viewer" for safety
 * when no profile exists yet). Loading state lives on AuthProvider already.
 */
export function useUserRole(): Role {
    const { profile } = useAuth();
    return normalizeRole(profile?.role);
}
