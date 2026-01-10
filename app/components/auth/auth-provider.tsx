"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, getUserProfile, onAuthStateChange, signOut, AuthUser, UserProfile } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthContextType {
    user: AuthUser | null;
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    logout: async () => {},
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/auth/reset-password"];

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
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
            if (!user && !isPublicRoute) {
                // Not authenticated and trying to access protected route
                router.push("/login");
            } else if (user && isPublicRoute && pathname !== "/auth/reset-password") {
                // Authenticated and trying to access auth pages
                router.push("/");
            }
        }
    }, [user, loading, pathname, isPublicRoute, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--mb-primary)]" />
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render protected content if not authenticated
    if (!user && !isPublicRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--mb-primary)]" />
                    <p className="text-sm text-slate-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                isAuthenticated: !!user,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
