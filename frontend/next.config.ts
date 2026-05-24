import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // enables multi-stage Docker build (copies .next/standalone)
};

export default nextConfig;

