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
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return "system";
        return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "dark";
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored && stored !== "system") return stored as "light" | "dark";
        return getSystemTheme();
    });

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

    // Apply theme on mount
    useEffect(() => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolved);
    }, []);

    const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
