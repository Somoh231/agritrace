"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import DemoRail from "@/components/demo/DemoRail";
import PilotBanner from "@/components/shared/PilotBanner";
import type { Profile } from "@/lib/supabase/types";

type Module = "rice" | "cocoa";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}



function moduleFromPathname(pathname: string): Module {
  if (pathname.startsWith("/cocoa")) return "cocoa";
  return "rice";
}

function primaryActionForPath(pathname: string) {
  switch (pathname) {
    case "/rice":
      return "+ Log production";
    case "/rice/production":
      return "+ New record";
    case "/rice/loss":
      return "+ Assign agent";
    case "/rice/reports":
      return "Generate report";
    case "/cocoa/lots":
      return "+ Create lot";
    case "/cocoa/movements":
      return "+ Log movement";
    case "/cocoa/farmers":
      return "+ Register farmer";
    case "/cocoa/eudr":
      return "Generate DDS";
    case "/cocoa/audit":
      return "Export log";
    case "/cocoa/inventory":
      return "Set opening balance";
    case "/cocoa/discrepancies":
      return "Refresh issues";
    case "/cocoa/approvals":
      return "Refresh queue";
    case "/cocoa/field-performance":
      return "Refresh metrics";
    case "/cocoa/data-quality":
      return "Refresh score";
    case "/cocoa/pilot-readiness":
      return "Open health";
    default:
      return "Action";
  }
}

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/rice";
  const search = useSearchParams();
  const presentation = search.get("present") === "1";

  const [activeModule, setActiveModule] = React.useState<Module>(() =>
    moduleFromPathname(pathname),
  );

  React.useEffect(() => {
    setActiveModule(moduleFromPathname(pathname));
  }, [pathname]);

  const user = React.useMemo(
    () => ({
      name: profile.full_name || "User",
      role: profile.role,
      initials: initialsFromName(profile.full_name || "User"),
    }),
    [profile.full_name, profile.role],
  );

  const onModuleSwitch = (module: Module) => {
    setActiveModule(module);
    router.push(module === "rice" ? "/rice" : "/cocoa/lots");
  };

  const primaryLabel = primaryActionForPath(pathname);

  if (presentation) {
    return (
      <div className="min-h-screen bg-[rgb(var(--surface-muted))]">
        <div className="fixed right-4 top-4 z-50 hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = new URL(window.location.href);
              next.searchParams.delete("present");
              router.push(next.pathname + next.search);
            }}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Exit presentation
          </button>
        </div>
        <main className="min-h-screen p-4 md:p-8">{children}</main>
        <DemoRail />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh)] grid grid-cols-[240px_1fr]">
      <Sidebar
        activeModule={activeModule}
        pathname={pathname}
        onModuleSwitch={onModuleSwitch}
        onNavigate={(href) => router.push(href)}
        user={user}
      />

      <div className="min-w-0 flex flex-col">
        <Topbar
          module={activeModule}
          pathname={pathname}
          onExportPdf={() => {
            // Placeholder: actual PDF export hooks are added in Phase 2.
            router.push(activeModule === "rice" ? "/rice/reports" : "/cocoa/eudr");
          }}
          primaryAction={{
            label: primaryLabel,
            onClick: () => {
              if (pathname === "/cocoa/pilot-readiness") {
                router.push("/health");
                return;
              }
              const refreshIntegrity = new Set([
                "/cocoa/inventory",
                "/cocoa/discrepancies",
                "/cocoa/approvals",
                "/cocoa/field-performance",
                "/cocoa/data-quality",
              ]);
              if (refreshIntegrity.has(pathname)) {
                window.dispatchEvent(new CustomEvent("agritrace-primary-action"));
                return;
              }
              router.push(pathname);
            },
          }}
        />
        <main className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))]">
          <PilotBanner />
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>
      <DemoRail />
    </div>
  );
}

