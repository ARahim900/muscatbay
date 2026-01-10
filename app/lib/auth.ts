import { getSupabaseClient } from './supabase';
import { validateEmail, validatePassword, validateFullName, validateUsername, validateUrl, sanitizeInput } from './validation';

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

// Sign up with email and password
export async function signUp(email: string, password: string, fullName?: string) {
    // Input validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
    }

    const passwordValidation = validatePassword(password, false);
    if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
    }

    if (fullName) {
        const nameValidation = validateFullName(fullName);
        if (!nameValidation.isValid) {
            throw new Error(nameValidation.error);
        }
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = fullName ? sanitizeInput(fullName) : '';

    const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
            data: {
                full_name: sanitizedName,
            },
        },
    });

    if (error) throw error;
    return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
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
    const supabase = getSupabaseClient();
    if (!supabase) {
        return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata as AuthUser['user_metadata'],
    };
}

// Get user profile from profiles table
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        email: data.email || '',
        full_name: data.full_name,
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        role: data.role || 'user',
    };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
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
        .upsert({
            id: userId,
            ...sanitizedUpdates,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Upload avatar
export async function uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

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

    // Always succeed to prevent user enumeration
    try {
        await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
    } catch {
        // Silently handle errors to prevent user enumeration
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

    return supabase.auth.onAuthStateChange((event, session) => {
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
