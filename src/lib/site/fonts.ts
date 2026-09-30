import localFont from "next/font/local";

/*
 * Approved AgriVault type system: Geist (sans, UI and body), Newsreader (H1/H2),
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
 * Static 400 roman only: Newsreader sets H1/H2. The italic accent-word pattern
 * is retired, so the italic file is no longer loaded (it stays in src/fonts).
 * The variable opsz build was ~273 kB; payload matters on rural 3G.
 */
export const newsreader = localFont({
  src: [{ path: "../../fonts/newsreader/newsreader-latin-400-normal.woff2", weight: "400", style: "normal" }],
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
