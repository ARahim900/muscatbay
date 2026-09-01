import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { AuthUser, UserProfile } from '@/lib/auth'

export interface ServerAuthSnapshot {
    user: AuthUser | null
    profile: UserProfile | null
}

export async function getSupabaseServerClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // Server Components cannot write cookies. proxy.ts refreshes
                        // them before rendering; Server Actions may write normally.
                    }
                },
            },
        }
    )
}

/** Server-validated, minimal auth state used to avoid a client loading flash. */
export async function getServerAuthSnapshot(): Promise<ServerAuthSnapshot> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { user: null, profile: null }
    }

    const supabase = await getSupabaseServerClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
        if (userError.name !== 'AuthSessionMissingError') {
            console.error('[auth] Server user validation failed:', userError.message)
        }
        return { user: null, profile: null }
    }
    if (!userData.user) return { user: null, profile: null }

    const user: AuthUser = {
        id: userData.user.id,
        email: userData.user.email ?? '',
        user_metadata: {
            full_name: typeof userData.user.user_metadata.full_name === 'string'
                ? userData.user.user_metadata.full_name
                : undefined,
            avatar_url: typeof userData.user.user_metadata.avatar_url === 'string'
                ? userData.user.user_metadata.avatar_url
                : undefined,
        },
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, avatar_url, website, role')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
        console.error('[auth] Server profile lookup failed:', profileError.message)
        return { user, profile: null }
    }

    const profile: UserProfile | null = profileData
        ? {
            id: profileData.id,
            email: profileData.email ?? '',
            full_name: profileData.full_name,
            username: profileData.username,
            avatar_url: profileData.avatar_url,
            website: profileData.website,
            role: profileData.role ?? 'unknown',
        }
        : null

    return { user, profile }
}
