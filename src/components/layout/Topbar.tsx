 "use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import NotificationsMenu from "@/components/layout/NotificationsMenu";

type Module = "rice" | "cocoa";

const BREADCRUMBS: Record<string, string> = {
  "/rice": "Rice / National dashboard",
  "/rice/production": "Rice / Production records",
  "/rice/loss": "Rice / Post-harvest loss",
  "/rice/reports": "Rice / Ministry reports",
  "/cocoa": "Cocoa / Overview",
  "/cocoa/lots": "Cocoa / Lot management",
  "/cocoa/movements": "Cocoa / Movement ledger",
  "/cocoa/farmers": "Cocoa / Farmer registry",
  "/cocoa/eudr": "Cocoa / EUDR checklist",
  "/cocoa/audit": "Cocoa / Audit trail",
  "/cocoa/inventory": "Cocoa / Inventory ledger",
  "/cocoa/discrepancies": "Cocoa / Discrepancies",
  "/cocoa/approvals": "Cocoa / Approvals",
  "/cocoa/field-performance": "Cocoa / Field performance",
  "/cocoa/data-quality": "Cocoa / Data quality",
  "/cocoa/pilot-readiness": "Cocoa / Pilot readiness",
  "/admin/users": "System / User management",
  "/admin/organizations": "System / Organizations",
  "/admin/demo-inquiries": "System / Demo inquiries",
  "/admin/analytics": "System / Analytics",
  "/admin/launch-readiness": "System / Launch readiness",
  "/admin/import": "System / Data import",
  "/admin/reports": "System / Reports center",
  "/admin/settings": "System / Settings",
  "/activity": "System / Activity center",
};

export default function Topbar({
  module,
  pathname,
  primaryAction,
  onExportPdf,
}: {
  module: Module;
  pathname: string;
  primaryAction: { label: string; onClick: () => void };
  onExportPdf: () => void;
}) {
  const router = useRouter();
  const crumb = BREADCRUMBS[pathname] ?? `${module === "rice" ? "Rice" : "Cocoa"} / Dashboard`;
  const [left, right] = crumb.split(" / ");
  const [q, setQ] = React.useState("");

  return (
    <header className="h-[56px] px-5 md:px-6 border-b border-gray-100 bg-white/70 backdrop-blur flex items-center justify-between">
      <div className="text-[12px]">
        <span className="font-medium text-ink-900">{left}</span>
        <span className="text-gray-300"> / </span>
        <span className="text-slate-600">{right}</span>
      </div>

      <div className="flex items-center gap-2.5">
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
            placeholder="Search farmers, lots, reports…"
            className="h-9 w-[280px] rounded-xl border border-gray-200 bg-white px-3 text-[12px] text-gray-800 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-50"
            aria-label="Global search"
          />
        </form>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-blink" aria-hidden="true" />
          <span className="font-mono text-[10px] text-green-600">Live</span>
        </div>
        <NotificationsMenu />
        <button
          type="button"
          onClick={onExportPdf}
          className="hidden sm:inline-flex h-9 px-3 rounded-xl border border-gray-200 bg-white text-[12px] text-gray-800 hover:bg-gray-50"
        >
          Export PDF
        </button>
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="h-9 px-3 rounded-xl bg-forest-800 text-white text-[12px] hover:bg-forest-900 shadow-sm"
        >
          {primaryAction.label}
        </button>
      </div>
    </header>
  );
}

