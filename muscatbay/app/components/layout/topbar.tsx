"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sun, Moon, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers";

export function Topbar() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { profile, user, logout } = useAuth();

    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const userRole = profile?.role === 'admin' ? 'Administrator' : 'User';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && isProfileOpen) {
                setIsProfileOpen(false);
                document.getElementById('profile-menu-trigger')?.focus();
                return;
            }
            if (!isProfileOpen) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const menu = document.getElementById('profile-dropdown-menu');
                if (!menu) return;
                const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                if (!items.length) return;
                const currentIdx = items.indexOf(document.activeElement as HTMLElement);
                const nextIdx = event.key === 'ArrowDown'
                    ? (currentIdx + 1) % items.length
                    : (currentIdx - 1 + items.length) % items.length;
                items[nextIdx]?.focus();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isProfileOpen]);

    return (
        <header className="topbar-dynamic h-16 fixed top-0 end-0 z-40 bg-white dark:bg-[var(--card)] flex items-center justify-end px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.07),0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-[inset-inline-start] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">

            <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                    aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
                    aria-pressed={mounted ? theme === "dark" : undefined}
                >
                    {mounted && (theme === "dark"
                        ? <Moon className="w-[17px] h-[17px]" />
                        : <Sun className="w-[17px] h-[17px]" />
                    )}
                </button>

                {/* Settings */}
                <Link
                    href="/settings"
                    className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                    aria-label="Settings"
                >
                    <Settings className="w-[17px] h-[17px]" />
                </Link>

                {/* Divider */}
                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1.5" aria-hidden="true" />

                {/* User Profile */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' && !isProfileOpen) {
                                e.preventDefault();
                                setIsProfileOpen(true);
                                setTimeout(() => {
                                    const first = document.querySelector<HTMLElement>('#profile-dropdown-menu [role="menuitem"]');
                                    first?.focus();
                                }, 10);
                            }
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                        aria-label="User profile menu"
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                        aria-controls="profile-dropdown-menu"
                        id="profile-menu-trigger"
                    >
                        <Avatar className="w-8 h-8 border-2 border-slate-200 dark:border-white/10">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-primary text-white text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
                            {displayName}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform duration-150 ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div
                            role="menu"
                            className="absolute end-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-1 z-50 motion-safe:animate-in fade-in slide-in-from-top-2 duration-200"
                            id="profile-dropdown-menu"
                            aria-labelledby="profile-menu-trigger"
                        >
                            <div className="px-4 py-3 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                        <AvatarFallback className="bg-primary text-white text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold truncate">{displayName}</span>
                                        {user?.email && (
                                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                        )}
                                        <span className="text-[10px] text-secondary font-medium mt-0.5">{userRole}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="py-1">
                                <Link
                                    href="/settings"
                                    role="menuitem"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors duration-150"
                                >
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                    Settings
                                </Link>
                                <div className="my-1 border-t border-border" />
                                <button
                                    role="menuitem"
                                    onClick={() => { logout(); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
