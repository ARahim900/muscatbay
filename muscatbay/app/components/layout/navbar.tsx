"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Menu,
    Search,
    Bell,
    Sun,
    Moon,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Home,
    Info,
    Briefcase,
    Mail,
} from "lucide-react";

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about", icon: Info },
    { name: "Services", href: "/services", icon: Briefcase },
    { name: "Contact", href: "/contact", icon: Mail },
];

interface DropdownItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    divider?: boolean;
}

// Profile dropdown items are now created dynamically inside the component to use the real logout function

export function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const { profile, user, logout } = useAuth();

    // Compute display name and initials for user profile
    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const userRole = profile?.role === 'admin' ? 'Administrator' : 'User';

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on route change — canonical "close overlay on
    // navigation" pattern. Cannot be derived from pathname at render time
    // because it must override user-opened state.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <header className="h-16 sm:h-[60px] bg-primary px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg">
            {/* Left Section - Logo + Mobile hamburger */}
            <div className="flex items-center gap-4">
                {/* Mobile hamburger menu */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white lg:hidden hover:bg-white/20 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white/10 p-1 group-hover:bg-white/20 transition-colors duration-200">
                        <Image
                            src="/mb-logo.png"
                            alt="Muscat Bay Logo"
                            width={28}
                            height={28}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="font-semibold text-base leading-tight tracking-tight">
                            <span className="text-white">MUSCAT</span>
                            <span className="text-secondary"> BAY</span>
                        </span>
                        <span className="text-[11px] text-white/85 font-normal hidden md:block">
                            Resource Management
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden lg:flex items-center ms-8 gap-1">
                    {navItems.map((item) => {
                        const isActive = item.href === "/"
                            ? pathname === "/"
                            : pathname?.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${isActive
                                        ? "bg-white/20 text-white"
                                        : "text-white/90 hover:bg-white/10 hover:text-white"
                                    }
                `}
                            >
                                <Icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right Section - Actions + Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/90 hover:text-white transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? (
                        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </button>

                {/* Search Button - Hidden on small mobile */}
                <button
                    className="w-11 h-11 hidden sm:flex items-center justify-center hover:bg-white/10 rounded-lg text-white/90 hover:text-white transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    aria-label="Search"
                >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Notifications Button */}
                <button
                    className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg relative text-white/90 hover:text-white transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    aria-label="Notifications"
                >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {/* Notification badge */}
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary motion-safe:animate-pulse"></span>
                </button>

                {/* Profile Section with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="flex items-center gap-2 ms-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors duration-200 group focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                        aria-label="User profile menu"
                        aria-controls="navbar-profile-menu"
                    >
                        {/* Profile Picture */}
                        <div className="relative">
                            <Avatar className="w-10 h-10 border-2 border-white/20 group-hover:border-white/40 transition-colors duration-200">
                                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                <AvatarFallback className="bg-secondary text-primary text-sm font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online status indicator */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary"></span>
                        </div>

                        {/* User name - Hidden on mobile */}
                        <div className="hidden md:flex flex-col items-start">
                            <span className="text-sm font-medium text-white leading-tight">
                                {displayName}
                            </span>
                            <span className="text-xs text-white/85 leading-tight">
                                {userRole}
                            </span>
                        </div>

                        {/* Dropdown Arrow */}
                        <ChevronDown
                            className={`w-4 h-4 text-white/60 hidden sm:block transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileDropdownOpen && (
                        <div id="navbar-profile-menu" className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 motion-safe:animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* User Info Header */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                                        <AvatarFallback className="bg-secondary text-primary text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800">
                                            {displayName}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {user?.email || 'user@muscatbay.com'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown Items */}
                            <div className="py-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors duration-200"
                                >
                                    <User className="w-4 h-4 text-slate-400" />
                                    Profile
                                </Link>
                                <Link
                                    href="/settings"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors duration-200"
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    Settings
                                </Link>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsProfileDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="absolute top-full left-0 right-0 bg-primary border-t border-white/10 shadow-lg lg:hidden motion-safe:animate-in slide-in-from-top-2 duration-200"
                >
                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = item.href === "/"
                                ? pathname === "/"
                                : pathname?.startsWith(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive
                                            ? "bg-white/20 text-white"
                                            : "text-white/90 hover:bg-white/10 hover:text-white"
                                        }
                  `}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
