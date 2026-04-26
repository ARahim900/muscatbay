"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  color?: string;
}

const primaryItems: NavItem[] = [
  { id: "dashboard",  name: "Dashboard", icon: LayoutDashboard, href: "/",            color: "var(--mb-secondary)" },
  { id: "water",      name: "Water",     icon: Droplets,        href: "/water",       color: "var(--module-water)" },
  { id: "electricity",name: "Electricity",icon: Zap,            href: "/electricity", color: "var(--module-electricity)" },
  { id: "stp",        name: "STP Plant", icon: Waves,           href: "/stp",         color: "var(--module-stp)" },
  { id: "fire-safety",name: "Fire Safety",icon: Flame,          href: "/firefighting",color: "var(--module-fire)" },
];

const overflowItems: NavItem[] = [
  { id: "contractors", name: "Contractors", icon: Users,   href: "/contractors",  color: "var(--module-contractors)" },
  { id: "hvac-system", name: "HVAC System", icon: Wrench,  href: "/hvac",         color: "var(--module-hvac)" },
  { id: "assets",      name: "Assets",      icon: Package, href: "/assets",        color: "var(--module-assets)" },
  { id: "pest-control",name: "Pest Control",icon: Bug,     href: "/pest-control", color: "var(--module-pest)" },
  { id: "settings",    name: "Settings",    icon: Settings, href: "/settings" },
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const isOverflowActive = overflowItems.some(i => isRouteActive(i.href, pathname));

  // Close drawer on route change — canonical "close overlay on navigation"
  // pattern. Cannot be derived from pathname at render time because it must
  // override user-opened state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(false);
  }, [pathname]);

  // Focus trap + Escape handler for drawer
  useEffect(() => {
    if (!drawerOpen) return;

    const drawerEl = drawerRef.current;
    if (!drawerEl) return;

    // Find all focusable elements within the drawer
    const getFocusableElements = (): HTMLElement[] => {
      const selectors = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(drawerEl.querySelectorAll<HTMLElement>(selectors));
    };

    // Set initial focus to the close button
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }

      if (e.key !== 'Tab') return;

      const currentFocusable = getFocusableElements();
      if (currentFocusable.length === 0) return;

      const firstEl = currentFocusable[0];
      const lastEl = currentFocusable[currentFocusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Return focus to "More" button when drawer closes
  const prevDrawerOpen = useRef(false);
  useEffect(() => {
    if (prevDrawerOpen.current && !drawerOpen) {
      moreButtonRef.current?.focus();
    }
    prevDrawerOpen.current = drawerOpen;
  }, [drawerOpen]);

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
        ref={drawerRef}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          transform: drawerOpen
            ? 'translateY(0)'
            : 'translateY(calc(100% + 64px + env(safe-area-inset-bottom, 0px)))',
        }}
        className="fixed left-0 right-0 z-[95] md:hidden motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
      >
        <div className="mx-3 mb-2 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">More</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
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
              const activeColor = item.color || 'var(--secondary)';
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none
                    ${!active ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50' : ''}
                  `}
                  style={active ? { color: activeColor, backgroundColor: `color-mix(in srgb, ${activeColor} 10%, transparent)` } : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                  {active && (
                    <div className="ms-auto w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
                  )}
                </Link>
              );
            })}

            {/* Sign Out */}
            <button
              onClick={() => { setDrawerOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom navigation bar — inert+aria-hidden when the More drawer is
          open so keyboard users cannot tab into it while the dialog is modal */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700/80 shadow-[0_-4px_16px_rgba(0,0,0,0.07)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] bottom-nav-safe"
        aria-label="Mobile navigation"
        aria-hidden={drawerOpen || undefined}
        inert={drawerOpen}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href, pathname);
            const activeColor = item.color || 'var(--secondary)';
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-1.5 pb-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none
                  ${!active ? 'text-primary/70 dark:text-slate-400 hover:text-primary dark:hover:text-slate-200' : ''}
                `}
                style={active ? { color: activeColor } : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full -mt-0.5" style={{ backgroundColor: activeColor }} />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            ref={moreButtonRef}
            onClick={() => setDrawerOpen(prev => !prev)}
            className={`
              flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-1.5 pb-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none
              ${drawerOpen || isOverflowActive
                ? 'text-secondary'
                : 'text-primary/70 dark:text-slate-400 hover:text-primary dark:hover:text-slate-200'
              }
            `}
            aria-label="More navigation items"
            aria-expanded={drawerOpen}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className={`text-[10px] leading-tight ${drawerOpen || isOverflowActive ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
            {isOverflowActive && !drawerOpen && (
              <div className="w-1 h-1 rounded-full bg-secondary -mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
