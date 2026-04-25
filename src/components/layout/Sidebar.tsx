import * as React from "react";

import type { UserRole } from "@/lib/supabase/types";
import { PILOT_MODE } from "@/lib/utils/pilot-config";

type Module = "rice" | "cocoa";

type NavItem = {
  label: string;
  href: string;
  badge?: { value: number; tone: "neutral" | "warning" | "danger" };
};

function LeafMark() {
  return (
    <div className="h-7 w-7 rounded-md bg-forest-700 grid place-items-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
          stroke="#c4edcb"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M7 17c2-3 6-7 10-9"
          stroke="#c4edcb"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Badge({ value, tone }: { value: number; tone: "neutral" | "warning" | "danger" }) {
  const cls =
    tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600";
  return (
    <span className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded-full ${cls}`}>
      {value}
    </span>
  );
}

function sectionItems(module: Module, role: UserRole): Array<{ label: string; items: NavItem[] }> {
  const rice = [
    {
      label: "Overview",
      items: [
        { label: "National dashboard", href: "/rice" },
        { label: "Production records", href: "/rice/production" },
        { label: "Post-harvest loss", href: "/rice/loss", badge: { value: 3, tone: "warning" as const } },
      ],
    },
    {
      label: "Reports",
      items: [{ label: "Ministry reports", href: "/rice/reports" }],
    },
  ];

  const cocoa = [
    {
      label: "Operations",
      items: [
        { label: "Lot management", href: "/cocoa/lots", badge: { value: 12, tone: "neutral" as const } },
        { label: "Movement ledger", href: "/cocoa/movements" },
        { label: "Farmer registry", href: "/cocoa/farmers" },
      ],
    },
    {
      label: "Integrity & pilot",
      items: [
        { label: "Inventory ledger", href: "/cocoa/inventory" },
        { label: "Discrepancies", href: "/cocoa/discrepancies" },
        { label: "Approvals", href: "/cocoa/approvals" },
        { label: "Field performance", href: "/cocoa/field-performance" },
        { label: "Data quality", href: "/cocoa/data-quality" },
        { label: "Pilot readiness", href: "/cocoa/pilot-readiness" },
      ],
    },
    {
      label: "Compliance",
      items: [
        { label: "EUDR checklist", href: "/cocoa/eudr", badge: { value: 8, tone: "danger" as const } },
        { label: "Audit trail", href: "/cocoa/audit" },
      ],
    },
  ];

  const system =
    role === "super_admin"
      ? [
          {
            label: "System",
            items: [
              { label: "User management", href: "/admin/users" },
              { label: "Organizations", href: "/admin/organizations" },
              { label: "Demo inquiries", href: "/admin/demo-inquiries" },
              { label: "Analytics", href: "/admin/analytics" },
              { label: "Launch readiness", href: "/admin/launch-readiness" },
              { label: "Data import", href: "/admin/import" },
              { label: "Reports center", href: "/admin/reports" },
              { label: "Settings", href: "/admin/settings" },
              { label: "Activity center", href: "/activity" },
              { label: "Health checks", href: "/health" },
              { label: "First-time setup", href: "/setup" },
            ],
          },
        ]
      : [];

  const canSeeRice =
    role === "super_admin" || role === "government_officer" || role === "county_officer";
  const canSeeCocoa =
    role === "super_admin" ||
    role === "exporter" ||
    role === "cooperative_manager" ||
    role === "field_agent" ||
    role === "call_center_agent" ||
    role === "auditor";

  if (module === "rice") return canSeeRice ? [...rice, ...system] : [];
  return canSeeCocoa ? [...cocoa, ...system] : [];
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
  const effectiveModule: Module = PILOT_MODE ? "rice" : activeModule;
  const sections = sectionItems(effectiveModule, user.role);
  const showRiceToggle = user.role === "super_admin" || user.role.includes("officer");
  const showCocoaToggle = user.role === "super_admin" || !user.role.includes("officer");

  return (
    <aside className="h-full w-[240px] shrink-0 border-r border-gray-100 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <LeafMark />
          <div className="min-w-0">
            <div className="font-display text-[14px] font-medium text-ink-900 leading-tight">
              Agrivault
            </div>
            <div className="font-mono text-[10px] text-slate-400">LIB · v1.0</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {PILOT_MODE ? (
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <div className="font-mono text-[10px] text-green-600">
              Rice Production Pilot · Nimba, Bong &amp; Lofa
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => onModuleSwitch("rice")}
              disabled={!showRiceToggle}
              className={`text-[12px] px-2 py-1.5 rounded-md transition ${
                activeModule === "rice"
                  ? "bg-forest-50 text-forest-800 font-medium"
                  : "text-slate-500 hover:text-ink-900"
              } ${showRiceToggle ? "" : "opacity-40 cursor-not-allowed"}`}
            >
              Rice
            </button>
            <button
              type="button"
              onClick={() => onModuleSwitch("cocoa")}
              disabled={!showCocoaToggle}
              className={`text-[12px] px-2 py-1.5 rounded-md transition ${
                activeModule === "cocoa"
                  ? "bg-forest-50 text-forest-800 font-medium"
                  : "text-slate-500 hover:text-ink-900"
              } ${showCocoaToggle ? "" : "opacity-40 cursor-not-allowed"}`}
            >
              Cocoa
            </button>
          </div>
        )}
      </div>

      <nav className="px-4 pb-4 pt-4 flex-1 overflow-y-auto">
        {sections.length ? (
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.label}>
                <div className="px-2.5 mb-2 font-mono text-[9px] uppercase text-slate-400 tracking-[3px]">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => onNavigate(item.href)}
                        className={`relative w-full text-left px-3 py-2.5 rounded-xl text-[12px] transition flex items-center gap-2 ${
                          isActive
                            ? "bg-forest-50/60 text-ink-900 font-medium"
                            : "text-slate-600 hover:bg-gray-50 hover:text-ink-900"
                        }`}
                      >
                        {isActive ? (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-[2px] bg-forest-700 rounded-full"
                          />
                        ) : null}
                        <span className="truncate">{item.label}</span>
                        {item.badge ? <Badge value={item.badge.value} tone={item.badge.tone} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-3 text-[12px] text-slate-500">
            You don’t have access to this module.
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-forest-700 grid place-items-center shadow-sm">
            <span className="text-[11px] font-medium text-forest-100">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-ink-900 truncate">{user.name}</div>
            <div className="font-mono text-[9px] text-slate-400 truncate">{user.role.replaceAll("_", " ")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

