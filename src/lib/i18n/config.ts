export const SUPPORTED_LOCALES = ["en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export function normalizeLocale(input: string | null | undefined): SupportedLocale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  return SUPPORTED_LOCALES.includes(lower as SupportedLocale) ? (lower as SupportedLocale) : DEFAULT_LOCALE;
}

