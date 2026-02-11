import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler
  reactCompiler: true,
  // Turbopack is default in Next.js 16
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },
  // Security headers are now in proxy.ts

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
