import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow up to 5MB for photo uploads (default is 1MB)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
