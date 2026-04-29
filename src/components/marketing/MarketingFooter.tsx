import * as React from "react";
import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-display text-[16px] text-ink-900">Agrivault</div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">
              Liberia · National data infrastructure
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-slate-600">
            <Link href="/request-demo" className="hover:text-ink-900">
              Request demo
            </Link>
            <Link href="/demo" className="hover:text-ink-900">
              Demo
            </Link>
            <Link href="/login" className="hover:text-ink-900">
              Login
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono">
            <span>Agrivault · Liberia</span>
            <span>SOC2 in progress</span>
            <span>ISO 19115</span>
            <span>Data residency: ECOWAS</span>
          </div>
          <div className="font-mono">© 2026</div>
        </div>
      </div>
    </footer>
  );
}

