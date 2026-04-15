import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // dev server proxy 超时设置，避免长耗时 API route 被提前断开
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;
