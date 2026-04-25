"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, getUserProfile, onAuthStateChange, signOut, AuthUser, UserProfile } from "@/lib/auth";
import { SplashScreen } from "@/components/ui/splash-screen";

interface AuthContextType {
    user: AuthUser | null;
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isDevMode: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

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

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    isDevMode: false,
    logout: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/auth/callback", "/auth/reset-password"];

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [splashVisible, setSplashVisible] = useState(true);
    const [splashExiting, setSplashExiting] = useState(false);
    const splashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    const refreshProfile = async () => {
        if (user) {
            const userProfile = await getUserProfile(user.id);
            setProfile(userProfile);
        }
    };

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            setProfile(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (mounted) {
                    setUser(currentUser);

                    if (currentUser) {
                        const userProfile = await getUserProfile(currentUser.id);
                        setProfile(userProfile);
                    }
                }
            } catch (error) {
                console.error("Auth init error:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = onAuthStateChange(async (authUser) => {
            if (mounted) {
                setUser(authUser);
                if (authUser) {
                    const userProfile = await getUserProfile(authUser.id);
                    setProfile(userProfile);
                } else {
                    setProfile(null);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Handle route protection
    useEffect(() => {
        if (!loading) {
            // Skip route protection in DEV_MODE - user is always authenticated
            if (isDevMode()) {
                if (isPublicRoute && pathname !== "/auth/reset-password") {
                    // In DEV_MODE, redirect away from auth pages to dashboard
                    router.push("/");
                }
                return;
            }

            if (!user && !isPublicRoute) {
                // Not authenticated and trying to access protected route
                router.push("/login");
            } else if (user && isPublicRoute && pathname !== "/auth/reset-password") {
                // Authenticated and trying to access auth pages
                router.push("/");
            }
        }
    }, [user, loading, pathname, isPublicRoute, router]);

    // Trigger splash exit once auth resolves, then unmount it after animation
    useEffect(() => {
        if (!loading && splashVisible) {
            setSplashExiting(true);
            splashTimer.current = setTimeout(() => {
                setSplashVisible(false);
                setSplashExiting(false);
                splashTimer.current = null;
            }, 650);
        }
        return () => {
            if (splashTimer.current) clearTimeout(splashTimer.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    // Only show app content once auth resolves and the user is allowed
    const canShowContent =
        !loading && (!!user || isPublicRoute || isDevMode());

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                isAuthenticated: !!user,
                isDevMode: isDevMode(),
                logout,
                refreshProfile,
            }}
        >
            {canShowContent ? children : null}
            {splashVisible && <SplashScreen exiting={splashExiting} />}
        </AuthContext.Provider>
    );
}
