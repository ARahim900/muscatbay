import "./globals.css";

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { NotificationProvider } from "@/components/NotificationProvider";
import { RegisterSW } from "@/components/pwa/register-sw";
import { LayoutRouter } from "@/components/layout/layout-router";
import { Geist, Geist_Mono } from "next/font/google";

// Geist — modern, precise, elegant UI face that suits the dark-first BMS tone.
// Variable font (100–900), so font-medium/semibold/bold AND font-extrabold (800)
// and font-black (900) are all genuine weights — nothing synthesises a faux weight.
const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Geist Mono — meter IDs, account numbers and other genuine mono content
// (wired to --font-mono and consumed by the .meter rule in globals.css).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

/** Resolve canonical site URL for Open Graph/Twitter metadata only (no UI impact). */
function resolveMetadataBase(): URL {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return new URL(site);
  const vercel = process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
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
    { media: "(prefers-color-scheme: light)", color: "#F7F8F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0A090C" },
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
      <body className={`${geistSans.className} ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
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
