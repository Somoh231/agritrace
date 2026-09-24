import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgriVault",
    short_name: "AgriVault",
    description: "AgriVault operations platform: field capture, verification and reporting (offline-capable).",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#07152D",
    theme_color: "#07152D",
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

