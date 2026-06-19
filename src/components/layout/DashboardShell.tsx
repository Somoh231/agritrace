"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import MinistrySidebar from "@/components/layout/MinistrySidebar";
import OperationsRail from "@/components/layout/OperationsRail";
import Topbar from "@/components/layout/Topbar";
// import DemoRail from "@/components/demo/DemoRail";
import PilotBanner from "@/components/shared/PilotBanner";
// import AiAssistant from "@/components/ai-assistant/AiAssistant";
import { resolveOperationalActor } from "@/lib/ops/current-actor";
import { normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
// import OperationalActorProvider from "@/lib/ops/operational-actor-context";
import type { Profile, UserRole } from "@/lib/supabase/types";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function primaryActionForPath(pathname: string): { label: string; href?: string; event?: boolean } {
  if (pathname.startsWith("/farmers")) return { label: "Register farmer", event: true };
  if (pathname.startsWith("/cooperatives")) return { label: "Add cooperative", event: true };
  if (pathname.startsWith("/operations/warehouses")) return { label: "Create warehouse", event: true };
  if (pathname.startsWith("/inventory") && pathname.includes("donor")) return { label: "Donor shipment", event: true };
  if (pathname.startsWith("/inventory/transfers")) return { label: "Transfer stock", event: true };
  if (pathname.startsWith("/transfers")) return { label: "National transfer trace", href: "/transfers" };
  if (pathname.startsWith("/field/inspections")) return { label: "Record inspection", event: true };
  if (pathname.startsWith("/field/pest-reports")) return { label: "Pest / disease report", event: true };
  if (pathname.startsWith("/subsidies/verification")) return { label: "Verify beneficiary", event: true };
  if (pathname.startsWith("/production/rice")) return { label: "Record production", href: "/rice/production" };
  if (pathname.startsWith("/compliance/audit-log")) return { label: "Refresh log", event: true };
  if (pathname.startsWith("/reports/pdf")) return { label: "Open PDF export", href: "/rice/reports" };
  if (pathname.startsWith("/admin/import")) return { label: "Import data", href: "/admin/import" };
  if (pathname.startsWith("/district-dashboard")) return { label: "CLAN / DAO capture", event: true };
  if (pathname.startsWith("/county-dashboard")) return { label: "CAC county briefing", href: "/executive-briefing" };
  if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations"))
    return { label: "Executive view", href: "/executive-briefing" };
  return { label: "Workspace actions", event: true };
}

/** Outermost fallback if the dashboard shell tree throws during render/update. */
class DashboardShellFatalBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[dashboard] shell initialization failed", error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-10">
          Dashboard loaded
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardShell({
  profile,
  authenticRole,
  children,
}: {
  profile: Profile | null;
  /** Database-backed role before workspace preview cookie — may be undefined if profile incomplete */
  authenticRole: UserRole | null | undefined;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/command-center";
  const search = useSearchParams();
  const presentation = search.get("present") === "1";
  const printView = search.get("print") === "1";
  const showDemoRail = process.env.NEXT_PUBLIC_SHOW_DEMO_RAIL === "true";
  void showDemoRail;

  React.useEffect(() => {
    console.error("[dashboard] AI initialization skipped (crash isolation — AiAssistant commented out)");
  }, []);

  React.useEffect(() => {
    try {
      if (!profile) {
        console.error("[dashboard] role resolution skipped — no profile");
        return;
      }
      if (profile.role == null || profile.role === undefined) {
        console.error("[dashboard] role resolution — profile.role missing, applying ministry fallback");
      }
      try {
        const actor = resolveOperationalActor({
          id: profile.id,
          full_name: profile.full_name,
          role: normalizeMinistryNavRole(profile.role),
          county: profile.county,
        });
        console.error("[dashboard] actor resolution (OperationalActorProvider removed; preview only)", {
          persona: actor.role,
          county: actor.county,
        });
      } catch (e) {
        console.error("[dashboard] actor resolution failed", e);
      }
    } catch (e) {
      console.error("[dashboard] role resolution failed", e);
    }
  }, [profile, authenticRole]);

  const safeEffectiveRole = React.useMemo(
    () => normalizeMinistryNavRole(profile?.role),
    [profile?.role],
  );
  const safeAuthenticRole = React.useMemo(
    () => normalizeMinistryNavRole(authenticRole ?? profile?.role),
    [authenticRole, profile?.role],
  );

  const user = React.useMemo(
    () => ({
      name: profile?.full_name?.trim() || "User",
      role: safeEffectiveRole,
      initials: initialsFromName(profile?.full_name || "User"),
    }),
    [profile?.full_name, safeEffectiveRole],
  );

  const [mobileNav, setMobileNav] = React.useState(false);
  const [opsOpen, setOpsOpen] = React.useState(false);
  const [opsCollapsed, setOpsCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setOpsCollapsed(window.localStorage.getItem("av_ops_rail_collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleOpsCollapsed = React.useCallback(() => {
    setOpsCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("av_ops_rail_collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const exportHref = React.useMemo(() => {
    const county = profile?.county?.trim() ?? "";
    const base = "/api/reports/briefing-snapshot";
    if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations")) return `${base}?scope=command-center`;
    if (pathname.startsWith("/county-dashboard")) return `${base}?scope=county-dashboard&county=${encodeURIComponent(county)}`;
    if (pathname.startsWith("/food-security")) return `${base}?scope=food-security`;
    if (pathname.startsWith("/reports")) return `${base}?scope=reports`;
    return "/api/reports/executive-briefing";
  }, [pathname, profile?.county]);

  if (!profile?.id) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center text-[13px]">
          <p className="font-medium text-white">Loading workspace…</p>
          <p className="mt-2 text-slate-500">Awaiting operator profile from ministry directory.</p>
        </div>
      </div>
    );
  }

  const primary = primaryActionForPath(pathname);

  if (presentation) {
    return (
      <DashboardShellFatalBoundary>
        <div className="min-h-screen bg-[rgb(var(--ministry-workspace))]">
          <div className="fixed right-4 top-4 z-50 hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = new URL(window.location.href);
                next.searchParams.delete("present");
                router.push(next.pathname + next.search);
              }}
              className="h-9 px-3 rounded-md border border-slate-600 bg-slate-900 text-[12px] text-slate-200 hover:bg-slate-800 shadow-sm"
            >
              Exit presentation
            </button>
          </div>
          <main className="min-h-screen p-4 md:p-8">{children}</main>
          {/* {showDemoRail ? <DemoRail /> : null} */}
        </div>
      </DashboardShellFatalBoundary>
    );
  }

  if (printView) {
    return (
      <DashboardShellFatalBoundary>
        <div className="min-h-screen bg-white">
          <div className="fixed right-4 top-4 z-50 hidden print:hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = new URL(window.location.href);
                next.searchParams.delete("print");
                router.push(next.pathname + next.search);
              }}
              className="h-9 px-3 rounded-md border border-slate-300 bg-white text-[12px] text-slate-800 hover:bg-slate-50 shadow-sm"
            >
              Exit print view
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-3 rounded-md border border-slate-300 bg-white text-[12px] text-slate-800 hover:bg-slate-50 shadow-sm"
            >
              Print
            </button>
            <a
              href={exportHref}
              className="h-9 px-3 rounded-md border border-slate-300 bg-white text-[12px] text-slate-800 hover:bg-slate-50 shadow-sm inline-flex items-center"
            >
              Export PDF
            </a>
          </div>
          <main className="briefing-print-root min-h-screen p-4 md:p-10">{children}</main>
        </div>
      </DashboardShellFatalBoundary>
    );
  }

  return (
    <DashboardShellFatalBoundary>
      <div className="bg-[rgb(var(--ministry-workspace))] overflow-x-hidden h-[100dvh]">
        <div
          className={`grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] h-full overflow-hidden ${
            opsCollapsed
              ? "xl:grid-cols-[280px_minmax(0,1fr)_48px]"
              : "xl:grid-cols-[280px_minmax(0,1fr)_340px]"
          }`}
        >
          <div className="hidden md:block h-full border-r border-[rgb(var(--ministry-gold))]/10 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain">
              <MinistrySidebar pathname={pathname} onNavigate={(href) => router.push(href)} user={user} />
            </div>
          </div>

          <div className="min-w-0 flex flex-col h-full overflow-hidden">
            <Topbar
              pathname={pathname}
              profile={profile}
              authenticRole={safeAuthenticRole}
              effectiveRole={safeEffectiveRole}
              onOpenMobileNav={() => setMobileNav(true)}
              onOpenOps={() => setOpsOpen(true)}
              primaryAction={{
                label: primary.label,
                onClick: () => {
                  if (primary.href) {
                    router.push(primary.href);
                    return;
                  }
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("agritrace-primary-action"));
                  }
                },
              }}
              onExportPdf={() => {
                if (typeof window !== "undefined") window.open(exportHref, "_blank", "noopener,noreferrer");
              }}
            />
            {mobileNav ? (
              <div className="fixed inset-0 z-[70] lg:hidden">
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="absolute inset-0 bg-black/55"
                  onClick={() => setMobileNav(false)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-[min(280px,92vw)] shadow-2xl border-r border-[rgb(var(--ministry-border))]/10 bg-[rgb(var(--ministry-sidebar))]">
                  <MinistrySidebar
                    pathname={pathname}
                    onNavigate={(href) => {
                      setMobileNav(false);
                      router.push(href);
                    }}
                    user={user}
                  />
                </div>
              </div>
            ) : null}
            <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain">
              <PilotBanner />
              <div className="w-full max-w-none min-w-0 px-4 py-4 md:px-6 md:py-5 xl:px-7">{children}</div>
            </main>
          </div>

          {/* Operations rail (third column, xl+) */}
          <aside className="hidden xl:block h-full border-l border-[rgb(var(--ministry-gold))]/10 bg-[rgb(var(--ministry-panel))]/25 overflow-hidden">
            {opsCollapsed ? (
              <button
                type="button"
                onClick={toggleOpsCollapsed}
                aria-label="Expand operations panel"
                className="flex h-full w-full flex-col items-center gap-3 py-4 text-slate-300 hover:bg-white/[0.04]"
              >
                <PanelLeftOpenIcon />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
                  Operations
                </span>
              </button>
            ) : (
              <div className="h-full overflow-hidden">
                <OperationsRail
                  role={safeEffectiveRole}
                  pathname={pathname}
                  variant="desktop"
                  onCollapse={toggleOpsCollapsed}
                />
              </div>
            )}
          </aside>
        </div>

        {/* Operations rail — mobile / tablet drawer (below xl) */}
        {opsOpen ? (
          <div className="fixed inset-0 z-[70] xl:hidden">
            <button
              type="button"
              aria-label="Close operations panel"
              className="absolute inset-0 bg-black/55"
              onClick={() => setOpsOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-[min(340px,92vw)] border-l border-white/10 bg-[rgb(var(--ministry-workspace))] shadow-2xl">
              <OperationsRail
                role={safeEffectiveRole}
                pathname={pathname}
                variant="drawer"
                onClose={() => setOpsOpen(false)}
                onNavigate={() => setOpsOpen(false)}
              />
            </div>
          </div>
        ) : null}

        {/* {showDemoRail ? <DemoRail /> : null} */}
        {/* <AiAssistant profileId={profile.id} role={safeEffectiveRole} pathname={pathname} /> */}
      </div>
    </DashboardShellFatalBoundary>
  );
}

function PanelLeftOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
      <path d="m8 9 3 3-3 3" />
    </svg>
  );
}
