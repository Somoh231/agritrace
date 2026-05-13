"use client";

import * as React from "react";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  /** Dark navbar (public site) vs light marketing body */
  variant?: "light" | "dark";
};

export default function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const [current, setCurrent] = React.useState<SupportedLocale>(DEFAULT_LOCALE);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const value = params.get("lang");
    if (value && SUPPORTED_LOCALES.includes(value as SupportedLocale)) {
      setCurrent(value as SupportedLocale);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value as SupportedLocale;
    setCurrent(locale);
    if (typeof window === "undefined") return;
    const next = new URLSearchParams(window.location.search);
    if (locale === DEFAULT_LOCALE) next.delete("lang");
    else next.set("lang", locale);
    const qs = next.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.location.assign(nextUrl);
  };

  const isDark = variant === "dark";

  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
      <span className={isDark ? "text-slate-500" : "text-slate-600"}>Lang</span>
      <select
        value={current}
        onChange={onChange}
        className={
          isDark
            ? "rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            : "rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        }
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

