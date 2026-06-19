import type { Metadata } from "next";
import "./globals.css";
import "@/styles/public-marketing.css";
import { DM_Mono, DM_Serif_Display, Inter, Inter_Tight } from "next/font/google";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ToastProvider from "@/components/shared/toast/ToastProvider";
import { PwaInstallProvider } from "@/components/pwa/install-prompt-context";
import PwaDiagnosticsPanel from "@/components/pwa/PwaDiagnosticsPanel";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";

const fontHeading = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

const fontSerif = DM_Serif_Display({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const agrivaultDisplay = Inter_Tight({
  variable: "--font-av-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const agrivaultBody = Inter({
  variable: "--font-av-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} ${fontSerif.variable} ${agrivaultDisplay.variable} ${agrivaultBody.variable} ${agrivaultMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[rgb(var(--surface))] text-[rgb(var(--text))]">
        <AnalyticsProvider>
          <ToastProvider>
            <PwaInstallProvider>
              <PwaRegistrar />
              {children}
              <PwaDiagnosticsPanel />
            </PwaInstallProvider>
          </ToastProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
