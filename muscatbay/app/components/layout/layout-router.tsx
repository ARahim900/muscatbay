"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ClientLayout } from "@/components/layout/client-layout";
import { CommandPaletteRoot } from "@/components/shared/command-palette";
import type { ServerAuthSnapshot } from "@/lib/supabase-server";

// Routes that render without AuthProvider + sidebar:
// auth flows (login/signup/etc.) and public legal pages (privacy/terms).
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/auth", "/privacy", "/terms"];

export function LayoutRouter({
  children,
  initialAuth,
}: {
  children: React.ReactNode;
  initialAuth: ServerAuthSnapshot;
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));

  if (isAuthPage) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  // NotificationProvider only wraps the authenticated tree. It drives
  // useOperationalAlerts, which reads water/contractor/STP tables and opens a
  // realtime channel, so mounting it on a public route means unauthorised
  // requests that RLS now correctly refuses. Every consumer of the context
  // (dashboard, STP, settings, topbar bell, bottom nav, alerts feed) lives
  // inside this branch, so nothing on an auth page loses its provider.
  return (
    <ToastProvider>
      <AuthProvider initialAuth={initialAuth}>
        <NotificationProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
          <CommandPaletteRoot />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
