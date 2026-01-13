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
  Activity,
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
  Search,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

// Muscat Bay O&M Navigation Map
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "water", name: "Water System", icon: Droplets, href: "/water" },
  { id: "electricity", name: "Electricity System", icon: Zap, href: "/electricity" },
  { id: "stp", name: "STP Plant", icon: Settings, href: "/stp" },
  { id: "contractors", name: "Contractor Tracker", icon: Users, href: "/contractors" },
  { id: "assets", name: "Assets", icon: Package, href: "/assets" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/pest-control" },
  { id: "fire-safety", name: "Firefighting & Alarm", icon: Flame, href: "/firefighting" },
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const { isOpen, setIsOpen, toggleSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const pathname = usePathname();

  const handleItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-[7px] rounded-[5px] bg-sidebar text-white shadow-md md:hidden hover:bg-white/10 transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        aria-label="Toggle sidebar"
      >
        {isOpen ?
          <X className="h-[17.5px] w-[17.5px]" /> :
          <Menu className="h-[17.5px] w-[17.5px]" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container - Updated dimensions: 70px collapsed, 208px expanded */}
      <div
        className={`
          fixed top-0 left-0 h-screen min-h-screen bg-sidebar z-40 transition-all duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-[70px]" : "w-[208px]"}
          md:translate-x-0 md:sticky md:top-0 md:z-auto
        `}
        style={{ backgroundColor: '#4E4456' }}
      >
        {/* Header with logo and collapse button - height: 60.5px */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-[10.5px] border-b border-white/10 h-[60.5px]`}>
          {!isCollapsed && (
            <div className="flex items-center gap-[10.5px]">
              <div className="w-[35px] h-[35px] rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src="/mb-logo.png"
                  alt="Muscat Bay Logo"
                  width={35}
                  height={35}
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#F8FAFC] text-[15.75px] leading-[24.5px] tracking-tight">Muscat Bay</span>
                <span className="text-[12px] text-white/50 font-normal whitespace-nowrap">Resource Management</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-[35px] h-[35px] rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src="/mb-logo.png"
                alt="Muscat Bay Logo"
                width={35}
                height={35}
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Desktop collapse button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-[5px] hover:bg-white/10 text-[#E4E4E7] hover:text-white transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
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
            className="hidden md:flex w-full items-center justify-center py-2 hover:bg-white/10 text-[#E4E4E7] hover:text-white transition-colors duration-[200ms] border-b border-white/10"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Search Bar (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="px-[10.5px] py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-[#E4E4E7]" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-[8.75px] bg-white/5 border border-white/10 rounded-[7px] text-[14px] leading-[21px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary/50 transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-[10.5px] py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
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
                      group/sidebar w-full flex items-center gap-[7px] py-[8.75px] px-[10.5px] rounded-[7px] text-left transition-all duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative
                      ${isActive
                        ? "bg-white/20 text-white shadow-md"
                        : "text-[#E4E4E7] hover:bg-white/10 hover:text-white"
                      }
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center flex-shrink-0">
                      <Icon
                        className={`
                          w-[17.5px] h-[17.5px] transition-colors duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                          ${isActive ? "text-white" : "text-current"}
                        `}
                      />
                    </div>

                    {!isCollapsed && (
                      <span className="text-[14px] font-normal leading-[21px] truncate transition-transform duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/sidebar:translate-x-1">
                        {item.name}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1.5 bg-white text-sidebar text-xs rounded-[5px] opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible transition-all duration-[150ms] whitespace-nowrap z-50 shadow-lg font-medium">
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
        </nav>

        {/* Bottom section with logout */}
        <div className="mt-auto border-t border-white/10">
          <div className="p-[10.5px]">
            <button
              onClick={() => console.log("Logout clicked")}
              className={`
                group/sidebar w-full flex items-center gap-[7px] rounded-[7px] text-left transition-all duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                text-[#E4E4E7] hover:bg-red-500/10 hover:text-red-400
                ${isCollapsed ? "justify-center py-[8.75px] px-2" : "py-[8.75px] px-[10.5px]"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-[17.5px] w-[17.5px] flex-shrink-0" />

              {!isCollapsed && (
                <span className="text-[14px] font-normal leading-[21px] transition-transform duration-[150ms] group-hover/sidebar:translate-x-1">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}