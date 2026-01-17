"use client";

import "./globals.css";

import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ClientLayout } from "@/components/layout/client-layout";
import { Providers } from "@/components/providers";
import { usePathname } from "next/navigation";

// Use system font stack instead of Google Fonts to avoid build issues
const inter = {
  className: 'font-sans'
};

// Auth pages that don't need the main layout
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/auth"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));

  // Auth pages have their own layout
  if (isAuthPage) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Muscat Bay Operations</title>
          <meta name="description" content="Operations Dashboard for Muscat Bay" />
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Muscat Bay Operations</title>
        <meta name="description" content="Operations Dashboard for Muscat Bay" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <AuthProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </AuthProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
