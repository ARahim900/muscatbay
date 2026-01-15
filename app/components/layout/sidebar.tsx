"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from './sidebar-context';
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  section?: string;
}

// Muscat Bay O&M Navigation Map - organized by sections
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/", section: "main" },
  { id: "water", name: "Water System", icon: Droplets, href: "/water", section: "utilities" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/electricity", section: "utilities" },
  { id: "stp", name: "STP Plant", icon: Settings, href: "/stp", section: "utilities" },
  { id: "contractors", name: "Contractors", icon: Users, href: "/contractors", section: "operations" },
  { id: "assets", name: "Assets", icon: Package, href: "/assets", section: "operations" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control", section: "operations" },
  { id: "fire-safety", name: "Fire & Safety", icon: Flame, href: "/firefighting", section: "operations" },
  { id: "settings", name: "Settings", icon: Settings, href: "/settings", section: "system" },
];

// Section labels for better organization
const sectionLabels: Record<string, string> = {
  main: "Overview",
  utilities: "Utilities",
  operations: "Operations",
  system: "System",
};

export function Sidebar() {
  const { isOpen, setIsOpen, toggleSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const pathname = usePathname();

  const handleItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Group navigation items by section
  const groupedItems = navigationItems.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const sectionOrder = ['main', 'utilities', 'operations', 'system'];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed top-0 left-0 h-screen min-h-screen z-40 transition-all duration-300 ease-out flex flex-col shadow-2xl bg-[#4e4456]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-[72px]" : "w-[240px]"}
          md:translate-x-0
        `}
      >
        {/* Header with logo and collapse button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b border-gray-600 h-20`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white/10 p-1">
                <Image
                  src="/mb-logo.png"
                  alt="Muscat Bay Logo"
                  width={32}
                  height={32}
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base leading-tight tracking-tight">
                  <span className="text-white">MUSCAT</span>
                  <span style={{ color: '#81D8D0' }}> BAY</span>
                </span>
                <span className="text-[11px] text-white/60 font-normal">Resource Management</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white/10">
              <span className="text-white font-bold text-sm">
                <span className="text-white">M</span>
                <span style={{ color: '#81D8D0' }}>B</span>
              </span>
            </div>
          )}

          {/* Desktop collapse button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Centered Collapse Button for Collapsed State */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex w-full items-center justify-center py-3 hover:bg-white/10 text-white/70 hover:text-white transition-colors duration-200 border-b border-white/10"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {sectionOrder.map((sectionKey, sectionIndex) => {
            const items = groupedItems[sectionKey];
            if (!items?.length) return null;

            return (
              <div key={sectionKey} className={sectionIndex > 0 ? 'mt-6' : ''}>
                {/* Section Label */}
                {!isCollapsed && (
                  <div className="px-3 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {sectionLabels[sectionKey]}
                    </span>
                  </div>
                )}

                {isCollapsed && sectionIndex > 0 && (
                  <div className="mx-2 mb-3 border-t border-white/10" />
                )}

                <ul className="space-y-1">
                  {items.map((item) => {
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
                            group/sidebar w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all duration-200 relative
                            ${isActive
                              ? "bg-white/10 text-white"
                              : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }
                            ${isCollapsed ? "justify-center px-2" : ""}
                          `}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <div className="flex items-center justify-center flex-shrink-0">
                            <Icon
                              className={`
                                w-5 h-5 transition-all duration-200
                                ${isActive ? "text-brand-accent" : "text-current group-hover/sidebar:scale-110"}
                              `}
                            />
                          </div>

                          {!isCollapsed && (
                            <>
                              <span className="text-sm leading-tight truncate transition-transform duration-200 group-hover/sidebar:translate-x-0.5 flex-1">
                                {item.name}
                              </span>
                              {/* Active indicator dot on the right */}
                              {isActive && (
                                <div className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0" />
                              )}
                            </>
                          )}

                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-white text-brand-primary text-sm rounded-lg opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl font-medium pointer-events-none">
                              {item.name}
                              {/* Triangle */}
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white rotate-45" />
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Bottom section with logout */}
        <div className="mt-auto border-t border-gray-600">
          <div className="p-4">
            <button
              onClick={() => console.log("Logout clicked")}
              className={`
                group/sidebar w-full flex items-center gap-3 rounded-xl text-left transition-all duration-200
                text-white/70 hover:bg-red-500/20 hover:text-red-300
                ${isCollapsed ? "justify-center py-2.5 px-2" : "py-2.5 px-3"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover/sidebar:scale-110" />

              {!isCollapsed && (
                <span className="text-sm leading-tight transition-transform duration-200 group-hover/sidebar:translate-x-0.5">Sign Out</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-white text-brand-primary text-sm rounded-lg opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl font-medium pointer-events-none">
                  Sign Out
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}