import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable network interface detection
  experimental: {
    modifyNavItems: false,
  },
  // Force listen on localhost only  
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;