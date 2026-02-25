"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from './sidebar-context';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Droplets,
  Zap,
  Users,
  Package,
  Bug,
  Flame,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Waves,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

// Flat navigation items - concise and professional
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "water", name: "Water", icon: Droplets, href: "/water" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/electricity" },
  { id: "stp", name: "STP Plant", icon: Waves, href: "/stp" },
  { id: "contractors", name: "Contractors", icon: Users, href: "/contractors" },
  { id: "assets", name: "Assets", icon: Package, href: "/assets" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control" },
  { id: "fire-safety", name: "Fire Safety", icon: Flame, href: "/firefighting" },
];

// Bottom navigation items
const bottomNavItems: NavigationItem[] = [
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const { profile, user, logout } = useAuth();

  // Compute display name and initials for user profile
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay - only shown on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40 
          flex flex-col
          bg-[#4e4456] dark:bg-[#1E293B] shadow-xl
          transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-[72px]" : "w-[220px]"}
          md:translate-x-0
        `}
        aria-label="Main navigation"
      >
        {/* Header with logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-white/10`}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 p-1 group-hover:bg-white/20 transition-colors">
                <Image
                  src="/mb-logo.png"
                  alt="Muscat Bay"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight tracking-tight">
                  <span className="text-white">MUSCAT</span>
                  <span style={{ color: '#81D8D0' }}> BAY</span>
                </span>
                <span className="text-[10px] text-white/50 font-normal">Operations</span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/" className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
              <span className="text-white font-bold text-xs">
                <span className="text-white">M</span>
                <span style={{ color: '#81D8D0' }}>B</span>
              </span>
            </Link>
          )}

          {/* Collapse toggle button - desktop only */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex w-7 h-7 items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-all"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex w-full items-center justify-center py-3 hover:bg-white/10 text-white/60 hover:text-white transition-colors border-b border-white/10"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Main Navigation - No sections, flat list */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href);

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className={`
                      group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-all duration-200 relative
                      ${isActive
                        ? "bg-white/20 text-white shadow-[0_0_15px_rgba(129,216,208,0.3)] border-l-[3px] border-[#81D8D0] ml-[-3px] pl-[15px]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      }
                      ${isCollapsed ? "justify-center px-2 !border-l-0 !ml-0 !pl-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`
                        w-5 h-5 flex-shrink-0 transition-all duration-200
                        ${isActive ? "text-[#81D8D0] drop-shadow-[0_0_6px_rgba(129,216,208,0.6)]" : "group-hover/nav:scale-110"}
                      `}
                    />

                    {!isCollapsed && (
                      <>
                        <span className={`text-sm font-medium truncate flex-1 ${isActive ? "font-semibold" : ""}`}>
                          {item.name}
                        </span>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-[#81D8D0] flex-shrink-0 shadow-[0_0_8px_rgba(129,216,208,0.8)]" />
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-white text-[#4e4456] text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none">
                        {item.name}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white rotate-45" />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section - Settings & Logout */}
        <div className="mt-auto border-t border-white/10 px-3 py-3 space-y-2">
          {/* Settings */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                className={`
                  group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 relative
                  ${isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center px-2" : ""}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0 transition-transform duration-200
                    ${isActive ? "text-[#81D8D0]" : "group-hover/nav:scale-110"}
                  `}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-white text-[#4e4456] text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`
              group/nav w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 relative
              text-white/70 hover:bg-red-500/20 hover:text-red-300
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-white text-[#4e4456] text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none">
                Sign Out
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white rotate-45" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}