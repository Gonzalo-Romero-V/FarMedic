import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/auth/google/:path*',
        destination: 'http://127.0.0.1:8000/auth/google/:path*',
      },
    ];
  },
};

export default nextConfig;
