"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/components/providers/app-providers';
import { useAppNotifications } from '@/components/providers/notification-provider';
import { canAccessModule, ROLE_LABEL, type ModuleKey } from '@/lib/rbac';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertsFeed } from '@/components/alerts/alerts-feed';
import {
  LayoutGrid,
  Building2,
  Bell,
  CircleUser,
  Droplets,
  Zap,
  Waves,
  Flame,
  Users,
  Package,
  Bug,
  Wrench,
  Settings,
  LogOut,
  X,
  Loader2,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
 * Mobile bottom navigation — floating "pill" dock.
 *
 * Four tabs, matching the reference design:
 *   • Overview — links to the dashboard (`/`)
 *   • Modules  — opens a sheet with every operations module (RBAC-filtered)
 *   • Alerts   — opens a sheet with the in-app notification feed (unread badge)
 *   • Profile  — opens a sheet with the account, appearance + sign-out controls
 *
 * The mobile sidebar is not reachable on phones (no trigger), so this dock is
 * the sole navigation surface on mobile — the Modules + Profile sheets deliberately
 * expose everything the desktop sidebar does (all modules, settings, sign out).
 * ──────────────────────────────────────────────────────────────────────────── */

interface ModuleItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  module: ModuleKey;
  /** Tailwind text-color class from the module accent tokens (icons only). */
  accent: string;
}

// Every module the dashboard groups under "Modules". Dashboard itself is the
// Overview tab, so it is intentionally omitted here. Order mirrors the sidebar.
const moduleItems: ModuleItem[] = [
  { id: "water", name: "Water", icon: Droplets, href: "/water", module: "water", accent: "text-module-water" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/electricity", module: "electricity", accent: "text-module-electricity" },
  { id: "stp", name: "STP Plant", icon: Waves, href: "/stp", module: "stp", accent: "text-module-stp" },
  { id: "contractors", name: "Contractors", icon: Users, href: "/contractors", module: "contractors", accent: "text-module-contractors" },
  { id: "hvac", name: "HVAC System", icon: Wrench, href: "/hvac", module: "hvac", accent: "text-module-hvac" },
  { id: "assets", name: "Assets", icon: Package, href: "/assets", module: "assets", accent: "text-module-assets" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control", module: "pest-control", accent: "text-module-pest" },
  { id: "firefighting", name: "Fire Safety", icon: Flame, href: "/firefighting", module: "firefighting", accent: "text-module-fire" },
];

type SheetKey = "modules" | "alerts" | "profile";

/** In-place pending indicator: the icon spins while ITS navigation is in flight
 *  (useLinkStatus must be read from inside the <Link>). */
function NavLinkIcon({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className: string }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 className={`${className} motion-safe:animate-spin`} aria-hidden="true" />;
  return <Icon className={className} />;
}

export function BottomNav() {
  const pathname = usePathname();
  const { profile, user, logout, isDevMode } = useAuth();
  const role = useUserRole();
  const { resolvedTheme, setTheme } = useTheme();
  const { notifications, unreadCount, clearAll, permission, requestPermission, markFeedOpened } = useAppNotifications();

  // Which sheet is open (null = dock only). `renderedSheet` holds the last
  // opened sheet so its content stays mounted through the slide-out animation —
  // it is set only when opening (below), so every close path leaves it intact.
  const [openSheet, setOpenSheet] = useState<SheetKey | null>(null);
  const [renderedSheet, setRenderedSheet] = useState<SheetKey | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  // RBAC filter — same rule as the sidebar; dev mode bypasses.
  const visibleModules = isDevMode ? moduleItems : moduleItems.filter((m) => canAccessModule(role, m.module));
  const canOpenSettings = isDevMode || canAccessModule(role, "settings");

  // Active tab. An open sheet takes visual priority over the route so the two
  // states never both look active at once.
  const overviewActive = openSheet === null && pathname === "/";
  const onModuleRoute = moduleItems.some((m) => pathname === m.href || (pathname?.startsWith(m.href + "/") ?? false));
  const modulesActive = openSheet === "modules" || (openSheet === null && onModuleRoute);
  const alertsActive = openSheet === "alerts";
  const onSettingsRoute = pathname?.startsWith("/settings") ?? false;
  const profileActive = openSheet === "profile" || (openSheet === null && onSettingsRoute);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = ROLE_LABEL[role] ?? "User";

  const toggleSheet = (key: SheetKey, e: React.MouseEvent<HTMLButtonElement>) => {
    lastTriggerRef.current = e.currentTarget;
    if (openSheet === key) {
      setOpenSheet(null); // tapping the active tab closes; renderedSheet stays
    } else {
      setRenderedSheet(key); // opening/switching — mount this sheet's content
      setOpenSheet(key);
      if (key === "alerts") markFeedOpened(); // session notifications become "read"
    }
  };

  // Close the sheet on route change — canonical "close overlay on navigation"
  // pattern (cannot be derived from pathname at render because it must override
  // user-opened state).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSheet(null);
  }, [pathname]);

  // Lock background scroll while a sheet is open.
  useEffect(() => {
    if (openSheet === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [openSheet]);

  // Focus trap + Escape handling for the open sheet.
  useEffect(() => {
    if (openSheet === null) return;
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    const getFocusable = (): HTMLElement[] => {
      const selectors =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(sheetEl.querySelectorAll<HTMLElement>(selectors));
    };

    // Move initial focus into the sheet (the close button is first).
    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenSheet(null);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSheet]);

  // Return focus to the trigger tab when the sheet closes.
  const prevOpen = useRef<SheetKey | null>(null);
  useEffect(() => {
    if (prevOpen.current !== null && openSheet === null) {
      lastTriggerRef.current?.focus();
    }
    prevOpen.current = openSheet;
  }, [openSheet]);

  const sheetTitle = renderedSheet ? renderedSheet.charAt(0).toUpperCase() + renderedSheet.slice(1) : "";

  return (
    <>
      {/* Backdrop */}
      {openSheet !== null && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[95] md:hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          onClick={() => setOpenSheet(null)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-up sheet (Modules / Alerts / Profile) ─────────────────────── */}
      <div
        className="fixed inset-x-0 z-[97] md:hidden flex justify-center px-3 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.75rem)" }}
      >
        <div
          ref={sheetRef}
          role="dialog"
          aria-label={sheetTitle ? `${sheetTitle} menu` : undefined}
          aria-hidden={openSheet === null || undefined}
          inert={openSheet === null}
          style={{
            transform: openSheet !== null ? "translateY(0)" : "translateY(calc(100% + 8rem))",
          }}
          className="w-full max-w-md max-h-[65vh] flex flex-col rounded-3xl bg-card dark:bg-muted shadow-2xl border border-border dark:border-white/10 overflow-hidden pointer-events-auto motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
        >
          {/* Sheet header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 dark:border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{sheetTitle}</span>
              {renderedSheet === "alerts" && unreadCount > 0 && (
                <span className="text-[11px] font-semibold text-secondary bg-secondary/12 rounded-full px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {renderedSheet === "alerts" && notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 h-9 rounded-lg hover:bg-muted/60 dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpenSheet(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sheet body — scrollable */}
          <div className="overflow-y-auto overscroll-contain p-3">
            {/* ── Modules ── */}
            {renderedSheet === "modules" && (
              <div className="grid grid-cols-2 gap-2.5">
                {visibleModules.map((item) => {
                  const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        group flex items-center gap-3 p-3 rounded-2xl border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                        ${active
                          ? "border-secondary/45 bg-secondary/[0.07]"
                          : "border-border dark:border-white/10 hover:bg-muted/60 dark:hover:bg-white/[0.05]"
                        }
                      `}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-muted dark:bg-white/[0.06]">
                        <NavLinkIcon icon={item.icon} className={`w-5 h-5 ${item.accent}`} />
                      </span>
                      <span className={`text-sm leading-tight ${active ? "font-semibold text-foreground" : "font-medium text-foreground/85"}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Alerts ── */}
            {renderedSheet === "alerts" && (
              <div className="space-y-2">
                {permission === "default" && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/[0.07] border border-secondary/25">
                    <Bell className="w-5 h-5 text-secondary flex-shrink-0" aria-hidden="true" />
                    <p className="flex-1 text-xs text-foreground/80 leading-snug">
                      Enable push notifications for loss, contract and plant-failure alerts.
                    </p>
                    <button
                      onClick={() => requestPermission()}
                      className="text-xs font-semibold bg-secondary text-secondary-foreground rounded-lg px-3 h-9 hover:bg-secondary/85 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none flex-shrink-0"
                    >
                      Enable
                    </button>
                  </div>
                )}

                {/* Shared feed: operational alerts + session notifications */}
                <AlertsFeed onNavigate={() => setOpenSheet(null)} />
              </div>
            )}

            {/* ── Profile ── */}
            {renderedSheet === "profile" && (
              <div className="space-y-3">
                {/* Identity */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/60 dark:bg-white/[0.04]">
                  <Avatar className="w-11 h-11 border-2 border-border dark:border-white/10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
                    {user?.email && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
                    <span className="text-[11px] text-secondary font-medium mt-0.5">{roleLabel}</span>
                  </div>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border dark:border-white/10">
                  <span className="text-sm font-medium text-foreground">Appearance</span>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-muted dark:bg-white/[0.06]" role="group" aria-label="Theme">
                    <button
                      onClick={() => setTheme("light")}
                      aria-pressed={resolvedTheme === "light"}
                      className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                        resolvedTheme === "light"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sun className="w-4 h-4" /> Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      aria-pressed={resolvedTheme === "dark"}
                      className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                        resolvedTheme === "dark"
                          ? "bg-[var(--background)] text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                  </div>
                </div>

                {/* Settings */}
                {canOpenSettings && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border dark:border-white/10 hover:bg-muted/60 dark:hover:bg-white/[0.05] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-current={onSettingsRoute ? "page" : undefined}
                  >
                    <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-muted dark:bg-white/[0.06]">
                      <Settings className="w-5 h-5 text-foreground/80" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">Settings</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                )}

                {/* Sign out */}
                <button
                  onClick={() => {
                    setOpenSheet(null);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-transparent text-mb-danger-text hover:bg-mb-danger-light transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-mb-danger-light">
                    <LogOut className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-left text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating pill dock ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 z-[100] md:hidden flex justify-center px-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <nav
          className="w-full max-w-md rounded-[26px] bg-card/95 dark:bg-muted/90 backdrop-blur-xl border border-border/70 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_34px_rgba(0,0,0,0.55)]"
          aria-label="Mobile navigation"
        >
          <div className="flex items-stretch justify-around h-16 px-1.5">
            {/* Overview → dashboard link */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center gap-1 flex-1 rounded-[20px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                overviewActive ? "text-secondary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={overviewActive ? "page" : undefined}
            >
              <NavLinkIcon icon={LayoutGrid} className="w-6 h-6" />
              <span className={`text-[11px] leading-none ${overviewActive ? "font-semibold" : "font-medium"}`}>Overview</span>
            </Link>

            {/* Modules → sheet */}
            <button
              onClick={(e) => toggleSheet("modules", e)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 rounded-[20px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                modulesActive ? "text-secondary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-haspopup="dialog"
              aria-expanded={openSheet === "modules"}
            >
              <Building2 className="w-6 h-6" />
              <span className={`text-[11px] leading-none ${modulesActive ? "font-semibold" : "font-medium"}`}>Modules</span>
            </button>

            {/* Alerts → sheet (with unread badge) */}
            <button
              onClick={(e) => toggleSheet("alerts", e)}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 rounded-[20px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                alertsActive ? "text-secondary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-haspopup="dialog"
              aria-expanded={openSheet === "alerts"}
            >
              <span className="relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -end-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--card)] dark:ring-[var(--muted)]"
                    style={{ backgroundColor: "var(--status-danger)" }}
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] leading-none ${alertsActive ? "font-semibold" : "font-medium"}`}>Alerts</span>
              <span className="sr-only">{unreadCount > 0 ? `, ${unreadCount} unread` : ""}</span>
            </button>

            {/* Profile → sheet */}
            <button
              onClick={(e) => toggleSheet("profile", e)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 rounded-[20px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                profileActive ? "text-secondary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-haspopup="dialog"
              aria-expanded={openSheet === "profile"}
            >
              <CircleUser className="w-6 h-6" />
              <span className={`text-[11px] leading-none ${profileActive ? "font-semibold" : "font-medium"}`}>Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
