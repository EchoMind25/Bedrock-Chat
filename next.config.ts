import type { NextConfig } from "next";

// Extract hostname from NEXT_PUBLIC_SUPABASE_URL for Next.js Image optimization.
// Falls back to a wildcard pattern covering all Supabase projects.
const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : "*.supabase.co";
  } catch {
    return "*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Enable React Compiler
  reactCompiler: true,
  // Turbopack is default in Next.js 16
  turbopack: {},
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },
  // Security headers are now in proxy.ts

  experimental: {
    // Disable strict CSS chunking to merge CSS into fewer files.
    // This eliminates "preloaded but not used" warnings caused by per-route
    // CSS chunks being preloaded for dynamically-imported components
    // (e.g. Hero3DScene via next/dynamic) that load after the preload timeout.
    cssChunking: false,
  },

  // Performance: Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = false; // Disable source maps in dev for 60% faster compilation
    }
    return config;
  },
};

export default nextConfig;
