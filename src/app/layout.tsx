import type { Metadata } from "next";
import "./globals.css";
import "@/content/agrivault_site/_shared.css";
import { DM_Mono, DM_Sans, Fraunces, Inter, Playfair_Display } from "next/font/google";

import { Suspense } from "react";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ToastProvider from "@/components/shared/toast/ToastProvider";

const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const fontMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const agrivaultDisplay = Playfair_Display({
  variable: "--font-av-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const agrivaultBody = DM_Sans({
  variable: "--font-av-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const agrivaultMono = DM_Mono({
  variable: "--font-av-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const FALLBACK_METADATA_BASE = "https://agritrace.app";

/** Picks absolute origin for Open Graph and canonical resolution; never throws. */
function resolveMetadataBase(): URL {
  const tryFromString = (raw: string | undefined, addHttpsIfMissing: boolean) => {
    if (raw === undefined) return null;
    const t = raw.trim();
    if (!t) return null;
    const noTrailing = t.replace(/\/+$/, "");
    const withScheme =
      /^https?:\/\//i.test(noTrailing) || !addHttpsIfMissing
        ? noTrailing
        : `https://${noTrailing.replace(/^\/+/, "")}`;
    try {
      return new URL(withScheme);
    } catch {
      return null;
    }
  };

  const fromApp = tryFromString(process.env.NEXT_PUBLIC_APP_URL, true);
  if (fromApp) return fromApp;

  const fromVercel = tryFromString(process.env.VERCEL_PROJECT_PRODUCTION_URL, true);
  if (fromVercel) return fromVercel;

  return new URL(FALLBACK_METADATA_BASE);
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: resolveMetadataBase(),
    title: {
      default: "Agrivault",
      template: "%s · Agrivault",
    },
    description: "Agricultural traceability platform for Liberia · rice visibility · cocoa chain of custody · compliance",
    applicationName: "Agrivault",
    keywords: [
      "Liberia",
      "agriculture",
      "traceability",
      "EUDR",
      "cocoa",
      "rice",
      "supply chain",
      "audit",
      "compliance",
    ],
    icons: {
      icon: [{ url: "/favicon.ico" }],
    },
    openGraph: {
      type: "website",
      title: "Agrivault",
      description:
        "Pilot-ready agricultural traceability for Liberia: production visibility, chain of custody, discrepancy resolution, compliance reporting.",
      siteName: "Agrivault",
      images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Agrivault — Liberia traceability" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Agrivault",
      description: "Agricultural traceability platform · Liberia",
      images: ["/og.svg"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} ${agrivaultDisplay.variable} ${agrivaultBody.variable} ${agrivaultMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Suspense fallback={children}>
          <AnalyticsProvider>
            <ToastProvider>{children}</ToastProvider>
          </AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
