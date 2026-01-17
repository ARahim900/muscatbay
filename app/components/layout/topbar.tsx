"use client";

import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

export function Topbar() {
    const { setIsOpen } = useSidebar();
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { profile, user } = useAuth();

    // Compute display name and initials for user profile
    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    useEffect(() => {
        setMounted(true);
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
                    className="w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 transition-all duration-200"
                    aria-label="Search"
                >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Notifications Button */}
                <button
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg relative text-slate-500 transition-all duration-200"
                    aria-label="Notifications"
                >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {/* Notification badge */}
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Profile */}
                <Link
                    href="/settings"
                    className="flex items-center gap-2 ml-1 sm:ml-2"
                >
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                        <AvatarFallback className="bg-[#81D8D0] text-[#4e4456] text-sm font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium text-[#4e4456]">
                        {displayName}
                    </span>
                </Link>
            </div>
        </header>
    );
}
