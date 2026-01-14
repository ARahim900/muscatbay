"use client";

import { useSidebar } from "./sidebar-context";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Topbar() {
    const { isCollapsed, setIsCollapsed, setIsOpen } = useSidebar();
    const [isDarkMode, setIsDarkMode] = useState(false);

    return (
        <div
            className="h-[60.5px] bg-white px-[14px] py-[10.5px] flex items-center justify-between sticky top-0 z-10 border-b border-gray-200"
        >
            {/* Left Section */}
            <div className="flex items-center gap-[10.5px]">
                {/* Mobile hamburger */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className="w-[35px] h-[35px] flex items-center justify-center hover:bg-gray-100 rounded-[5px] md:hidden text-brand-primary transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-[17.5px] h-[17.5px]" />
                </button>

                {/* Page Title */}
                <div className="hidden md:block">
                    <h1 className="text-[15.75px] font-bold leading-[24.5px] text-brand-primary">
                        Water System
                    </h1>
                    <p className="text-[14px] font-normal text-gray-500">
                        Muscat Bay Resource Management
                    </p>
                </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-[35px] h-[35px] flex items-center justify-center hover:bg-gray-100 rounded-[5px] text-gray-600 transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? (
                        <Moon className="w-[14px] h-[14px] rotate-0 scale-100 transition-all" />
                    ) : (
                        <Sun className="w-[14px] h-[14px] rotate-0 scale-100 transition-all" />
                    )}
                </button>

                {/* Search Button */}
                <button
                    className="w-[35px] h-[35px] flex items-center justify-center hover:bg-gray-100 rounded-[5px] text-gray-600 transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    aria-label="Search"
                >
                    <Search className="w-[14px] h-[14px]" />
                </button>

                {/* Notifications Button */}
                <button
                    className="w-[35px] h-[35px] flex items-center justify-center hover:bg-gray-100 rounded-[5px] relative text-gray-600 transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    aria-label="Notifications"
                >
                    <Bell className="w-[14px] h-[14px]" />
                    {/* Notification badge */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                {/* User Profile */}
                <Link
                    href="/settings"
                    className="flex items-center gap-2 ml-2"
                >
                    <div className="w-[35px] h-[35px] bg-brand-accent rounded-full flex items-center justify-center text-white text-[14px] font-medium">
                        A
                    </div>
                    <span className="hidden md:block text-[14px] font-medium text-brand-primary">
                        Admin
                    </span>
                </Link>
            </div>
        </div>
    );
}
