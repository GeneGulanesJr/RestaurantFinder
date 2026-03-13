import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Production optimizations
  compress: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['zod'],
  },
};

export default nextConfig;
