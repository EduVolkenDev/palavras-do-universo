import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const canonicalSiteUrl = "https://palavrasdouniverso.com";
const legacyHosts = [
  "palavrasdouniverso.volynx.world",
  "www.palavrasdouniverso.volynx.world",
  "palavrasdouniverso.volinx.world",
  "www.palavrasdouniverso.volinx.world",
  "www.palavrasdouniverso.com",
];
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), payment=(self)" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    qualities: [72, 74, 75, 84, 86, 88, 90, 95],
  },
  async redirects() {
    return legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${canonicalSiteUrl}/:path*`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/meu-universo",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/acao/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
