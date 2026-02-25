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
    },
};

export default nextConfig;
