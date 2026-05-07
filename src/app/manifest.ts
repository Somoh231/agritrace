import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agrivault",
    short_name: "Agrivault",
    description:
      "Ministry operational reporting and traceability platform (offline-capable).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/og.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

