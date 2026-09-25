import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ToastProvider from "@/components/shared/toast/ToastProvider";
import { PwaInstallProvider } from "@/components/pwa/install-prompt-context";
import PwaDiagnosticsPanel from "@/components/pwa/PwaDiagnosticsPanel";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";

/*
 * Application fonts, self-hosted (src/fonts, SIL OFL; see src/fonts/README.md)
 * so builds make no request to Google Fonts. Latin subset only; not preloaded,
 * because public-site pages never render them.
 */
const fontHeading = localFont({
  src: "../fonts/inter-tight/inter-tight-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-display",
  preload: false,
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

const fontBody = localFont({
  src: "../fonts/inter/inter-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-body",
  preload: false,
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

const fontMono = localFont({
  src: [
    { path: "../fonts/dm-mono/dm-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dm-mono/dm-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  preload: false,
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
  adjustFontFallback: "Arial",
});

// Regular only: .font-serif-display is never set in italic.
const fontSerif = localFont({
  src: "../fonts/dm-serif-display/dm-serif-display-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-serif-display",
  preload: false,
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

/*
 * Fraunces: Google Fonts intermittently served it through extension-less URLs
 * that next/font cannot parse, failing builds. Only the weights the
 * application uses are shipped.
 */
const fontEditorial = localFont({
  variable: "--font-editorial",
  preload: false,
  display: "swap",
  src: [
    { path: "../fonts/fraunces/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fraunces/fraunces-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/fraunces/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
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

const SITE_DESCRIPTION =
  "AgriVault Data is an agricultural systems, technology and advisory company. We design and deploy the data systems, field operations and reporting infrastructure agricultural institutions run on.";

export function generateMetadata(): Metadata {
  return {
    metadataBase: resolveMetadataBase(),
    title: {
      default: "AgriVault Data — Agricultural systems, technology and advisory",
      template: "%s · AgriVault Data",
    },
    description: SITE_DESCRIPTION,
    applicationName: "AgriVault",
    keywords: [
      "agricultural systems",
      "agricultural technology",
      "programme implementation",
      "farmer registry",
      "GIS",
      "traceability",
      "government agriculture",
      "development partners",
    ],
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      title: "AgriVault Data",
      description: SITE_DESCRIPTION,
      siteName: "AgriVault Data",
      // Image: src/app/opengraph-image.tsx (file convention).
    },
    twitter: {
      card: "summary_large_image",
      title: "AgriVault Data",
      description: SITE_DESCRIPTION,
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
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} ${fontSerif.variable} ${fontEditorial.variable} h-full antialiased`}
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
