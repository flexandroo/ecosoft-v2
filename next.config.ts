import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // 85 is used for the large photo on the product page.
    qualities: [75, 85],
  },
  async redirects() {
    // SCALEX consumables moved from "Магістральні фільтри" to "Картриджі магістральні" (as on ecosoft.ua).
    return ["kartridzh-dlya-filtra-ot-nakipi-ecosoft-scalex", "napolnitel-dlya-filtrov-ot-nakipi-ecosoft-scalex-200-ml"].map(
      (slug) => ({
        source: `/catalog/mainline-filters/${slug}`,
        destination: `/catalog/mainline-cartridges/${slug}`,
        permanent: true,
      }),
    );
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self' https://www.facebook.com",
          "frame-ancestors 'self'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://*.clarity.ms https://static.cloudflareinsights.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "media-src 'self'",
          "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://*.clarity.ms https://cloudflareinsights.com https://*.on.aws https://*.run.app",
          "frame-src https://www.googletagmanager.com https://www.facebook.com",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];

    // The admin shares the root layout (and its ad tags) with the storefront.
    // This stricter policy overrides the one above for /admin, so the browser
    // refuses to load Meta Pixel / GTM / Clarity there: staff activity and
    // customer data never reach the ad or analytics platforms.
    const adminHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.supabase.co",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co",
          "frame-src 'none'",
        ].join("; "),
      },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin", headers: adminHeaders },
      { source: "/admin/:path*", headers: adminHeaders },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
