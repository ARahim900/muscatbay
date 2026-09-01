"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
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

  return (
    <ToastProvider>
      <AuthProvider initialAuth={initialAuth}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <CommandPaletteRoot />
      </AuthProvider>
    </ToastProvider>
  );
}
