"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import MinistrySidebar from "@/components/layout/MinistrySidebar";
import Topbar from "@/components/layout/Topbar";
import { LAYOUT_CONTAINER_CLASS, isDarkCanvasRoute, resolveLayoutMode } from "@/lib/navigation/layout-mode";
// import DemoRail from "@/components/demo/DemoRail";
import PilotBanner from "@/components/shared/PilotBanner";
// import AiAssistant from "@/components/ai-assistant/AiAssistant";
import { resolveOperationalActor } from "@/lib/ops/current-actor";
import OperationalActorProvider from "@/lib/ops/operational-actor-context";
import { normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import type { Profile, UserRole } from "@/lib/supabase/types";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function primaryActionForPath(pathname: string): { label: string; href?: string; event?: boolean } | null {
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
  if (pathname.startsWith("/reports/pdf")) return { label: "Open PDF export", href: "/rice/reports" };
  if (pathname.startsWith("/admin/import")) return { label: "Import data", href: "/admin/import" };
  if (pathname.startsWith("/district-dashboard")) return { label: "CLAN / DAO capture", href: "/workspace/clan" };
  if (pathname.startsWith("/county-dashboard")) return { label: "CAC county briefing", href: "/executive-briefing" };
  if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations"))
    return { label: "Executive view", href: "/executive-briefing" };
  return null;
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
        <div className="min-h-screen enterprise-canvas flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 px-6 py-5 text-center">
            <p className="text-[15px] font-semibold text-rose-900">Workspace failed to load</p>
            <p className="mt-2 text-[13px] text-rose-800">Reload the page to restore your session. If the problem persists, contact ministry support.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-forest-800 px-4 text-[13px] font-semibold text-white hover:bg-forest-700"
            >
              Reload workspace
            </button>
          </div>
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

  const safeEffectiveRole = React.useMemo(
    () => normalizeMinistryNavRole(profile?.role),
    [profile?.role],
  );
  const safeAuthenticRole = React.useMemo(
    () => normalizeMinistryNavRole(authenticRole ?? profile?.role),
    [authenticRole, profile?.role],
  );

  const operationalActor = React.useMemo(() => {
    if (!profile?.id) return null;
    return resolveOperationalActor({
      id: profile.id,
      full_name: profile.full_name,
      role: safeEffectiveRole,
      county: profile.county,
    });
  }, [profile?.id, profile?.full_name, profile?.county, safeEffectiveRole]);

  const user = React.useMemo(
    () => ({
      name: profile?.full_name?.trim() || "User",
      role: safeEffectiveRole,
      initials: initialsFromName(profile?.full_name || "User"),
    }),
    [profile?.full_name, safeEffectiveRole],
  );

  const [mobileNav, setMobileNav] = React.useState(false);
  const mobileNavRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mobileNav) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = mobileNavRef.current;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(selector) ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNav(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [mobileNav]);

  // Centralized page layout modes (command | table | admin | map).
  const layoutMode = React.useMemo(() => resolveLayoutMode(pathname), [pathname]);
  // Map-first/geospatial routes stay dark; everything else uses the light canvas.
  const darkCanvas = React.useMemo(() => isDarkCanvasRoute(pathname), [pathname]);

  const exportHref = "/api/reports/executive-briefing";

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
  const actorShell = (node: React.ReactNode) =>
    operationalActor ? (
      <OperationalActorProvider actor={operationalActor}>{node}</OperationalActorProvider>
    ) : (
      node
    );

  if (presentation) {
    return (
      <DashboardShellFatalBoundary>
        {actorShell(
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
            <main id="main-content" className="min-h-screen p-4 md:p-8">{children}</main>
          </div>,
        )}
      </DashboardShellFatalBoundary>
    );
  }

  if (printView) {
    return (
      <DashboardShellFatalBoundary>
        {actorShell(
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
            <main id="main-content" className="briefing-print-root min-h-screen p-4 md:p-10">{children}</main>
          </div>,
        )}
      </DashboardShellFatalBoundary>
    );
  }

  return (
    <DashboardShellFatalBoundary>
      {actorShell(
        <div className="gov-canvas overflow-x-hidden h-[100dvh]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-xl"
        >
          Skip to main content
        </a>
        <div className="grid grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)] h-full overflow-hidden">
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
              primaryAction={
                primary
                  ? {
                      label: primary.label,
                      onClick: () => {
                        if (primary.href) {
                          router.push(primary.href);
                          return;
                        }
                        if (primary.event && typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("agritrace-primary-action"));
                        }
                      },
                    }
                  : null
              }
              onExportPdf={() => {
                if (typeof window !== "undefined") window.open(exportHref, "_blank", "noopener,noreferrer");
              }}
            />
            {mobileNav ? (
              <div
                ref={mobileNavRef}
                role="dialog"
                aria-modal="true"
                aria-label="Ministry navigation"
                className="fixed inset-0 z-[70] lg:hidden"
              >
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="absolute inset-0 bg-black/55"
                  onClick={() => setMobileNav(false)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-[min(264px,92vw)] shadow-2xl border-r border-[rgb(var(--ministry-border))]/10 bg-[rgb(var(--ministry-sidebar))]">
                  <button
                    type="button"
                    onClick={() => setMobileNav(false)}
                    className="absolute right-2 top-2 z-10 inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    Close
                  </button>
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
            {layoutMode === "map" ? (
              <main id="main-content" className="flex-1 min-w-0 overflow-hidden">{children}</main>
            ) : layoutMode === "admin" ? (
              <main id="main-content" className="flex-1 min-w-0 overflow-y-auto overscroll-contain bg-slate-50 text-slate-900">
                <PilotBanner />
                <div className={LAYOUT_CONTAINER_CLASS.admin}>{children}</div>
              </main>
            ) : (
              <main
                id="main-content"
                className={`flex-1 min-w-0 overflow-y-auto overscroll-contain ${
                  darkCanvas ? "" : "gov-canvas text-slate-900"
                }`}
              >
                <PilotBanner />
                <div className={LAYOUT_CONTAINER_CLASS[layoutMode === "table" ? "table" : "command"]}>{children}</div>
              </main>
            )}
          </div>
        </div>

        {/* {showDemoRail ? <DemoRail /> : null} */}
        {/* <AiAssistant profileId={profile.id} role={safeEffectiveRole} pathname={pathname} /> */}
        </div>,
      )}
    </DashboardShellFatalBoundary>
  );
}
