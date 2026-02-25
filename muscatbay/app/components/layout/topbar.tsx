"use client";

import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Bell, Sun, Moon, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

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

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!mounted) {
        return (
            <header className="h-16 sm:h-[60.5px] bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Skeleton or simple loading state if needed, or just return null to avoid flash */}
                </div>
            </header>
        );
    }

    return (
        <header className="h-16 sm:h-[60.5px] bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Left Section - Mobile hamburger + Title */}
            <div className="flex items-center gap-3">
                {/* Mobile hamburger - Always visible on mobile */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#4e4456] text-white md:hidden hover:bg-[#4e4456]/90 active:scale-95 transition-all duration-200 shadow-md"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* App Title - Mobile first */}
                <div>
                    <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight">
                        <span className="text-[#4e4456] dark:text-slate-100">MUSCAT </span>
                        <span style={{ color: '#81D8D0' }}>BAY</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                        Resource Management
                    </p>
                </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-all duration-200"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </button>

                {/* Search Button - Hidden on small mobile */}
                <button
                    className="w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-all duration-200"
                    aria-label="Search"
                >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Notifications Button */}
                <button
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative text-slate-500 dark:text-slate-400 transition-all duration-200"
                    aria-label="Notifications"
                >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {/* Notification badge */}
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>

                {/* User Profile with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 ml-1 sm:ml-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
                        aria-label="User profile menu"
                        id="profile-menu-trigger"
                    >
                        <div className="relative">
                            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-slate-200 dark:border-slate-700 group-hover:border-[#81D8D0] transition-colors duration-200">
                                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                <AvatarFallback className="bg-[#81D8D0] text-[#4e4456] text-sm font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online status indicator */}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </div>
                        <span className="hidden lg:block text-sm font-medium text-[#4e4456] dark:text-slate-200">
                            {displayName}
                        </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                            id="profile-dropdown-menu"
                        >
                            {/* User Info Header */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                        <AvatarFallback className="bg-[#81D8D0] text-[#4e4456] text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {displayName}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {user?.email || 'user@muscatbay.com'}
                                        </span>
                                        <span className="text-[10px] text-[#81D8D0] font-medium mt-0.5">
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
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#4e4456] dark:hover:text-white transition-colors duration-150"
                                    id="profile-menu-profile"
                                >
                                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    Profile
                                </Link>
                                <Link
                                    href="/settings"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#4e4456] dark:hover:text-white transition-colors duration-150"
                                    id="profile-menu-settings"
                                >
                                    <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    Settings
                                </Link>

                                {/* Divider */}
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                                {/* Sign Out */}
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
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
