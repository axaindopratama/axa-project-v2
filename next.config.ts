import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external device access during development (mobile testing via Wi‑Fi IP)
  allowedDevOrigins: [
    "192.168.11.182",
    "192.168.11.182:3000",
    "192.168.11.182:3001",
    "localhost",
    "localhost:3000",
    "localhost:3001",
    "127.0.0.1",
    "127.0.0.1:3000",
    "127.0.0.1:3001",
  ],
};

export default nextConfig;
