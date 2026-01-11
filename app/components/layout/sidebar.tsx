"use client";

import React from 'react';
import Link from 'next/link';
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
  Bell,
  HelpCircle
} from 'lucide-react';
import Image from 'next/image';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

// Muscat Bay O&M Navigation Map
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/app" },
  { id: "water", name: "Water Management", icon: Droplets, href: "/app/water" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/app/electricity" },
  { id: "stp", name: "STP Operations", icon: Activity, href: "/app/stp" },
  { id: "contractors", name: "Contractors", icon: Users, href: "/app/contractors" },
  { id: "assets", name: "Assets", icon: Package, href: "/app/assets" },
  { id: "pest-control", name: "Pest Control", icon: Bug, href: "/app/pest-control" },
  { id: "fire-safety", name: "Fire Safety", icon: Flame, href: "/app/firefighting" },
  { id: "settings", name: "Settings", icon: Settings, href: "/app/settings" },
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
        className="fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ?
          <X className="h-5 w-5 text-slate-600" /> :
          <Menu className="h-5 w-5 text-slate-600" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-72"}
          md:translate-x-0 md:static md:z-auto
        `}
      >
        {/* Header with logo and collapse button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-slate-200 bg-slate-50/60 h-20`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              {/* Use Image component if available, otherwise fallback to styled div */}
              <div className="w-8 h-8 relative flex-shrink-0">
                {/* Fallback Icon for Logo */}
                <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  MB
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm tracking-tight">MUSCAT BAY</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">O&M Dashboard</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">MB</span>
            </div>
          )}

          {/* Desktop collapse button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-all duration-200"
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
            className="hidden md:flex w-full items-center justify-center py-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border-b border-slate-100"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Search Bar (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              // Check active state - handles exact match for root and sub-paths for others
              const isActive = item.href === '/app'
                ? pathname === '/app'
                : pathname?.startsWith(item.href);

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative
                      ${isActive
                        ? "bg-blue-50/80 text-blue-700 font-medium shadow-sm ring-1 ring-blue-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      <Icon
                        className={`
                          h-5 w-5 flex-shrink-0 transition-colors duration-200
                          ${isActive
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-700"
                          }
                        `}
                      />
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full overflow-hidden">
                        <span className="truncate text-sm">{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-[10px] font-bold rounded-full ml-2
                            ${isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                        {/* Little triangle pointer */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45" />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-slate-200 bg-white">
          {/* Profile Section */}
          <div className={`border-b border-slate-200 ${isCollapsed ? 'py-4 px-2' : 'p-4'}`}>
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                  <span className="text-blue-700 font-bold text-xs">AD</span>
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-sm font-semibold text-slate-800 truncate">Admin User</p>
                  <p className="text-xs text-slate-500 truncate">O&M Manager</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center group relative">
                <div className="relative cursor-pointer">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <span className="text-blue-700 font-bold text-xs">AD</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                {/* Profile Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg top-0">
                  <p className="font-semibold">Admin User</p>
                  <p className="text-slate-300 text-[10px]">O&M Manager</p>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={() => console.log("Logout clicked")} // Add actual logout logic here
              className={`
                w-full flex items-center rounded-lg text-left transition-all duration-200 group
                text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm
                ${isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-2.5"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />

              {!isCollapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}