"use client";

import React from 'react';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { Sidebar } from './sidebar';

// This internal component consumes the context to adjust its margin
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar is fixed, so we don't need it inside the flex flow for width,
          but we use the margin on the content to push it over */}
      <Sidebar />

      {/* Main Content Area - Responsive margins that adapt to sidebar state */}
      <main
        className={`
          flex-1 transition-all duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          w-full min-h-screen bg-background
          ${isCollapsed ? "md:ml-[70px]" : "md:ml-[208px]"}
        `}
      >
        {/* Layout shell with mobile-first responsive padding */}
        <div className="layout-shell w-full py-4 sm:py-5 md:py-6 lg:py-8">
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