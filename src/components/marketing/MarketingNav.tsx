import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-forest-800 grid place-items-center shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
            stroke="#D5F0DA"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 17c2-3 6-7 10-9"
            stroke="#D5F0DA"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="font-display text-[16px] text-ink-900 leading-tight">Agrivault</div>
        <div className="font-mono text-[10px] text-slate-400">Liberia · Traceability</div>
      </div>
    </div>
  );
}

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-gray-100">
      <div className="h-[3px] w-full bg-[var(--color-red-600)]" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-600">
            <Link href="/rice" className="text-ink-900 hover:text-ink-900">
              Rice
            </Link>
            <Link href="/rice" className="hover:text-ink-900">
              Farm Documents
            </Link>
            <Link href="/cocoa/eudr" className="hover:text-ink-900">
              Compliance
            </Link>
            <Link href="/admin/organizations" className="hover:text-ink-900">
              Customers
            </Link>
            <Link href="/request-demo" className="hover:text-ink-900">
              Pricing
            </Link>
            <Link href="/setup" className="hover:text-ink-900">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="av-btn-ghost h-9 px-3 text-[12px]">
            Sign in
          </Link>
          <Link href="/request-demo" className="hidden sm:inline-flex av-btn-navy h-9 px-3 text-[12px]">
            Contact sales
          </Link>
          <Link href="/request-demo" className="av-btn-red h-9 px-3 text-[12px]">
            Request demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

