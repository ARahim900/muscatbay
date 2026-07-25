"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Desktop-only sidebar state.
 *
 * There is deliberately NO mobile "open" state: on small screens the sidebar
 * is never rendered on-canvas — the floating bottom-nav dock (Modules /
 * Alerts / Profile sheets) is the sole mobile navigation surface. The previous
 * `isOpen` / `toggleSidebar` pair had zero consumers that could ever set it
 * true, so the whole mobile drawer branch was unreachable code.
 */
interface SidebarContextType {
  isCollapsed: boolean; // Desktop state
  setIsCollapsed: (isCollapsed: boolean) => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount — hydration-safe pattern: we MUST
  // defer localStorage reads until after hydration to avoid SSR/CSR markup
  // mismatch. The new react-hooks/set-state-in-effect rule flags this but
  // there is no render-time alternative for browser-only state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
       
      // Guard: a corrupt/legacy non-JSON value would otherwise throw in this
      // app-wide mount effect and white-screen the whole app (a reload won't
      // clear the bad value). Fall back to the default (expanded) on any error.
      try { setIsCollapsed(JSON.parse(savedCollapsed) === true); } catch { /* keep default */ }
    }
  }, []);

  // Update localStorage when collapsed state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMounted]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapse
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}