"use client";

import Link from "next/link";
import * as React from "react";

import LanguageSwitcher from "@/components/agrivault/site/LanguageSwitcher";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { track } from "@/lib/analytics/client";

const NAV_LINKS = [
  { href: "/government", label: "Government Partnership" },
  { href: "/platform", label: "Platform" },
  { href: "/governance", label: "Security" },
  { href: "/offline", label: "Offline Operations" },
] as const;

function LogoMark() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 2C8 2 5 6 5 10c0 4 3 7 7 9 4-2 7-5 7-9 0-4-3-8-7-8z" />
        <path d="M12 2v18M8 8c1.5 1 2.5 2.5 4 4 1.5-1.5 2.5-3 4-4" />
      </svg>
    </span>
  );
}

export default function PublicNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const trackCta = (label: string) => track("cta_click", { label, placement: "public_nav" });

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-slate-950/95 text-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline" onClick={() => setMobileOpen(false)}>
          <LogoMark />
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-white">Agrivault Data</span>
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:block">
              National agricultural intelligence
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-[13px] font-normal text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <InstallAppButton variant="compact" label="Install App" />
          <LanguageSwitcher variant="dark" />
          <Link
            href="/request-demo"
            className="inline-flex h-9 items-center rounded-md bg-emerald-700 px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-emerald-600"
            onClick={() => trackCta("request_demo")}
          >
            Request Demo
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-md border border-white/15 bg-white/5 px-3.5 text-[13px] font-medium text-slate-200 transition hover:bg-white/10"
            onClick={() => trackCta("sign_in")}
          >
            Sign In
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <InstallAppButton variant="compact" label="Install" className="min-w-[4.5rem]" />
          <LanguageSwitcher variant="dark" />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-200"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="public-mobile-nav"
          className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-[14px] text-slate-300 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <InstallAppButton variant="compact" label="Install App" className="w-full justify-center" />
            <Link
              href="/request-demo"
              className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 text-[14px] font-medium text-white"
              onClick={() => {
                trackCta("request_demo");
                setMobileOpen(false);
              }}
            >
              Request Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 text-[14px] font-medium text-slate-200"
              onClick={() => {
                trackCta("sign_in");
                setMobileOpen(false);
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
