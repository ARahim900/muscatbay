"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import {
  LayoutDashboard,
  Droplets,
  Zap,
  Waves,
  Flame,
  MoreHorizontal,
  Users,
  Package,
  Bug,
  Settings,
  LogOut,
  X,
  Wrench,
} from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const primaryItems: NavItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "water", name: "Water", icon: Droplets, href: "/water" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/electricity" },
  { id: "stp", name: "STP Plant", icon: Waves, href: "/stp" },
  { id: "fire-safety", name: "Fire Safety", icon: Flame, href: "/firefighting" },
];

const overflowItems: NavItem[] = [
  { id: "contractors", name: "Contractors", icon: Users, href: "/contractors" },
  { id: "hvac-system", name: "HVAC System", icon: Wrench, href: "/contractors/gulf-expert" },
  { id: "assets", name: "Assets", icon: Package, href: "/assets" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control" },
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
];

const allNavItems = [...primaryItems, ...overflowItems];

function isRouteActive(href: string, pathname: string | null) {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  const hasMoreSpecific = allNavItems.some(
    (other) => other.href !== href && other.href.startsWith(href + '/') && pathname?.startsWith(other.href)
  );
  return !hasMoreSpecific && (pathname?.startsWith(href) ?? false);
}

export function BottomNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isOverflowActive = overflowItems.some(i => isRouteActive(i.href, pathname));

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`
          fixed bottom-[64px] left-0 right-0 z-[95] md:hidden
          transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%+64px)]'}
        `}
      >
        <div className="mx-3 mb-2 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">More</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Overflow nav items */}
          <nav className="py-2">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href, pathname);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${active
                      ? 'bg-[#81D8D0]/10 text-[#00D2B3]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#00D2B3]' : ''}`} />
                  <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#00D2B3] shadow-[0_0_8px_rgba(0,210,179,0.6)]" />
                  )}
                </Link>
              );
            })}

            {/* Sign Out */}
            <button
              onClick={() => { setDrawerOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden h-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700/80 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-full px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href, pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-1.5 pb-1 rounded-lg transition-colors
                  ${active
                    ? 'text-[#00D2B3]'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(0,210,179,0.5)]' : ''}`} />
                <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-[#00D2B3] -mt-0.5" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(prev => !prev)}
            className={`
              flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-1.5 pb-1 rounded-lg transition-colors
              ${drawerOpen || isOverflowActive
                ? 'text-[#00D2B3]'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }
            `}
            aria-label="More navigation items"
            aria-expanded={drawerOpen}
          >
            <MoreHorizontal className={`w-5 h-5 ${drawerOpen || isOverflowActive ? 'drop-shadow-[0_0_6px_rgba(0,210,179,0.5)]' : ''}`} />
            <span className={`text-[10px] leading-tight ${drawerOpen || isOverflowActive ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
            {isOverflowActive && !drawerOpen && (
              <div className="w-1 h-1 rounded-full bg-[#00D2B3] -mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
