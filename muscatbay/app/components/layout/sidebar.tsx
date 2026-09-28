"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link, { useLinkStatus } from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useSidebar } from './sidebar-context';
import { useAuth } from '@/components/auth/auth-provider';
import { useUserRole } from '@/hooks/useUserRole';
import { canAccessModule, type ModuleKey } from '@/lib/rbac';
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from '@/lib/motion';
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
  Loader2,
  Waves,
  Wrench,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  /** Module key for RBAC filtering. Omit for always-visible items. */
  module?: ModuleKey;
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
      { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/", module: "dashboard" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "water", name: "Water", icon: Droplets, href: "/water", module: "water" },
      { id: "electricity", name: "Electricity", icon: Zap, href: "/electricity", module: "electricity" },
      { id: "stp", name: "STP Plant", icon: Waves, href: "/stp", module: "stp" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "contractors", name: "Contractors", icon: Users, href: "/contractors", module: "contractors" },
      { id: "hvac-system", name: "HVAC System", icon: Wrench, href: "/hvac", module: "hvac" },
      { id: "assets", name: "Assets", icon: Package, href: "/assets", module: "assets" },
      { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control", module: "pest-control" },
      { id: "fire-safety", name: "Fire Safety", icon: Flame, href: "/firefighting", module: "firefighting" },
    ],
  },
];

// Flat list used for "more-specific-sibling" active detection.
const allNavigationItems: NavigationItem[] = navGroups.flatMap((g) => g.items);

/**
 * Nav item icon that doubles as a lightweight in-place pending indicator:
 * while THIS link's navigation is in flight (useLinkStatus), the module icon
 * swaps to a spinner. Must be rendered inside the <Link> to read its status.
 */
function NavLinkIcon({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className: string }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 className={`${className} motion-safe:animate-spin`} aria-hidden="true" />;
  return <Icon className={className} />;
}

/** Where the folded rail's single tooltip sits, in viewport pixels. */
interface RailTooltip {
  label: string;
  /** Vertical centre of the item. */
  top: number;
  /** Inline-start edge: `left` in LTR, `right` in RTL. */
  inset: number;
  rtl: boolean;
}

// Bottom navigation items
const bottomNavItems: NavigationItem[] = [
  { id: "settings", name: "Settings", icon: Settings, href: "/settings", module: "settings" },
];

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const { logout, isDevMode } = useAuth();
  const role = useUserRole();
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const railAnimatedRef = useRef(false);
  const [tooltip, setTooltip] = useState<RailTooltip | null>(null);

  // Gliding active rail: one teal indicator that travels between nav items on
  // navigation instead of blinking on/off. The per-item static bars (class
  // nav-rail-static) remain as the no-JS / reduced-motion fallback and are
  // hidden via [data-rail="on"] once the rail takes over.
  useIsomorphicLayoutEffect(() => {
    const aside = asideRef.current;
    const rail = railRef.current;
    if (!aside || !rail || prefersReducedMotion()) return;

    aside.dataset.rail = 'on';

    const place = (animate: boolean) => {
      const active = aside.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!active) {
        gsap.set(rail, { autoAlpha: 0 });
        return;
      }
      const asideRect = aside.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      // top-1.5/bottom-1.5 (6px) insets match the static bars exactly
      // + scrollTop: on short landscape screens the whole aside scrolls (see
      // .app-sidebar in globals.css) and the rail scrolls with it, so it must be
      // placed in content coordinates. scrollTop is 0 everywhere else.
      const target = { y: rect.top - asideRect.top + aside.scrollTop + 6, height: rect.height - 12, autoAlpha: 1 };
      if (animate && railAnimatedRef.current) {
        gsap.to(rail, { ...target, duration: 0.5, ease: MOTION.ease.out, overwrite: 'auto' });
      } else {
        gsap.set(rail, target);
      }
      railAnimatedRef.current = true;
    };

    place(true);

    // Tall layout only: the nav is the scroll box there. On short landscape
    // screens the nav does not scroll (the whole aside does), and the rail sits
    // inside that aside and scrolls with it, so it needs no re-placing.
    const nav = aside.querySelector('nav');
    const onScroll = () => place(false);
    nav?.addEventListener('scroll', onScroll, { passive: true });

    // Re-seat after the 200ms collapse/expand width transition settles
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'width') place(false);
    };
    aside.addEventListener('transitionend', onTransitionEnd);

    const resizeObserver = new ResizeObserver(() => place(false));
    resizeObserver.observe(aside);

    return () => {
      nav?.removeEventListener('scroll', onScroll);
      aside.removeEventListener('transitionend', onTransitionEnd);
      resizeObserver.disconnect();
    };
  }, [pathname, isCollapsed, role, isDevMode]);

  // Folded-rail tooltips are portalled to <body>, not drawn inside the item.
  // The nav (and, on short landscape screens, the whole aside) is a scroll box,
  // and a scroll box clips anything that pokes out sideways, so in-place
  // tooltips were cut off. The aside's transform also rules out position:fixed
  // inside it. One tooltip, placed from the item's viewport rect.
  const showTooltip = (label: string) => (event: React.SyntheticEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      inset: rtl ? window.innerWidth - rect.left + 12 : rect.right + 12,
      rtl,
    });
  };
  const hideTooltip = () => setTooltip(null);
  const tooltipHandlers = (label: string) =>
    isCollapsed
      ? { onMouseEnter: showTooltip(label), onMouseLeave: hideTooltip, onFocus: showTooltip(label), onBlur: hideTooltip }
      : {};
  // Only the folded rail has tooltips; expanding hides any that is open.
  const visibleTooltip = isCollapsed ? tooltip : null;

  // A placed tooltip goes stale once anything under it moves. Capture on the
  // aside catches the nav's scroll too (scroll events do not bubble).
  const tooltipOpen = visibleTooltip !== null;
  useEffect(() => {
    if (!tooltipOpen) return;
    const aside = asideRef.current;
    const hide = () => setTooltip(null);
    aside?.addEventListener('scroll', hide, { capture: true, passive: true });
    window.addEventListener('resize', hide);
    return () => {
      aside?.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [tooltipOpen]);

  // RBAC filter — hide nav items the current role can't access. Dev mode
  // bypasses for local testing. This is a soft UI gate; Supabase RLS is the
  // hard gate on the data itself.
  const visibleNavGroups = isDevMode ? navGroups : navGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.module || canAccessModule(role, it.module)) }))
    .filter((g) => g.items.length > 0);
  const visibleBottomItems = isDevMode ? bottomNavItems : bottomNavItems
    .filter((it) => !it.module || canAccessModule(role, it.module));

  return (
    <>
      {/* Sidebar Container — desktop only. On mobile it stays translated
          off-canvas and the bottom-nav dock provides navigation, so there is
          no drawer state, overlay or trigger to maintain. */}
      <aside
        ref={asideRef}
        className={`
          app-sidebar fixed top-0 start-0 h-dvh z-40
          flex flex-col
          bg-[var(--sidebar)] border-e border-white/10
          transition-[width] duration-200 ease-out
          -translate-x-full rtl:translate-x-full
          w-[var(--sidebar-w)]
          md:translate-x-0 md:rtl:translate-x-0
        `}
        // Respect notched-device safe areas in landscape so nav content doesn't
        // sit under a hardware cutout. --sidebar-w already includes the left
        // inset, so this padding eats into the extra width, not the rail.
        // The top inset matters on iPad, where the sidebar is on screen from
        // 768px and the installed app paints under the status bar: without it
        // the brand lockup sat under the clock. It is 0 in a browser tab, and
        // where it is not, the topbar grows by the same inset (globals.css §3),
        // so the brand row still lines up with the topbar.
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingInlineStart: "env(safe-area-inset-left, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Main navigation"
      >
        {/* Gliding active rail — travels between items; see effect above.
            gsap-lift is warranted here and nowhere else in the sidebar: this is
            a single node that GSAP re-drives on every navigation, so the layer
            promotion is paid once and reused rather than being re-taken on each
            tween. (The rail also tweens `height`, which no will-change hint can
            help; `y` and `autoAlpha` are the two that benefit.) */}
        <span
          ref={railRef}
          aria-hidden="true"
          className="gsap-lift pointer-events-none absolute start-0 top-0 z-10 w-[3px] rounded-e-full bg-secondary opacity-0"
          // Sit on the inner edge of the notch padding, not under the cutout.
          style={{ insetInlineStart: "env(safe-area-inset-left, 0px)" }}
        />

        {/* Brand lockup — same height as topbar (h-16 = 64px) */}
        <div className={`h-16 flex items-center flex-shrink-0 border-b border-white/10 ${isCollapsed ? "px-3" : "ps-5 pe-3"}`}>
          {isCollapsed ? (
            /* Collapsed: centred logo icon doubles as expand trigger on desktop */
            <button
              onClick={toggleCollapse}
              className="hidden md:flex mx-auto w-10 h-10 items-center justify-center transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
              aria-label="Expand sidebar"
            >
              <Image src="/logo.png" alt="Muscat Bay" width={26} height={26} className="object-contain" priority />
            </button>
          ) : (
            /* Expanded: full brand lockup + collapse button */
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link href="/" className="flex items-center gap-2 group flex-1 min-w-0" aria-label="Muscat Bay home">
                <div className="w-7 h-9 flex-shrink-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-80">
                  <Image src="/logo.png" alt="Muscat Bay" width={26} height={26} className="object-contain" priority />
                </div>
                <div className="min-w-0">
                  <p className="text-title font-bold leading-tight">
                    <span className="text-white">MUSCAT </span>
                    <span className="text-secondary">BAY</span>
                  </p>
                  <p className="text-eyebrow uppercase text-white/55 truncate">
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
          {visibleNavGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              className={groupIdx > 0 ? (isCollapsed ? "mt-3 pt-3 border-t border-white/10" : "mt-4") : ""}
              role="group"
              aria-label={group.label}
            >
              {group.label && (
                <h2 className={`px-3 mb-1 text-eyebrow uppercase text-white/55 select-none ${isCollapsed ? "sr-only" : ""}`}>
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
                        aria-current={isActive ? "page" : undefined}
                        className={`
                          group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-inset
                          ${isActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/[0.04] hover:text-white"}
                          ${isCollapsed ? "justify-center px-2" : ""}
                        `}
                        aria-label={isCollapsed ? item.name : undefined}
                        {...tooltipHandlers(item.name)}
                      >
                        <span
                          aria-hidden="true"
                          className={`nav-rail-static absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-secondary transition-opacity duration-150 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <NavLinkIcon icon={Icon} className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 relative z-10 ${isActive ? "text-secondary" : "text-white/80 group-hover/nav:text-white"}`} />
                        {!isCollapsed && (
                          <span className={`text-sm truncate flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                            {item.name}
                          </span>
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
          {visibleBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  group/nav flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-inset
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/85 hover:bg-white/[0.04] hover:text-white"
                  }
                  ${isCollapsed ? "justify-center px-2" : ""}
                `}
                aria-label={isCollapsed ? item.name : undefined}
                {...tooltipHandlers(item.name)}
              >
                {/* Left accent bar */}
                <span
                  aria-hidden="true"
                  className={`nav-rail-static absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-secondary transition-opacity duration-150 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                />
                <NavLinkIcon
                  icon={Icon}
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors duration-150 relative z-10
                    ${isActive ? "text-secondary" : "text-white/80 group-hover/nav:text-white"}
                  `}
                />
                {!isCollapsed && (
                  <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                )}

              </Link>
            );
          })}

          {/* Logout Button — LogOut icon (no avatar) makes the intent unmistakable */}
          <button
            onClick={logout}
            className={`
              group/nav w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 ease-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-danger/60 focus-visible:ring-inset
              text-white/85 hover:bg-sidebar-danger/10 hover:text-sidebar-danger
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            aria-label={isCollapsed ? "Sign Out" : undefined}
            {...tooltipHandlers("Sign Out")}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-white/75 group-hover/nav:text-sidebar-danger transition-colors duration-150" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}

          </button>
        </div>
      </aside>

      {/* Visual label only: each item already carries the same text as its
          aria-label, so the tooltip is aria-hidden rather than describing the
          item a second time. */}
      {visibleTooltip && createPortal(
        <div
          aria-hidden="true"
          className="fixed z-[60] -translate-y-1/2 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none max-w-[calc(100vw-5rem)] overflow-hidden text-ellipsis motion-safe:animate-in fade-in duration-150"
          style={{ top: visibleTooltip.top, [visibleTooltip.rtl ? 'right' : 'left']: visibleTooltip.inset }}
        >
          {visibleTooltip.label}
          <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1 rtl:translate-x-1 w-2 h-2 bg-popover rotate-45" />
        </div>,
        document.body,
      )}
    </>
  );
}
