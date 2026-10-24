import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_API_URL || "https://todo-fastapi-u1ip.onrender.com";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.36.120.123"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
