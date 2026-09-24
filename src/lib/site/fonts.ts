import { Geist, Geist_Mono, Newsreader } from "next/font/google";

/** Approved AgriVault type system: Geist (sans), Newsreader (serif accent), Geist Mono (metadata). */
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const siteFontVariables = `${geist.variable} ${newsreader.variable} ${geistMono.variable}`;
