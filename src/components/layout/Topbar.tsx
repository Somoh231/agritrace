"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { ClientErrorBoundary } from "@/components/layout/ClientErrorBoundary";
import NotificationsMenu from "@/components/layout/NotificationsMenu";
import UserWorkspaceMenu from "@/components/layout/UserWorkspaceMenu";
import WorkspaceRoleSwitcher from "@/components/layout/WorkspaceRoleSwitcher";
import InstallAppButton from "@/components/pwa/InstallAppButton";
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
  const { kicker, title } = React.useMemo(() => {
    try {
      return ministryBreadcrumb(pathname);
    } catch (e) {
      console.error("[dashboard] topbar breadcrumb resolution failed", e);
      return { kicker: "AIS", title: "Workspace" };
    }
  }, [pathname]);
  const [q, setQ] = React.useState("");

  const county = profile?.county ?? null;
  const district = profile?.district ?? null;
  const scopeLabel = county || district ? [county, district].filter(Boolean).join(" · ") : null;

  return (
    <header className="min-h-[56px] px-4 md:px-6 py-2 border-b border-[rgb(var(--ministry-gold))]/15 bg-[rgb(var(--ministry-workspace))]/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden h-9 w-9 rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-panel))]/60 text-emerald-50 inline-flex items-center justify-center shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <div className="text-[12px] min-w-0 border-l-2 border-[rgb(var(--ministry-gold))]/60 pl-3">
          <div className="cmd-kicker truncate">{kicker}</div>
          <div className="mt-1 font-serif-display text-[15px] leading-none text-white truncate">{title}</div>
          {scopeLabel ? (
            <div className="font-mono text-[9px] text-emerald-200/55 truncate mt-1">Jurisdiction · {scopeLabel}</div>
          ) : null}
        </div>
        <div className="hidden lg:flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/[0.08] px-3 py-1.5 shrink-0">
          <SyncStatusIndicator />
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
            className="h-9 w-[240px] lg:w-[280px] rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-panel))]/50 px-3 text-[12px] text-emerald-50 placeholder:text-emerald-200/40 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
            aria-label="Global search"
          />
        </form>
        <div className="hidden xl:flex items-center">
          <ClientErrorBoundary
            name="workspace-preview"
            fallback={
              <div className="font-mono text-[9px] text-amber-200/80 max-w-[220px]">
                Workspace preview unavailable — continue with signed-in scope.
              </div>
            }
          >
            <WorkspaceRoleSwitcher effectiveRole={effectiveRole} authenticRole={authenticRole} />
          </ClientErrorBoundary>
        </div>
        <div className="sm:hidden flex items-center pr-1">
          <SyncStatusIndicator />
        </div>
        <NotificationsMenu />

        <details className="relative group">
          <summary className="list-none h-9 w-9 rounded-lg border border-[rgb(var(--ministry-panel-border))]/70 bg-[rgb(var(--ministry-panel))]/50 text-emerald-50/90 inline-flex items-center justify-center cursor-pointer hover:border-[rgb(var(--ministry-gold))]/40 [&::-webkit-details-marker]:hidden">
            <span className="text-[16px] leading-none">⋯</span>
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[rgb(var(--ministry-gold))]/15 bg-[rgb(var(--ministry-panel))] p-1.5 shadow-2xl">
            <div className="px-2 py-1.5">
              <InstallAppButton variant="toolbar" label="Install App" className="w-full justify-center" />
            </div>
            <div className="my-1 h-px bg-[rgb(var(--ministry-panel-border))]/50" />
            <ToolItem
              label="Print view"
              onClick={() => {
                if (typeof window === "undefined") return;
                const next = new URL(window.location.href);
                const sp = nextUrlWithParam(next.searchParams, "print", "1");
                router.push(next.pathname + "?" + sp.toString());
              }}
            />
            <ToolItem label="Export PDF" onClick={onExportPdf} />
            <ToolItem
              label={`Action · ${primaryAction.label}`}
              onClick={primaryAction.onClick}
            />
          </div>
        </details>

        <button
          type="button"
          onClick={onExportPdf}
          className="hidden md:inline-flex btn-gov-outline h-9 px-3 rounded-lg text-[12px]"
        >
          Export PDF
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window === "undefined") return;
            const next = new URL(window.location.href);
            const sp = nextUrlWithParam(next.searchParams, "present", "1");
            router.push(next.pathname + "?" + sp.toString());
          }}
          className="btn-gold h-9 px-3.5 rounded-lg text-[12px]"
        >
          Briefing mode
        </button>

        <UserWorkspaceMenu
          name={profile?.full_name?.trim() || "User"}
          role={effectiveRole}
          initials={initialsFromName(profile?.full_name || "User")}
        />
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="hidden sm:inline-flex btn-emerald h-9 px-3.5 rounded-lg text-[12px]"
        >
          {primaryAction.label}
        </button>
      </div>
      <div className="w-full xl:hidden border-t border-[rgb(var(--ministry-panel-border))]/40 pt-2 pb-1">
        <ClientErrorBoundary
          name="workspace-preview-mobile"
          fallback={
            <div className="font-mono text-[9px] text-amber-200/80 px-1">
              Workspace preview unavailable.
            </div>
          }
        >
          <WorkspaceRoleSwitcher effectiveRole={effectiveRole} authenticRole={authenticRole} />
        </ClientErrorBoundary>
      </div>
    </header>
  );
}

function ToolItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg px-2.5 py-2 text-[12px] text-emerald-50/90 hover:bg-[rgb(var(--ministry-gold))]/[0.12]"
    >
      {label}
    </button>
  );
}
