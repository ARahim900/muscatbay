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
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar - hidden on mobile, visible on md+ */}
      <Sidebar />

      {/* Main Content Area - Responsive margins that adapt to sidebar state */}
      <main
        id="main-content"
        className={`
          flex-1 min-w-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
          min-h-[100dvh] bg-gray-50 dark:bg-[var(--background)]
          ms-0 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0
          ${isCollapsed ? "md:ms-[72px]" : "md:ms-[220px]"}
        `}
      >
        <Topbar />

        {/* Layout shell with mobile-first responsive padding */}
        <div className="layout-shell w-full pt-4 pb-3 sm:pt-6 sm:pb-4 md:pt-8 md:pb-6">
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