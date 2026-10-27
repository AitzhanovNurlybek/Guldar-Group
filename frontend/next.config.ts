import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Assets are compressed at build time; Vercel's service rewrite does not expose /_next/image.
  images: { unoptimized: true },
  async headers() {
    return ["/scene/:path*", "/clients/optimized/:path*", "/reviews/:path*", "/images/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
    }));
  },
};

export default nextConfig;
