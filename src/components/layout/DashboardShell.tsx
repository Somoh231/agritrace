"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import MinistrySidebar from "@/components/layout/MinistrySidebar";
import Topbar from "@/components/layout/Topbar";
import DemoRail from "@/components/demo/DemoRail";
import PilotBanner from "@/components/shared/PilotBanner";
import type { Profile } from "@/lib/supabase/types";

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
  if (pathname.startsWith("/command-center") || pathname.startsWith("/national-operations"))
    return { label: "Executive view", href: "/executive-briefing" };
  return { label: "Workspace actions", event: true };
}

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/command-center";
  const search = useSearchParams();
  const presentation = search.get("present") === "1";
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[292px_1fr] bg-[rgb(var(--ministry-workspace))]">
      <div className="hidden lg:block min-h-screen">
        <MinistrySidebar pathname={pathname} onNavigate={(href) => router.push(href)} user={user} />
      </div>

      <div className="min-w-0 flex flex-col min-h-screen">
        <Topbar
          pathname={pathname}
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
          onExportPdf={() => router.push("/reports/pdf")}
        />
        {mobileNav ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/55"
              onClick={() => setMobileNav(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[min(292px,92vw)] shadow-2xl border-r border-[rgb(var(--ministry-border))]/10">
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
          <div className="px-4 py-5 md:px-7 md:py-7 max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>

      {showDemoRail ? <DemoRail /> : null}
    </div>
  );
}
