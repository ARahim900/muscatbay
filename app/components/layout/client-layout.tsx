"use client";

import React from 'react';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { Sidebar } from './sidebar';

// This internal component consumes the context to adjust its margin
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar is fixed, so we don't need it inside the flex flow for width, 
          but we use the margin on the content to push it over */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        className={`
          flex-1 transition-all duration-300 ease-in-out w-full
          ${isCollapsed ? "md:ml-20" : "md:ml-72"}
          min-h-screen
        `}
      >
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto">
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