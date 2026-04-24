"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ClientLayout } from "@/components/layout/client-layout";

// Routes that render without AuthProvider + sidebar:
// auth flows (login/signup/etc.) and public legal pages (privacy/terms).
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/auth", "/privacy", "/terms"];

// Routes that render at full viewport — auth stays, but no app chrome
// (no topbar/sidebar/padding). For immersive full-screen tools like the
// 3D water-network map that need the entire window.
const FULLSCREEN_PAGES = ["/water-network"];

export function LayoutRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage    = AUTH_PAGES.some(page => pathname?.startsWith(page));
  const isFullscreen  = FULLSCREEN_PAGES.some(page => pathname?.startsWith(page));

  if (isAuthPage) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  if (isFullscreen) {
    return (
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </AuthProvider>
    </ToastProvider>
  );
}
