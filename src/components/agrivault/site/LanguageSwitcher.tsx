"use client";

import * as React from "react";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/config";

export default function LanguageSwitcher() {
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

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--ff-m)",
        fontSize: 11,
        color: "var(--muted)",
      }}
    >
      <span>Lang</span>
      <select
        value={current}
        onChange={onChange}
        style={{
          border: "1px solid var(--border-mid)",
          borderRadius: 6,
          padding: "4px 8px",
          background: "transparent",
          color: "var(--forest)",
          fontFamily: "var(--ff-m)",
          fontSize: 11,
        }}
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

