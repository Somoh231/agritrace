/**
 * Web app manifest for the authenticated AgriVault platform.
 *
 * Served here as a plain route (not app/manifest.ts) so Next.js does not link
 * it from every page: only the authenticated platform layout links it
 * ((dashboard)/layout.tsx). Public website, login and invitation pages carry no
 * manifest, so browsers never treat them as an installable app.
 *
 * `scope` stays "/" because platform routes live at the root (/command-center,
 * /farmers, /inventory, …); a narrower scope would push them out of the
 * installed window. `id` and `start_url` point inside the platform.
 */
import { NextResponse } from "next/server";

const MANIFEST = {
  id: "/app",
  name: "AgriVault",
  short_name: "AgriVault",
  description: "AgriVault operations platform: field capture, verification and reporting (offline-capable).",
  start_url: "/app",
  scope: "/",
  display: "standalone",
  background_color: "#07152D",
  theme_color: "#07152D",
  icons: [
    { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
} as const;

export const dynamic = "force-static";

export function GET() {
  return new NextResponse(JSON.stringify(MANIFEST), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
