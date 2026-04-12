"use client";

import { createContext, useContext, useCallback, useEffect, useState, useMemo, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within Providers");
    return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    const applyTheme = useCallback((resolved: "light" | "dark") => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        root.style.colorScheme = resolved;
        setResolvedTheme(resolved);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
        applyTheme(resolved);
    }, [applyTheme]);

    // Sync theme from localStorage on mount — hydration-safe: localStorage
    // and window.matchMedia are browser-only, must run after mount to avoid
    // SSR/CSR theme mismatch.
    useEffect(() => {
        const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
        const resolved = stored === "system" ? getSystemTheme() : stored;
        applyTheme(resolved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, [applyTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const mq = window.matchMedia(MEDIA_QUERY);
        const handler = () => {
            if (theme === "system") {
                applyTheme(getSystemTheme());
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme, applyTheme]);

    // Listen for cross-tab storage changes
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                const newTheme = e.newValue as Theme;
                setThemeState(newTheme);
                applyTheme(newTheme === "system" ? getSystemTheme() : newTheme);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [applyTheme]);

    const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
