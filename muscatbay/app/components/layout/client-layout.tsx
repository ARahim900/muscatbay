"use client";

import React from 'react';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BottomNav } from './bottom-nav';

// This internal component consumes the context to adjust its margin
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden">
      {/* Sidebar - hidden on mobile, visible on md+ */}
      <Sidebar />

      {/* Main Content Area - Responsive margins that adapt to sidebar state */}
      {/* On mobile: no left margin, bottom padding for bottom nav */}
      {/* On desktop: left margin for the sidebar */}
      <main
        className={`
          flex-1 min-w-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
          min-h-[100dvh] bg-gray-50 dark:bg-slate-950
          ms-0 pb-16 md:pb-0
          ${isCollapsed ? "md:ms-[72px]" : "md:ms-[220px]"}
        `}
      >
        <Topbar />

        {/* Layout shell with mobile-first responsive padding */}
        <div className="layout-shell w-full pt-6 pb-4 sm:pt-7 sm:pb-5 md:pt-8 md:pb-6 lg:pt-10 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation - mobile only */}
      <BottomNav />
    </div>
  );
}

// Export the wrapper that provides the context
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}