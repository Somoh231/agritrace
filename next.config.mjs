/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ...securityHeaders,
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ...securityHeaders,
      ],
    },
  ],
};

export default nextConfig;
