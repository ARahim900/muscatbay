import "./globals.css";

import type { Metadata } from "next";
import { Providers } from "@/components/providers/app-providers";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { RegisterSW } from "@/components/pwa/register-sw";
import { LayoutRouter } from "@/components/layout/layout-router";
import { Geist_Mono, Inter } from "next/font/google";
import { getServerAuthSnapshot } from "@/lib/supabase-server";

// Nonces are unique per response and the authenticated shell is server-seeded,
// so this layout must never be emitted as a shared static document.
export const dynamic = "force-dynamic";

// Inter — the UI face for headings AND body (directed by Rahim 2026-08-31,
// superseding the 2026-08-30 "Geist stands" decision — see BRAND_DESIGN.md §3).
// Variable font (100–900), so font-medium/semibold/bold AND font-extrabold (800)
// and font-black (900) are all genuine weights — nothing synthesises a faux weight.
// The `opsz` axis loads Inter's optical-size range (14–32): small UI text renders
// the text grade, large headlines automatically get the Display grade with its
// tighter built-in spacing — the "UI-optimised" behaviour Inter is designed for.
const interSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  axes: ["opsz"],
});

// Geist Mono — meter IDs, account numbers and other genuine mono content
// (wired to --font-mono and consumed by the .meter rule in globals.css).
// Deliberately kept through the Inter switch: the brand framework prescribes
// no monospace face, and tabular identifiers need one.
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
  applicationName: "Muscat Bay Operations",
  // NOTE: the manifest is linked with a *relative* <link> in <head> below, not
  // via `metadata.manifest` — Next resolves that field against metadataBase,
  // which would emit a cross-origin (preview-deployment) URL on a custom
  // domain and break installability.
  appleWebApp: {
    capable: true,
    title: "Muscat Bay",
    // "default" (not black-translucent): the app ships a light *and* a dark
    // theme, and a translucent bar would paint white status-bar glyphs over
    // the white light-mode topbar. iOS insets the web view below the status
    // bar instead, which is legible in both themes.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Meter IDs and account numbers are digit strings — stop iOS turning them
    // into phone links inside tables.
    telephone: false,
  },
  other: {
    // Chromium's non-vendor-prefixed equivalent of apple-mobile-web-app-capable.
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    // iOS renders alpha as black, so the touch icon is the flattened,
    // full-bleed variant rather than the rounded-corner app icon.
    apple: { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialAuth = await getServerAuthSnapshot();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://utnlgeuqajmwibqmdmgt.supabase.co" />
        <link rel="preconnect" href="https://utnlgeuqajmwibqmdmgt.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className={`${interSans.className} ${interSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <RegisterSW />
        <Providers>
          <NotificationProvider>
            <LayoutRouter initialAuth={initialAuth}>
              {children}
            </LayoutRouter>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
