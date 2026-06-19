"use client";

import * as React from "react";

import { formatRoleLabel } from "@/lib/display/role-labels";
import { ministryNavForRole, normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import type { UserRole } from "@/lib/supabase/types";

function MoMark() {
  return (
    <div className="relative h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-[#0c4a21] to-[#052e16] grid place-items-center ring-1 ring-[rgb(var(--ministry-gold))]/40 shadow-md">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="rgb(var(--ministry-gold))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2C8 2 5 6 5 10c0 4 3 7 7 9 4-2 7-5 7-9 0-4-3-8-7-8z" />
        <path d="M12 2v18" />
      </svg>
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
  const navRole = normalizeMinistryNavRole(user.role);
  let sections: ReturnType<typeof ministryNavForRole> = [];
  try {
    sections = ministryNavForRole(navRole);
  } catch (e) {
    console.error("[dashboard] sidebar generation failed", e);
    sections = ministryNavForRole(normalizeMinistryNavRole(undefined));
  }

  const adminSection = isAdminConsoleRole(navRole)
    ? {
        label: "Administration",
        items: [
          { label: "Users & roles", href: "/admin/users" },
          { label: "Permissions", href: "/admin/governance" },
          { label: "System diagnostics", href: "/admin/system" },
          { label: "Data integrations", href: "/admin/integrations" },
          { label: "Organizations", href: "/admin/organizations" },
          { label: "Import & pipelines", href: "/admin/import" },
          { label: "Reports center", href: "/admin/reports" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Activity", href: "/activity" },
        ],
      }
    : null;

  return (
    <aside className="ministry-shell-sidebar h-full w-[280px] shrink-0 flex flex-col text-[rgb(var(--ministry-sidebar-fg))]">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <MoMark />
          <div className="min-w-0">
            <div className="font-serif-display text-[18px] leading-none text-white">
              AgriVault <span className="text-[rgb(var(--ministry-gold))]">Data</span>
            </div>
            <div className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-emerald-200/70">
              Ministry of Agriculture · Liberia
            </div>
          </div>
        </div>
        <div className="cmd-rule mt-3" aria-hidden />
        <div className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-emerald-200/45">
          National Agricultural Intelligence
        </div>
      </div>

      <nav className="px-2 pb-4 pt-3 flex-1 overflow-y-auto min-h-0">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="px-3 mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.24em] text-[rgb(var(--ministry-gold))]/70">
                {section.label}
              </div>
              <div className="space-y-px">
                {section.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onNavigate(item.href)}
                      className={`relative w-full text-left px-3 py-1.5 rounded-md text-[12px] transition leading-snug ${
                        active
                          ? "bg-[rgb(var(--ministry-gold))]/[0.12] text-white font-medium"
                          : "text-emerald-50/70 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1 bottom-1 w-[3px] bg-[rgb(var(--ministry-gold))] rounded-r"
                        />
                      ) : null}
                      <span className="block truncate pl-1.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {adminSection ? (
            <div>
              <div className="px-3 mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.24em] text-[rgb(var(--ministry-gold))]/70">
                {adminSection.label}
              </div>
              <div className="space-y-px">
                {adminSection.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onNavigate(item.href)}
                      className={`relative w-full text-left px-3 py-1.5 rounded-md text-[12px] transition leading-snug ${
                        active
                          ? "bg-[rgb(var(--ministry-gold))]/[0.12] text-white font-medium"
                          : "text-emerald-50/70 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1 bottom-1 w-[3px] bg-[rgb(var(--ministry-gold))] rounded-r"
                        />
                      ) : null}
                      <span className="block truncate pl-1.5">{item.label}</span>
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
          <div className="h-9 w-9 rounded-full bg-emerald-600/25 grid place-items-center ring-2 ring-[rgb(var(--ministry-gold))]/30">
            <span className="text-[11px] font-semibold text-emerald-50">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{user.name}</div>
            <div className="font-mono text-[9px] text-emerald-200/60 truncate">{formatRoleLabel(navRole)}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
