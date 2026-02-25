"use client";

import React from 'react';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

// This internal component consumes the context to adjust its margin
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isOpen } = useSidebar();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar is fixed, so we use margin on the content to push it over */}
      <Sidebar />

      {/* Main Content Area - Responsive margins that adapt to sidebar state */}
      {/* On mobile: content shifts when sidebar is open (pushes content) */}
      {/* On desktop: content always has margin for the sidebar */}
      <main
        className={`
          flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-full min-h-screen bg-gray-50 dark:bg-slate-950
          ${isOpen ? "ml-[220px] md:ml-0" : "ml-0"}
          ${isCollapsed ? "md:ml-[72px]" : "md:ml-[220px]"}
        `}
      >
        <Topbar />

        {/* Layout shell with mobile-first responsive padding */}
        <div className="layout-shell w-full pt-6 pb-4 sm:pt-7 sm:pb-5 md:pt-8 md:pb-6 lg:pt-10 lg:pb-8">
          {children}
        </div>
      </main>
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