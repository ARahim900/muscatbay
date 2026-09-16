import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,
    // Image optimization handled by Vercel
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
        // Serve modern formats and right-sized variants (avatars from Supabase
        // would otherwise ship at original resolution).
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    // Keep compatibility-map imagery same-origin. Some iOS Safari sessions
    // reject the ArcGIS export image while ordinary cached XYZ tiles remain
    // reliable through this server-side proxy.
    rewrites: async () => [
        {
            source: "/api/satellite-tiles/:z/:x/:y",
            destination:
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/:z/:y/:x",
        },
    ],
    // PWA: ensure the service worker and manifest are served with correct headers
    headers: async () => [
        {
            source: "/sw.js",
            headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Service-Worker-Allowed", value: "/" },
            ],
        },
        {
            source: "/manifest.json",
            headers: [
                { key: "Cache-Control", value: "no-cache" },
            ],
        },
        {
            // Offline shell: precached by the SW, so the copy on the network
            // must never be a stale one when the SW version bumps.
            source: "/offline.html",
            headers: [
                { key: "Cache-Control", value: "no-cache" },
            ],
        },
    ],
};

export default nextConfig;
