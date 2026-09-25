import localFont from "next/font/local";

/*
 * Approved AgriVault type system: Geist (sans), Newsreader (serif accent),
 * Geist Mono (metadata). Self-hosted Latin files (src/fonts, SIL OFL) so builds
 * make no request to Google Fonts; see src/fonts/README.md.
 */
export const geist = localFont({
  src: "../../fonts/geist/geist-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-geist",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

/*
 * Static 400 cuts only. The variable opsz build was ~273 kB for both styles;
 * the site uses a single weight, and payload matters on rural 3G.
 */
export const newsreader = localFont({
  src: [
    { path: "../../fonts/newsreader/newsreader-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/newsreader/newsreader-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const geistMono = localFont({
  src: "../../fonts/geist-mono/geist-mono-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
  adjustFontFallback: "Arial",
});

export const siteFontVariables = `${geist.variable} ${newsreader.variable} ${geistMono.variable}`;
