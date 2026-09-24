import { Geist, Geist_Mono, Newsreader } from "next/font/google";

/** Approved AgriVault type system: Geist (sans), Newsreader (serif accent), Geist Mono (metadata). */
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/*
 * Static 400 cuts only. The variable opsz build was ~273 kB for both styles;
 * the site uses a single weight, and payload matters on rural 3G.
 */
export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const siteFontVariables = `${geist.variable} ${newsreader.variable} ${geistMono.variable}`;
