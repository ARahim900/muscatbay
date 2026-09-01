import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

const ALLOWED_ROLES = new Set(["admin", "manager", "operator", "contractor", "viewer"]);
const ALLOWED_MODULES = new Set([
    "water", "electricity", "stp", "assets", "contractors", "firefighting", "hvac", "alerts",
]);

interface InvitationRequest {
    email: string;
    role: string;
    moduleScope: string[];
}

function parseRequest(value: unknown): InvitationRequest | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const input = value as Record<string, unknown>;
    if (typeof input.email !== "string" || typeof input.role !== "string") return null;
    if (!Array.isArray(input.moduleScope) || !input.moduleScope.every((item) => typeof item === "string")) return null;
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    if (!ALLOWED_ROLES.has(input.role)) return null;
    if (!input.moduleScope.every((module) => ALLOWED_MODULES.has(module))) return null;
    return {
        email,
        role: input.role,
        moduleScope: input.role === "contractor" ? [...new Set(input.moduleScope)] : [],
    };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();
    if (profileError) {
        console.error("[admin/invitations] Role lookup failed:", profileError.message);
        return NextResponse.json({ error: "Unable to verify administrator access" }, { status: 500 });
    }
    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    let input: InvitationRequest | null = null;
    try {
        input = parseRequest(await request.json());
    } catch (error) {
        console.warn("[admin/invitations] Invalid JSON body:", error);
    }
    if (!input) {
        return NextResponse.json({ error: "Enter a valid email, role and module scope" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("[admin/invitations] Server Supabase credentials are not configured.");
        return NextResponse.json({ error: "Invitation service unavailable" }, { status: 503 });
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const { data: existing, error: existingError } = await admin
        .from("auth_invitations")
        .select("id")
        .eq("email", input.email)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .maybeSingle();
    if (existingError) {
        console.error("[admin/invitations] Existing invitation lookup failed:", existingError.message);
        return NextResponse.json({ error: "Unable to create invitation" }, { status: 500 });
    }

    const invitationPayload = {
        email: input.email,
        role: input.role,
        module_scope: input.moduleScope,
        invited_by: userData.user.id,
        invited_at: new Date().toISOString(),
        expires_at: expiresAt,
        accepted_at: null,
        revoked_at: null,
    };
    const invitationWrite = existing
        ? await admin.from("auth_invitations").update(invitationPayload).eq("id", existing.id).select("id").single()
        : await admin.from("auth_invitations").insert(invitationPayload).select("id").single();
    if (invitationWrite.error) {
        console.error("[admin/invitations] Invitation record failed:", invitationWrite.error.message);
        return NextResponse.json({ error: "Unable to create invitation" }, { status: 500 });
    }

    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, {
        redirectTo: `${redirectOrigin}/auth/callback?flow=invite`,
    });
    if (inviteError) {
        const { error: rollbackError } = await admin
            .from("auth_invitations")
            .update({ revoked_at: new Date().toISOString() })
            .eq("id", invitationWrite.data.id);
        if (rollbackError) {
            console.error("[admin/invitations] Invitation rollback failed:", rollbackError.message);
        }
        console.error("[admin/invitations] Auth invitation failed:", inviteError.message);
        return NextResponse.json({ error: "Supabase could not send the invitation" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, email: input.email, expiresAt });
}
