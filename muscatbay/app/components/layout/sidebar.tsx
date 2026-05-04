"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from './sidebar-context';
import { useAuth } from '@/components/auth/auth-provider';
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
  Waves,
  Wrench,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavGroup {
  id: string;
  label?: string;
  items: NavigationItem[];
}

// Grouped navigation — category labels help scanning. Dashboard sits
// ungrouped at the top; Utilities and Operations follow.
const navGroups: NavGroup[] = [
  {
    id: "overview",
    items: [
      { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "water", name: "Water", icon: Droplets, href: "/water" },
{ id: "electricity", name: "Electricity", icon: Zap, href: "/electricity" },
      { id: "stp", name: "STP Plant", icon: Waves, href: "/stp" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "contractors", name: "Contractors", icon: Users, href: "/contractors" },
      { id: "hvac-system", name: "HVAC System", icon: Wrench, href: "/hvac" },
      { id: "assets", name: "Assets", icon: Package, href: "/assets" },
      { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control" },
      { id: "fire-safety", name: "Fire Safety", icon: Flame, href: "/firefighting" },
    ],
  },
];

// Flat list used for "more-specific-sibling" active detection.
const allNavigationItems: NavigationItem[] = navGroups.flatMap((g) => g.items);

// Bottom navigation items
const bottomNavItems: NavigationItem[] = [
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay - only shown on mobile when sidebar is open.
          Solid scrim (no backdrop-blur) so paint cost stays low on low-end phones. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container — sits below the fixed 76px topbar so
          the brand-purple topbar spans edge-to-edge above it. */}
      <aside
        className={`
          fixed top-0 start-0 h-dvh z-40
          flex flex-col
          bg-[var(--sidebar)] border-e border-white/10
          transition-[width,transform] duration-200 ease-out
          ${isOpen ? "translate-x-0 rtl:-translate-x-0" : "-translate-x-full rtl:translate-x-full"}
          ${isCollapsed ? "w-[72px]" : "w-[220px]"}
          md:translate-x-0
        `}
        // Respect notched-device safe areas in landscape so nav content doesn't
        // sit under a hardware cutout.
        style={{
          paddingInlineStart: "env(safe-area-inset-left, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Main navigation"
      >
        {/* Brand lockup — same height as topbar (h-16 = 64px) */}
        <div className="h-16 flex items-center flex-shrink-0 border-b border-white/10 px-3">
          {isCollapsed ? (
            /* Collapsed: centred logo icon doubles as expand trigger on desktop */
            <button
              onClick={toggleCollapse}
              className="hidden md:flex mx-auto w-10 h-10 rounded-xl items-center justify-center bg-white/10 ring-1 ring-white/15 hover:bg-white/20 hover:ring-secondary/30 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
              aria-label="Expand sidebar"
            >
              <Image src="/mb-logo.png" alt="Muscat Bay" width={26} height={26} className="object-contain" priority />
            </button>
          ) : (
            /* Expanded: full brand lockup + collapse button */
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link href="/" className="flex items-center gap-2.5 group flex-1 min-w-0" aria-label="Muscat Bay home">
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/10 ring-1 ring-white/15 shadow-md group-hover:bg-white/20 group-hover:ring-secondary/30 transition-colors duration-150">
                  <Image src="/mb-logo.png" alt="Muscat Bay" width={26} height={26} className="object-contain" priority />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight leading-none">
                    <span className="text-white">MUSCAT </span>
                    <span className="text-secondary">BAY</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.13em] text-white/50 mt-0.5 truncate">
                    Resource Management
                  </p>
                </div>
              </Link>
              <button
                onClick={toggleCollapse}
                className="hidden md:flex w-7 h-7 flex-shrink-0 items-center justify-center rounded-md hover:bg-white/10 text-white/45 hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 pt-2 pb-4 overflow-y-auto" aria-label="Primary">
          {navGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              className={groupIdx > 0 ? (isCollapsed ? "mt-3 pt-3 border-t border-white/10" : "mt-4") : ""}
              role="group"
              aria-label={group.label}
            >
              {group.label && (
                <h2 className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 select-none ${isCollapsed ? "sr-only" : ""}`}>
                  {group.label}
                </h2>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasMoreSpecificMatch = allNavigationItems.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.startsWith(item.href + '/') &&
                      pathname?.startsWith(other.href)
                  );
                  const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(item.href) && !hasMoreSpecificMatch;

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={handleItemClick}
                        aria-current={isActive ? "page" : undefined}
                        className={`
                          group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-inset
                          ${isActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/[0.04] hover:text-white"}
                          ${isCollapsed ? "justify-center px-2" : ""}
                        `}
                        aria-describedby={isCollapsed ? `tooltip-${item.id}` : undefined}
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-secondary transition-opacity duration-150 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 relative z-10 ${isActive ? "text-secondary" : "text-white/80 group-hover/nav:text-white"}`} />
                        {!isCollapsed && (
                          <span className={`text-sm truncate flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                            {item.name}
                          </span>
                        )}
                        {isCollapsed && (
                          <div id={`tooltip-${item.id}`} role="tooltip" className="absolute start-full ms-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible group-focus-within/nav:opacity-100 group-focus-within/nav:visible transition-[opacity,visibility] duration-150 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none max-w-[calc(100vw-5rem)] overflow-hidden text-ellipsis">
                            {item.name}
                            <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1 rtl:translate-x-1 w-2 h-2 bg-popover rotate-45" />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom section - Settings & Logout */}
        <div className="mt-auto border-t border-white/10 px-3 py-2.5 space-y-0.5">
          {/* Settings */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                aria-current={isActive ? "page" : undefined}
                className={`
                  group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-inset
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/85 hover:bg-white/[0.04] hover:text-white"
                  }
                  ${isCollapsed ? "justify-center px-2" : ""}
                `}
                aria-describedby={isCollapsed ? `tooltip-${item.id}` : undefined}
              >
                {/* Left accent bar */}
                <span
                  aria-hidden="true"
                  className={`absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-secondary transition-opacity duration-150 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                />
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors duration-150 relative z-10
                    ${isActive ? "text-secondary" : "text-white/80 group-hover/nav:text-white"}
                  `}
                />
                {!isCollapsed && (
                  <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div id={`tooltip-${item.id}`} role="tooltip" className="absolute start-full ms-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible group-focus-within/nav:opacity-100 group-focus-within/nav:visible transition-[opacity,visibility] duration-150 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none max-w-[calc(100vw-5rem)] overflow-hidden text-ellipsis">
                    {item.name}
                    <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1 rtl:translate-x-1 w-2 h-2 bg-popover rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}

          {/* Logout Button — LogOut icon (no avatar) makes the intent unmistakable */}
          <button
            onClick={logout}
            className={`
              group/nav w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-inset
              text-white/85 hover:bg-red-500/10 hover:text-red-200
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            aria-describedby={isCollapsed ? "tooltip-logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-white/75 group-hover/nav:text-red-300 transition-colors duration-150" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div id="tooltip-logout" role="tooltip" className="absolute start-full ms-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible group-focus-within/nav:opacity-100 group-focus-within/nav:visible transition-[opacity,visibility] duration-150 whitespace-nowrap z-50 shadow-lg font-medium pointer-events-none max-w-[calc(100vw-5rem)] overflow-hidden text-ellipsis">
                Sign Out
                <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1 rtl:translate-x-1 w-2 h-2 bg-popover rotate-45" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}