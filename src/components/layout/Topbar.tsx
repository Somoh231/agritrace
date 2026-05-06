"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import NotificationsMenu from "@/components/layout/NotificationsMenu";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { ministryBreadcrumb } from "@/lib/navigation/ministry-nav";

export default function Topbar({
  pathname,
  primaryAction,
  onExportPdf,
  onOpenMobileNav,
}: {
  pathname: string;
  primaryAction: { label: string; onClick: () => void };
  onExportPdf: () => void;
  onOpenMobileNav?: () => void;
}) {
  const router = useRouter();
  const { kicker, title } = ministryBreadcrumb(pathname);
  const [q, setQ] = React.useState("");

  return (
    <header className="min-h-[52px] px-4 md:px-6 py-2 border-b border-slate-700/90 bg-slate-950/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden h-9 w-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 inline-flex items-center justify-center"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <div className="text-[12px] min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-500/90 truncate">{kicker}</div>
          <div className="font-semibold text-slate-100 truncate">{title}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <form
          className="hidden md:block"
          onSubmit={(e) => {
            e.preventDefault();
            const value = q.trim();
            if (!value) return;
            router.push(`/search?q=${encodeURIComponent(value)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search registry, warehouses, reports…"
            className="h-9 w-[240px] lg:w-[280px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-[12px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-700"
            aria-label="Global search"
          />
        </form>
        <SyncStatusIndicator />
        <NotificationsMenu />
        <button
          type="button"
          onClick={onExportPdf}
          className="hidden sm:inline-flex h-9 px-3 rounded-lg border border-slate-700 bg-slate-900 text-[12px] text-slate-200 hover:bg-slate-800"
        >
          Export PDF
        </button>
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="h-9 px-3 rounded-lg bg-emerald-700 text-white text-[12px] font-medium hover:bg-emerald-600 shadow-sm"
        >
          {primaryAction.label}
        </button>
      </div>
    </header>
  );
}
