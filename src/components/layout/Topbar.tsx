"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import NotificationsMenu from "@/components/layout/NotificationsMenu";
import UserWorkspaceMenu from "@/components/layout/UserWorkspaceMenu";
import WorkspaceRoleSwitcher from "@/components/layout/WorkspaceRoleSwitcher";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { ministryBreadcrumb } from "@/lib/navigation/ministry-nav";
import type { Profile, UserRole } from "@/lib/supabase/types";

function nextUrlWithParam(params: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(params.toString());
  if (value == null) next.delete(key);
  else next.set(key, value);
  return next;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export default function Topbar({
  pathname,
  profile,
  authenticRole,
  effectiveRole,
  primaryAction,
  onExportPdf,
  onOpenMobileNav,
}: {
  pathname: string;
  profile: Profile;
  authenticRole: UserRole;
  effectiveRole: UserRole;
  primaryAction: { label: string; onClick: () => void };
  onExportPdf: () => void;
  onOpenMobileNav?: () => void;
}) {
  const router = useRouter();
  const { kicker, title } = ministryBreadcrumb(pathname);
  const [q, setQ] = React.useState("");

  const scopeLabel =
    profile.county || profile.district
      ? [profile.county, profile.district].filter(Boolean).join(" · ")
      : null;

  return (
    <header className="min-h-[56px] px-4 md:px-6 py-2 border-b border-slate-700/90 bg-slate-950/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden h-9 w-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 inline-flex items-center justify-center shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <div className="text-[12px] min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-500/90 truncate">{kicker}</div>
          <div className="font-semibold text-slate-100 truncate">{title}</div>
          {scopeLabel ? (
            <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5">Jurisdiction · {scopeLabel}</div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-end">
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
        <div className="hidden xl:flex items-center">
          <WorkspaceRoleSwitcher effectiveRole={effectiveRole} authenticRole={authenticRole} />
        </div>
        <SyncStatusIndicator />
        <NotificationsMenu />
        <UserWorkspaceMenu
          name={profile.full_name || "User"}
          role={effectiveRole}
          initials={initialsFromName(profile.full_name || "User")}
        />
        <button
          type="button"
          onClick={() => {
            const next = new URL(window.location.href);
            const sp = nextUrlWithParam(next.searchParams, "present", "1");
            router.push(next.pathname + "?" + sp.toString());
          }}
          className="hidden lg:inline-flex h-9 px-3 rounded-lg border border-slate-700 bg-slate-900 text-[12px] text-slate-200 hover:bg-slate-800"
        >
          Briefing mode
        </button>
        <button
          type="button"
          onClick={() => {
            const next = new URL(window.location.href);
            const sp = nextUrlWithParam(next.searchParams, "print", "1");
            router.push(next.pathname + "?" + sp.toString());
          }}
          className="hidden lg:inline-flex h-9 px-3 rounded-lg border border-slate-700 bg-slate-900 text-[12px] text-slate-200 hover:bg-slate-800"
        >
          Print view
        </button>
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
      <div className="w-full xl:hidden border-t border-slate-800/80 pt-2 pb-1">
        <WorkspaceRoleSwitcher effectiveRole={effectiveRole} authenticRole={authenticRole} />
      </div>
    </header>
  );
}
