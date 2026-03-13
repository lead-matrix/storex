import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'hsevxangxdfyolgspydl.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'zsahskxejgbrvfhobfyp.supabase.co',
      }
    ],
  },

};

export default nextConfig;
