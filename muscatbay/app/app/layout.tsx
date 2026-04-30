import "./globals.css";

import { Providers } from "@/components/providers";
import { NotificationProvider } from "@/components/NotificationProvider";
import { RegisterSW } from "@/components/pwa/register-sw";
import { LayoutRouter } from "@/components/layout/layout-router";

export const metadata = {
  title: "Muscat Bay Operations",
  description: "Operations Dashboard for Muscat Bay",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Muscat Bay Operations",
    description: "Operations Dashboard for Muscat Bay",
    siteName: "Muscat Bay Operations",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muscat Bay Operations",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muscat Bay Operations",
    description: "Operations Dashboard for Muscat Bay",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://utnlgeuqajmwibqmdmgt.supabase.co" />
        <link rel="preconnect" href="https://utnlgeuqajmwibqmdmgt.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <RegisterSW />
        <Providers>
          <NotificationProvider>
            <LayoutRouter>
              {children}
            </LayoutRouter>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
