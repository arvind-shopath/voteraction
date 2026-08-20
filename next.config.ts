import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    // Disable type checking during build (already done in tsconfig)
    ignoreBuildErrors: true,
  },
  // Production optimizations
  reactStrictMode: false, // Faster builds
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    cpus: 1,
    workerThreads: false
  },
  async redirects() {
    return [
      {
        source: '/voters/import',
        destination: '/voters/data-import',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
