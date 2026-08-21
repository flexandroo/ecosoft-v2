import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://static.cloudflareinsights.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "media-src 'self'",
          "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://*.clarity.ms https://cloudflareinsights.com",
          "frame-src https://www.googletagmanager.com",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
