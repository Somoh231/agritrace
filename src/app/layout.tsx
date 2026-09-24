import type { Metadata } from "next";
import "./globals.css";
import { DM_Mono, DM_Serif_Display, Fraunces, Inter, Inter_Tight } from "next/font/google";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ToastProvider from "@/components/shared/toast/ToastProvider";
import { PwaInstallProvider } from "@/components/pwa/install-prompt-context";
import PwaDiagnosticsPanel from "@/components/pwa/PwaDiagnosticsPanel";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";

const fontHeading = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  preload: false,
  weight: ["400", "500", "600", "700"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  preload: false,
  weight: ["300", "400", "500", "600"],
});

const fontMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  preload: false,
  weight: ["400", "500"],
});

const fontSerif = DM_Serif_Display({
  variable: "--font-serif-display",
  subsets: ["latin"],
  preload: false,
  weight: ["400"],
  style: ["normal", "italic"],
});

const fontEditorial = Fraunces({
  variable: "--font-editorial",
  subsets: ["latin"],
  preload: false,
  weight: ["400", "500", "600", "700"],
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
