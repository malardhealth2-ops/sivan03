import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow the cloud-sandbox preview gateway to load /_next/* dev assets.
  // Without this, Next.js (16+) blocks cross-origin HMR + chunk requests
  // from the *.space-z.ai preview domain, which makes the live preview blank.
  allowedDevOrigins: [
    "*.space-z.ai",
    "*.space-z.dev",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
