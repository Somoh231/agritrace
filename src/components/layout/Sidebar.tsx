import * as React from "react";

import type { UserRole } from "@/lib/supabase/types";
import { PILOT_MODE } from "@/lib/utils/pilot-config";

type Module = "rice" | "cocoa";

type NavItem = {
  label: string;
  href: string;
  badge?: { value: number; tone: "neutral" | "warning" | "danger" };
};

type NavSection = { label: string; items: NavItem[] };

function LeafMark() {
  return (
    <div className="h-7 w-7 rounded-md bg-[#0f2918] grid place-items-center ring-1 ring-[#14532d]/40">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
          stroke="#c4edcb"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M7 17c2-3 6-7 10-9" stroke="#c4edcb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Badge({ value, tone }: { value: number; tone: "neutral" | "warning" | "danger" }) {
  const cls =
    tone === "warning"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : tone === "danger"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded border ${cls}`}>{value}</span>
  );
}

function canSeeNationalOps(role: UserRole) {
  return (
    role === "super_admin" ||
    role === "admin" || // TEMP DEMO FALLBACK
    role === "government_officer" ||
    role === "county_officer" ||
    role === "field_agent" ||
    role === "call_center_agent"
  );
}

/** Sidebar sections: National → Operations → Rice/Cocoa programmes → Administration */
function navSectionsForRole(role: UserRole): NavSection[] {
  const riceProgramme: NavSection = {
    label: "Rice programme",
    items: [
      { label: "Production records", href: "/rice/production" },
      { label: "Post-harvest loss", href: "/rice/loss", badge: { value: 3, tone: "warning" } },
      { label: "Renewals", href: "/rice/renewals" },
      { label: "Programmes", href: "/rice/programmes" },
      { label: "Resource allocation", href: "/rice/resource-allocation" },
      { label: "Ministry reports (detail)", href: "/rice/reports" },
    ],
  };

  const cocoaProgramme: NavSection = {
    label: "Cocoa programme",
    items: [
      { label: "Lot management", href: "/cocoa/lots", badge: { value: 12, tone: "neutral" } },
      { label: "Movement ledger", href: "/cocoa/movements" },
      { label: "Farmer registry", href: "/cocoa/farmers" },
      { label: "Inventory ledger", href: "/cocoa/inventory" },
      { label: "Discrepancies", href: "/cocoa/discrepancies" },
      { label: "Approvals", href: "/cocoa/approvals" },
      { label: "Field performance", href: "/cocoa/field-performance" },
      { label: "Data quality", href: "/cocoa/data-quality" },
      { label: "Pilot readiness", href: "/cocoa/pilot-readiness" },
      { label: "EUDR checklist", href: "/cocoa/eudr", badge: { value: 8, tone: "danger" } },
      { label: "Audit trail", href: "/cocoa/audit" },
    ],
  };

  const national: NavSection = {
    label: "National",
    items: [{ label: "National Operations", href: "/national-operations" }],
  };

  const operations: NavSection = {
    label: "Operations",
    items: [
      { label: "Farmer Registry", href: "/farmers" },
      { label: "Inventory & Inputs", href: "/inventory" },
      { label: "County Operations", href: "/county-operations" },
      { label: "Field Agents", href: "/field-agents" },
      { label: "Food Security", href: "/food-security" },
      { label: "Reports", href: "/reports" },
    ],
  };

  const commodities: NavSection = {
    label: "Commodities",
    items: [
      { label: "Rice pilot", href: "/national-operations" },
      { label: "Cocoa traceability", href: "/cocoa/lots" },
    ],
  };

  const system: NavSection =
    role === "super_admin" || role === "admin" // TEMP DEMO FALLBACK
      ? {
          label: "Administration",
          items: [
            { label: "User management", href: "/admin/users" },
            { label: "Organizations", href: "/admin/organizations" },
            { label: "Demo inquiries", href: "/admin/demo-inquiries" },
            { label: "Analytics", href: "/admin/analytics" },
            { label: "Governance", href: "/admin/governance" },
            { label: "Capabilities", href: "/admin/capabilities" },
            { label: "Integration center", href: "/admin/integrations" },
            { label: "API documentation", href: "/admin/api-docs" },
            { label: "Public content", href: "/admin/content" },
            { label: "Launch readiness", href: "/admin/launch-readiness" },
            { label: "Data import", href: "/admin/import" },
            { label: "Reports center", href: "/admin/reports" },
            { label: "Settings", href: "/admin/settings" },
            { label: "Activity center", href: "/activity" },
            { label: "Health checks", href: "/health" },
            { label: "First-time setup", href: "/setup" },
          ],
        }
      : { label: "", items: [] };

  const canSeeRice =
    role === "super_admin" ||
    role === "admin" ||
    role === "government_officer" ||
    role === "county_officer";
  const canSeeCocoa =
    role === "super_admin" ||
    role === "admin" ||
    role === "exporter" ||
    role === "cooperative_manager" ||
    role === "field_agent" ||
    role === "call_center_agent" ||
    role === "auditor";

  const sections: NavSection[] = [];

  if (canSeeNationalOps(role)) {
    sections.push(national, operations);
  }

  if (canSeeRice) sections.push(riceProgramme);

  if (canSeeCocoa && !PILOT_MODE) sections.push(cocoaProgramme);
  else if (canSeeCocoa && PILOT_MODE) {
    sections.push({
      label: "Cocoa programme",
      items: [{ label: "Cocoa traceability", href: "/cocoa/lots" }],
    });
  }

  if (canSeeRice && canSeeCocoa) sections.push(commodities);

  if (system.items.length) sections.push(system);

  return sections;
}

export default function Sidebar({
  activeModule,
  pathname,
  onModuleSwitch,
  onNavigate,
  user,
}: {
  activeModule: Module;
  pathname: string;
  onModuleSwitch: (module: Module) => void;
  onNavigate: (href: string) => void;
  user: { name: string; role: UserRole; initials: string };
}) {
  const sections = navSectionsForRole(user.role);

  const showRiceToggle =
    user.role === "super_admin" ||
    user.role === "admin" ||
    user.role.includes("officer");
  const showCocoaToggle =
    user.role === "super_admin" ||
    user.role === "admin" ||
    !user.role.includes("officer");

  return (
    <aside className="h-full w-[268px] shrink-0 border-r border-slate-200/90 bg-[#fafbfa] flex flex-col">
      <div className="px-4 py-3.5 border-b border-slate-200/90 bg-white">
        <div className="flex items-center gap-2.5">
          <LeafMark />
          <div className="min-w-0">
            <div className="font-display text-[13px] font-semibold tracking-tight text-[#0f172a] leading-tight">
              AgriVault
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
              AIS · Liberia pilot
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        {PILOT_MODE ? (
          <div className="rounded-lg border border-[#14532d]/20 bg-[#f0fdf4] px-3 py-2">
            <div className="font-mono text-[9px] uppercase tracking-wide text-[#14532d]">Rice pilot scope</div>
            <div className="mt-0.5 text-[11px] font-medium text-[#052e16]">Nimba · Bong · Lofa · expandable to 15 counties</div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => onModuleSwitch("rice")}
              disabled={!showRiceToggle}
              className={`text-[11px] px-2 py-1.5 rounded-md transition font-medium ${
                activeModule === "rice"
                  ? "bg-[#14532d] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]"
              } ${showRiceToggle ? "" : "opacity-40 cursor-not-allowed"}`}
            >
              Rice
            </button>
            <button
              type="button"
              onClick={() => onModuleSwitch("cocoa")}
              disabled={!showCocoaToggle}
              className={`text-[11px] px-2 py-1.5 rounded-md transition font-medium ${
                activeModule === "cocoa"
                  ? "bg-[#1e3a5f] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]"
              } ${showCocoaToggle ? "" : "opacity-40 cursor-not-allowed"}`}
            >
              Cocoa
            </button>
          </div>
        )}
      </div>

      <nav className="px-3 pb-4 pt-3 flex-1 overflow-y-auto">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) =>
              section.items.length ? (
                <div key={section.label || "misc"}>
                  {section.label ? (
                    <div className="px-2 mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">
                      {section.label}
                    </div>
                  ) : null}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => onNavigate(item.href)}
                          className={`relative w-full text-left px-2.5 py-2 rounded-lg text-[12px] transition flex items-center gap-2 leading-snug ${
                            isActive
                              ? "bg-white text-[#0f172a] font-semibold shadow-sm ring-1 ring-slate-200/80"
                              : "text-slate-600 hover:bg-white/80 hover:text-[#0f172a]"
                          }`}
                        >
                          {isActive ? (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#14532d] rounded-r"
                            />
                          ) : null}
                          <span className="truncate pl-0.5">{item.label}</span>
                          {item.badge ? <Badge value={item.badge.value} tone={item.badge.tone} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div className="px-3 py-3 text-[12px] text-slate-500">No navigation available for this role.</div>
        )}
      </nav>

      <div className="mt-auto border-t border-slate-200/90 bg-white p-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#14532d] grid place-items-center shadow-sm ring-2 ring-white">
            <span className="text-[11px] font-semibold text-emerald-50">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[#0f172a] truncate">{user.name}</div>
            <div className="font-mono text-[9px] text-slate-500 truncate">{user.role.replaceAll("_", " ")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
