"use client";

import * as React from "react";

import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import { ministryNavForRole } from "@/lib/navigation/ministry-nav";
import type { UserRole } from "@/lib/supabase/types";

function MoMark() {
  return (
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0c4a21] to-[#052e16] grid place-items-center ring-1 ring-white/10 shadow-md">
      <span className="text-[11px] font-bold tracking-tight text-emerald-100">MoA</span>
    </div>
  );
}

function navActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export default function MinistrySidebar({
  pathname,
  onNavigate,
  user,
}: {
  pathname: string;
  onNavigate: (href: string) => void;
  user: { name: string; role: UserRole; initials: string };
}) {
  const sections = ministryNavForRole(user.role);

  const adminSection = isAdminConsoleRole(user.role)
    ? {
        label: "Administration",
        items: [
          { label: "User & role management", href: "/admin/users" },
          { label: "System diagnostics", href: "/admin/system" },
          { label: "Organizations", href: "/admin/organizations" },
          { label: "Data integrations", href: "/admin/integrations" },
          { label: "Import & pipelines", href: "/admin/import" },
          { label: "Reports center", href: "/admin/reports" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Activity", href: "/activity" },
        ],
      }
    : null;

  return (
    <aside className="ministry-shell-sidebar h-full w-[292px] shrink-0 flex flex-col border-r border-[rgb(var(--ministry-border))] bg-[rgb(var(--ministry-sidebar))] text-[rgb(var(--ministry-sidebar-fg))]">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-start gap-3">
          <MoMark />
          <div className="min-w-0 pt-0.5">
            <div className="font-display text-[14px] font-semibold tracking-tight text-white leading-tight">
              AgriVault AIS
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-200/70">
              Liberia · Ministry operations
            </div>
          </div>
        </div>
      </div>

      <nav className="px-2 pb-4 pt-3 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="px-3 mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-200/45">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onNavigate(item.href)}
                      className={`relative w-full text-left px-3 py-2 rounded-lg text-[12px] transition leading-snug ${
                        active
                          ? "bg-white/[0.12] text-white font-medium shadow-inner"
                          : "text-emerald-50/75 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-emerald-400 rounded-r"
                        />
                      ) : null}
                      <span className="block truncate pl-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {adminSection ? (
            <div>
              <div className="px-3 mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-200/45">
                {adminSection.label}
              </div>
              <div className="space-y-0.5">
                {adminSection.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onNavigate(item.href)}
                      className={`relative w-full text-left px-3 py-2 rounded-lg text-[12px] transition leading-snug ${
                        active
                          ? "bg-white/[0.12] text-white font-medium"
                          : "text-emerald-50/75 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="block truncate pl-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="mt-auto border-t border-white/[0.06] p-3 bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-emerald-600/30 grid place-items-center ring-2 ring-emerald-400/20">
            <span className="text-[11px] font-semibold text-emerald-100">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{user.name}</div>
            <div className="font-mono text-[9px] text-emerald-200/60 truncate">{user.role.replaceAll("_", " ")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
