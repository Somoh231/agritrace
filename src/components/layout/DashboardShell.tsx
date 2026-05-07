"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import MinistrySidebar from "@/components/layout/MinistrySidebar";
import Topbar from "@/components/layout/Topbar";
import DemoRail from "@/components/demo/DemoRail";
import PilotBanner from "@/components/shared/PilotBanner";
import AiAssistant from "@/components/ai-assistant/AiAssistant";
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
  if (pathname.startsWith("/field/inspections")) return { label: "Record inspection", event: true };
  if (pathname.startsWith("/field/pest-reports")) return { label: "Pest / disease report", event: true };
  if (pathname.startsWith("/subsidies/verification")) return { label: "Verify beneficiary", event: true };
  if (pathname.startsWith("/production/rice")) return { label: "Record production", href: "/rice/production" };
  if (pathname.startsWith("/compliance/audit-log")) return { label: "Refresh log", event: true };
  if (pathname.startsWith("/reports/pdf")) return { label: "Open PDF export", href: "/rice/reports" };
  if (pathname.startsWith("/admin/import")) return { label: "Import data", href: "/admin/import" };
  if (pathname.startsWith("/district-dashboard"))
    return { label: "DAO capture", event: true };
  if (pathname.startsWith("/county-dashboard")) return { label: "County briefing", href: "/executive-briefing" };
  if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations"))
    return { label: "Executive view", href: "/executive-briefing" };
  return { label: "Workspace actions", event: true };
}

export default function DashboardShell({
  profile,
  authenticRole,
  children,
}: {
  profile: Profile;
  /** Database-backed role before workspace preview cookie */
  authenticRole: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/command-center";
  const search = useSearchParams();
  const presentation = search.get("present") === "1";
  const printView = search.get("print") === "1";
  const showDemoRail = process.env.NEXT_PUBLIC_SHOW_DEMO_RAIL === "true";

  const user = React.useMemo(
    () => ({
      name: profile.full_name || "User",
      role: profile.role,
      initials: initialsFromName(profile.full_name || "User"),
    }),
    [profile.full_name, profile.role],
  );

  const primary = primaryActionForPath(pathname);
  const [mobileNav, setMobileNav] = React.useState(false);

  const exportHref = React.useMemo(() => {
    const base = "/api/reports/briefing-snapshot";
    if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations")) return `${base}?scope=command-center`;
    if (pathname.startsWith("/county-dashboard"))
      return `${base}?scope=county-dashboard&county=${encodeURIComponent(profile.county ?? "")}`;
    if (pathname.startsWith("/food-security")) return `${base}?scope=food-security`;
    if (pathname.startsWith("/reports")) return `${base}?scope=reports`;
    return "/api/reports/executive-briefing";
  }, [pathname, profile.county]);

  if (presentation) {
    return (
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
        {showDemoRail ? <DemoRail /> : null}
      </div>
    );
  }

  if (printView) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] bg-[rgb(var(--ministry-workspace))]">
      <div className="hidden md:block min-h-screen border-r border-white/[0.06]">
        <MinistrySidebar pathname={pathname} onNavigate={(href) => router.push(href)} user={user} />
      </div>

      <div className="min-w-0 flex flex-col min-h-screen">
        <Topbar
          pathname={pathname}
          profile={profile}
          authenticRole={authenticRole}
          effectiveRole={profile.role}
          onOpenMobileNav={() => setMobileNav(true)}
          primaryAction={{
            label: primary.label,
            onClick: () => {
              if (primary.href) {
                router.push(primary.href);
                return;
              }
              window.dispatchEvent(new CustomEvent("agritrace-primary-action"));
            },
          }}
          onExportPdf={() => window.open(exportHref, "_blank", "noopener,noreferrer")}
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
        <main className="flex-1 overflow-y-auto">
          <PilotBanner />
          <div className="w-full max-w-none px-5 py-6 md:px-8 md:py-8 xl:px-10">{children}</div>
        </main>
      </div>

      {showDemoRail ? <DemoRail /> : null}
      <AiAssistant profileId={profile.id} role={profile.role} pathname={pathname} />
    </div>
  );
}
