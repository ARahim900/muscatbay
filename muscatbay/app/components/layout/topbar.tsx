"use client";

import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Sun, Moon, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/providers";

export function Topbar() {
    const { setIsOpen } = useSidebar();
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { profile, user, logout } = useAuth();

    // Compute display name and initials for user profile
    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const userRole = profile?.role === 'admin' ? 'Administrator' : 'User';

    // Hydration-safe mount flag: prevents SSR/CSR markup mismatch for
    // theme-dependent icons. Cannot be derived at render time.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside or pressing Escape
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }

        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === 'Escape' && isProfileOpen) {
                setIsProfileOpen(false);
                // Return focus to the trigger button
                const trigger = document.getElementById('profile-menu-trigger');
                trigger?.focus();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isProfileOpen]);

    // Shared header shell — solid brand purple (#4E4456 via --primary token)
    // in both light & dark modes. Fixed to the viewport so it spans the full
    // site width (edge-to-edge, above the sidebar) and stays visible on
    // scroll. z-50 keeps it above the sidebar (z-40). A subtle 1px seam
    // under the navbar defines the layer without a heavy drop shadow.
    const headerClassName =
        "h-[76px] fixed top-0 inset-x-0 z-50 bg-primary px-4 sm:px-6 flex items-center justify-between border-b border-white/10 shadow-[0_1px_0_rgba(0,0,0,0.18)] dark:shadow-[0_1px_0_rgba(0,0,0,0.55)]";

    if (!mounted) {
        return (
            <header className={headerClassName}>
                <div className="flex items-center gap-3">
                    {/* Skeleton or simple loading state if needed, or just return null to avoid flash */}
                </div>
            </header>
        );
    }

    return (
        <header className={headerClassName}>
            {/* Left Section - Mobile hamburger + Logo + Title */}
            <div className="flex items-center gap-3">
                {/* Mobile hamburger - Always visible on mobile */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white md:hidden hover:bg-white/20 transition-colors duration-150"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Brand lockup — logo + title */}
                <Link href="/" className="flex items-center gap-3 group" aria-label="Muscat Bay home">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/10 ring-1 ring-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.25)] group-hover:bg-white/20 group-hover:ring-secondary/40 transition-colors duration-150">
                        <Image
                            src="/mb-logo.png"
                            alt="Muscat Bay"
                            width={36}
                            height={36}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="leading-tight">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                            <span className="text-white">MUSCAT </span>
                            <span className="text-secondary">BAY</span>
                        </h1>
                        <p className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-white/60 hidden sm:block">
                            Resource Management
                        </p>
                    </div>
                </Link>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    aria-label="Toggle theme"
                    data-tooltip="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Moon className="w-[22px] h-[22px]" />
                    ) : (
                        <Sun className="w-[22px] h-[22px]" />
                    )}
                </button>

                {/* User Profile with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 ms-1 sm:ms-2 p-1 lg:ps-1 lg:pe-3 rounded-full ring-1 ring-transparent hover:bg-white/10 hover:ring-white/20 focus-visible:ring-secondary/50 focus-visible:outline-none transition-colors duration-150 group"
                        aria-label="User profile menu"
                        aria-expanded={isProfileOpen}
                        aria-haspopup="true"
                        aria-controls="profile-dropdown-menu"
                        id="profile-menu-trigger"
                    >
                        <Avatar className="w-10 h-10 border-2 border-white/20 group-hover:border-secondary transition-colors duration-150">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-secondary text-primary text-sm font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium text-white">
                            {displayName}
                        </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-white/60 hidden sm:block transition-transform duration-150 ${isProfileOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute end-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                            id="profile-dropdown-menu"
                            aria-labelledby="profile-menu-trigger"
                        >
                            {/* User Info Header */}
                            <div className="px-4 py-3 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                        <AvatarFallback className="bg-secondary text-primary text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold truncate">
                                            {displayName}
                                        </span>
                                        {user?.email && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-secondary font-medium mt-0.5">
                                            {userRole}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown Menu Items */}
                            <div className="py-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors duration-150"
                                    id="profile-menu-settings"
                                >
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                    Settings
                                </Link>

                                {/* Divider */}
                                <div className="my-1 border-t border-border" />

                                {/* Sign Out */}
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
                                    id="profile-menu-signout"
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
