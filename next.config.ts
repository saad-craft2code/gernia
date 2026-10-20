import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically; "standalone" is only for self-hosting
  // (Docker, VPS). Set SELF_HOST=true locally to re-enable standalone output.
  output: process.env.SELF_HOST === "true" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
