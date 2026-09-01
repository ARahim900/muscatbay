import { getSupabaseClient } from './supabase';
import { validateEmail, validatePassword, validateFullName, validateUsername, validateUrl, sanitizeInput } from './validation';
import { logger } from "@/lib/logger";

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    website: string | null;
    role: string;
}

export interface AuthUser {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
}

export type UserProfileUpdate = Partial<Pick<UserProfile, 'full_name' | 'username' | 'avatar_url' | 'website'>>;

// =============================================================================
// DEVELOPMENT MODE HELPERS
// =============================================================================

/**
 * Check if development mode is enabled.
 * DEV_MODE only works when:
 * 1. NODE_ENV is 'development' (not in production builds)
 * 2. NEXT_PUBLIC_DEV_MODE is explicitly set to 'true'
 */
const isDevMode = () => {
    // SECURITY: Never allow dev mode in production builds
    if (process.env.NODE_ENV === 'production') {
        return false;
    }
    return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
};

const DEV_USER: AuthUser = {
    id: 'dev-user-123',
    email: 'dev@muscatbay.com',
    user_metadata: {
        full_name: 'Development User',
        avatar_url: undefined,
    },
};

const DEV_PROFILE: UserProfile = {
    id: 'dev-user-123',
    email: 'dev@muscatbay.com',
    full_name: 'Development User',
    username: 'devuser',
    avatar_url: null,
    website: null,
    role: 'admin',
};

// Sign in with email and password
export async function signIn(email: string, password: string) {
    // DEV MODE: Bypass authentication
    if (isDevMode()) {
        logger.debug('🔧 DEV MODE: Authentication bypassed');
        return {
            user: DEV_USER,
            session: null,
        };
    }

    // Basic input validation (don't reveal what's wrong for security)
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new Error('Invalid email or password');
    }

    if (!password || password.length === 0) {
        throw new Error('Invalid email or password');
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
    });

    // Generic error message to prevent user enumeration
    if (error) {
        throw new Error('Invalid email or password');
    }
    return data;
}

// Sign in with Google (Supabase OAuth, PKCE flow). Account creation is guarded
// by the database Before User Created hook in the invitation-only security
// migration. The browser must never receive a service-role key or query the
// invitation register directly.
export async function signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    // The callback MUST stay on the origin that starts the flow — never a
    // canonical NEXT_PUBLIC_SITE_URL. The PKCE code verifier is stored
    // host-scoped on THIS origin, so a sign-in started on an alias
    // (www.muscatbay.work, muscatbay.vercel.app) or a preview deployment
    // that lands back on the canonical host cannot find its verifier and
    // every exchange fails. Each origin that serves the app needs to be in
    // Supabase's redirect allow-list.
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // flow=oauth lets /auth/callback show Google-specific copy
            // (and a Google retry) instead of email-verification guidance.
            redirectTo: `${window.location.origin}/auth/callback?flow=oauth`,
            queryParams: {
                // Always show Google's account chooser: control-room tablets
                // are shared devices, and silently reusing the last Google
                // session would sign the wrong operator in.
                prompt: 'select_account',
            },
        },
    });

    if (error) throw error;
}

// Sign out
export async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
    // DEV MODE: Return dev user
    if (isDevMode()) {
        return DEV_USER;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        return null;
    }

    // Read the session from local storage / cookies. The Next.js proxy
    // (proxy.ts) calls supabase.auth.getUser() server-side on every
    // navigation, so the cookies arriving in the browser are already
    // server-validated. Using getSession() here avoids a second network
    // round-trip that can hang the splash screen indefinitely when the
    // Supabase auth endpoint is slow or unreachable.
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;
        return {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata as AuthUser['user_metadata'],
        };
    } catch {
        logger.warn('Unable to read the local authentication session');
        return null;
    }
}

// Get user profile from profiles table
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    // DEV MODE: Return dev profile
    if (isDevMode()) {
        return DEV_PROFILE;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, avatar_url, website, role')
        .eq('id', userId)
        .single();

    if (error) {
        logger.error('Unable to load the authenticated user profile');
        return null;
    }
    if (!data) return null;

    return {
        id: data.id,
        email: data.email || '',
        full_name: data.full_name,
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        role: data.role || 'unknown',
    };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: UserProfileUpdate) {
    // Validate profile updates
    if (updates.full_name) {
        const nameValidation = validateFullName(updates.full_name);
        if (!nameValidation.isValid) {
            throw new Error(nameValidation.error);
        }
    }

    if (updates.username) {
        const usernameValidation = validateUsername(updates.username);
        if (!usernameValidation.isValid) {
            throw new Error(usernameValidation.error);
        }
    }

    if (updates.website) {
        const urlValidation = validateUrl(updates.website);
        if (!urlValidation.isValid) {
            throw new Error(urlValidation.error);
        }
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    // Sanitize inputs
    const sanitizedUpdates = {
        ...updates,
        full_name: updates.full_name ? sanitizeInput(updates.full_name) : updates.full_name,
        username: updates.username ? updates.username.trim().toLowerCase() : updates.username,
        website: updates.website?.trim(),
    };

    const { data, error } = await supabase
        .from('profiles')
        .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id, email, full_name, username, avatar_url, website, role, updated_at')
        .single();

    if (error) throw error;
    return data;
}

// Upload avatar
const AVATAR_TYPE_EXTENSION: Readonly<Record<string, string>> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
};
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    // Validate before touching storage.
    const fileExt = AVATAR_TYPE_EXTENSION[file.type];
    if (!fileExt) {
        throw new Error('Unsupported image type — use PNG, JPEG, WebP, or GIF');
    }
    if (file.size > AVATAR_MAX_BYTES) {
        throw new Error('Image must be under 2MB');
    }

    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Snapshot the user's existing avatars so we can clean them up after a
    // successful upload — otherwise every save orphans the previous file.
    const { data: existing, error: listError } = await supabase.storage.from('avatars').list(userId);
    if (listError) logger.warn('Unable to list prior avatar files for cleanup');

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    // Best-effort removal of prior avatars (never fail the upload over cleanup).
    if (existing && existing.length > 0) {
        const stale = existing
            .filter((obj) => obj.name !== fileName)
            .map((obj) => `${userId}/${obj.name}`);
        if (stale.length > 0) {
            const { error: removeError } = await supabase.storage.from('avatars').remove(stale);
            if (removeError) logger.warn('Unable to remove prior avatar files');
        }
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Reset password
export async function resetPassword(email: string) {
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        // Don't reveal if email exists - always show success message
        return; // Silently return for invalid emails
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Use NEXT_PUBLIC_SITE_URL for production, fallback to window.location.origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    // Always succeed to prevent user enumeration
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
            redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
        });
        if (error) logger.warn('Password reset request could not be completed');
    } catch {
        // The UI response stays generic to prevent user enumeration.
        logger.warn('Password reset request could not be completed');
    }
}

// Update password
export async function updatePassword(newPassword: string) {
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword, true);
    if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return { data: { subscription: { unsubscribe: () => { } } } };
    }

    return supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            callback({
                id: session.user.id,
                email: session.user.email || '',
                user_metadata: session.user.user_metadata as AuthUser['user_metadata'],
            });
        } else {
            callback(null);
        }
    });
}
