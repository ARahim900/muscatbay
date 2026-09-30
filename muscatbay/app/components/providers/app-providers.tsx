"use client";

import { createContext, useContext, useCallback, useEffect, useState, useMemo, type ReactNode } from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
    DARK_MEDIA_QUERY,
    THEME_STORAGE_KEY,
    effectivePreference,
    isInAppShell,
    parseStoredPreference,
    resolveTheme,
    type ResolvedTheme,
    type ThemePreference,
} from "@/lib/theme";

type Theme = ThemePreference;

interface ThemeContextValue {
    /** Saved preference; always "system" inside the iOS app. */
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    /** False inside the iOS app, where the page always follows the iPhone — hide theme controls. */
    canChooseTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemPrefersDark(): boolean {
    if (typeof window === "undefined") return true;
    return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

function readStoredPreference(): Theme {
    try {
        return parseStoredPreference(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
        return "system";
    }
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within Providers");
    return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
    const [inApp, setInApp] = useState(false);
    const applyTheme = useCallback((resolved: ResolvedTheme) => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        root.style.colorScheme = resolved;
        setResolvedTheme(resolved);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        // Inside the iOS app the iPhone decides; ignore stray calls.
        if (isInAppShell(navigator.userAgent)) return;
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch {
            // Storage blocked (private mode): the choice lasts for this page only.
        }
        applyTheme(resolveTheme(newTheme, systemPrefersDark()));
    }, [applyTheme]);

    // Sync from storage on mount — hydration-safe: localStorage, navigator and
    // matchMedia are browser-only. The <head> script (lib/theme.ts) has already
    // painted the right theme; this only brings React state in line with it.
    useEffect(() => {
        const app = isInAppShell(navigator.userAgent);
        const pref = effectivePreference(readStoredPreference(), app);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInApp(app);
        setThemeState(pref);
        applyTheme(resolveTheme(pref, systemPrefersDark()));
    }, [applyTheme]);

    // Follow the device live when the preference is System (e.g. iOS switches
    // to dark at sunset while the app is open).
    useEffect(() => {
        const mq = window.matchMedia(DARK_MEDIA_QUERY);
        const handler = () => {
            if (theme === "system") {
                applyTheme(resolveTheme("system", mq.matches));
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme, applyTheme]);

    // Listen for cross-tab storage changes
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key !== THEME_STORAGE_KEY || isInAppShell(navigator.userAgent)) return;
            const newTheme = parseStoredPreference(e.newValue);
            setThemeState(newTheme);
            applyTheme(resolveTheme(newTheme, systemPrefersDark()));
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [applyTheme]);

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme, canChooseTheme: !inApp }),
        [theme, resolvedTheme, setTheme, inApp],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
            <LoadingOverlay />
        </ThemeContext.Provider>
    );
}
