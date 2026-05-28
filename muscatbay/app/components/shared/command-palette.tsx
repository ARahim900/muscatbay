"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, ArrowRight, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useUserRole } from "@/hooks/useUserRole";
import { canAccessModule, MODULE_ROUTE, type ModuleKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Droplets, Zap, Waves, Users, Wrench, Package, Bug, Flame, Settings as SettingsIcon,
} from "lucide-react";

type CommandItem = {
    id: string;
    label: string;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
    /** RBAC scope — omit for always-available actions. */
    module?: ModuleKey;
    /** Execute and (usually) close the palette. */
    run: () => void;
};

const NAV_ITEMS: Array<{
    module: ModuleKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    { module: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { module: "water", label: "Water", icon: Droplets },
    { module: "electricity", label: "Electricity", icon: Zap },
    { module: "stp", label: "STP Plant", icon: Waves },
    { module: "contractors", label: "Contractors", icon: Users },
    { module: "hvac", label: "HVAC System", icon: Wrench },
    { module: "assets", label: "Assets", icon: Package },
    { module: "pest-control", label: "Pest Control", icon: Bug },
    { module: "firefighting", label: "Fire Safety", icon: Flame },
    { module: "settings", label: "Settings", icon: SettingsIcon },
];

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { logout, isDevMode } = useAuth();
    const role = useUserRole();
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClose = useCallback(() => {
        setQuery("");
        onClose();
    }, [onClose]);

    const navigate = useCallback((href: string) => {
        router.push(href);
        handleClose();
    }, [router, handleClose]);

    const toggleTheme = useCallback(() => {
        const root = document.documentElement;
        const isDark = root.classList.contains("dark");
        root.classList.toggle("dark", !isDark);
        try {
            localStorage.setItem("theme", isDark ? "light" : "dark");
        } catch { /* private mode etc — ignore */ }
        onClose();
    }, [onClose]);

    // Build the full command list, filtered by role
    const commands: CommandItem[] = useMemo(() => {
        const navCommands: CommandItem[] = NAV_ITEMS
            .filter((n) => isDevMode || canAccessModule(role, n.module))
            .map((n) => ({
                id: `nav-${n.module}`,
                label: `Go to ${n.label}`,
                hint: MODULE_ROUTE[n.module],
                icon: n.icon,
                module: n.module,
                run: () => navigate(MODULE_ROUTE[n.module]),
            }));

        const actions: CommandItem[] = [
            { id: "theme-toggle", label: "Toggle light / dark theme", icon: Sun, run: toggleTheme },
            { id: "board-mode", label: "Open dashboard in Board mode", hint: "Adds ?present=1", icon: LayoutDashboard, run: () => navigate("/?present=1") },
            { id: "sign-out", label: "Sign out", icon: LogOut, run: () => { logout(); handleClose(); } },
        ];

        return [...navCommands, ...actions];
    }, [role, isDevMode, navigate, toggleTheme, logout, handleClose]);

    // Filter by query (case-insensitive, fuzzy-ish)
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter((c) =>
            c.label.toLowerCase().includes(q) || (c.hint?.toLowerCase().includes(q))
        );
    }, [commands, query]);

    // Reset active index when filter changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveIdx(0);
    }, [query, open]);

    // Focus the input when the palette opens
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    // Keyboard handling
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const cmd = filtered[activeIdx];
            if (cmd) cmd.run();
        } else if (e.key === "Escape") {
            handleClose();
        }
    };

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in" aria-hidden="true" />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        aria-label="Search modules and actions"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search modules, actions…"
                        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/70 min-h-[28px]"
                        aria-autocomplete="list"
                        aria-controls="command-list"
                        aria-activedescendant={filtered[activeIdx] ? `cmd-${filtered[activeIdx].id}` : undefined}
                    />
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
                        ESC
                    </kbd>
                </div>

                <ul
                    id="command-list"
                    role="listbox"
                    className="max-h-[60vh] overflow-y-auto py-2"
                >
                    {filtered.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No matches for &ldquo;{query}&rdquo;
                        </li>
                    )}
                    {filtered.map((cmd, idx) => {
                        const active = idx === activeIdx;
                        const Icon = cmd.icon;
                        return (
                            <li
                                key={cmd.id}
                                id={`cmd-${cmd.id}`}
                                role="option"
                                aria-selected={active}
                                onMouseEnter={() => setActiveIdx(idx)}
                                onClick={() => cmd.run()}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors",
                                    active ? "bg-muted text-foreground" : "text-foreground/85 hover:bg-muted/60"
                                )}
                            >
                                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                <span className="flex-1 truncate">{cmd.label}</span>
                                {cmd.hint && (
                                    <span className="text-[11px] text-muted-foreground/70 font-mono truncate max-w-[140px]">{cmd.hint}</span>
                                )}
                                {active && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" aria-hidden="true" />}
                            </li>
                        );
                    })}
                </ul>

                <div className="hidden sm:flex items-center justify-between gap-2 px-4 py-2 border-t border-border text-[10px] text-muted-foreground bg-muted/30">
                    <span className="font-mono">Currently on: {pathname || "—"}</span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded font-mono bg-card border border-border">↑↓</kbd>
                        navigate
                        <kbd className="px-1.5 py-0.5 rounded font-mono bg-card border border-border">↵</kbd>
                        select
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Mounts the palette globally and listens for ⌘K / Ctrl+K to open it.
 * Drop this once near the top of the authenticated layout.
 */
export function CommandPaletteRoot() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // ⌘K (mac) or Ctrl+K (everyone else) — toggle
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}
