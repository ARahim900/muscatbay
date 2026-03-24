"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ClientLayout } from "@/components/layout/client-layout";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/auth"];

export function LayoutRouter({ children }: { children: React.ReactNode }) {
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
      <AuthProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </AuthProvider>
    </ToastProvider>
  );
}
