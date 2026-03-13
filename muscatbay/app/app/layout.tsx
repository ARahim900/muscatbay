"use client";

import "./globals.css";

import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ClientLayout } from "@/components/layout/client-layout";
import { Providers } from "@/components/providers";
import { RegisterSW } from "@/components/pwa/register-sw";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

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
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0f172a" />
        </head>
        <body className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
          <RegisterSW />
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
        <RegisterSW />
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
