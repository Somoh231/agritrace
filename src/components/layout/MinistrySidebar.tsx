"use client";

import * as React from "react";

import { formatRoleLabel } from "@/lib/display/role-labels";
import { navIconForHref } from "@/lib/navigation/ministry-nav-icons";
import { ministryNavForRole, normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import type { UserRole } from "@/lib/supabase/types";

function MoMark() {
  return (
    <div className="relative h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-[#0c4a21] to-[#052e16] grid place-items-center ring-1 ring-[rgb(var(--ministry-gold))]/40 shadow-md">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="rgb(var(--ministry-gold))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2C8 2 5 6 5 10c0 4 3 7 7 9 4-2 7-5 7-9 0-4-3-8-7-8z" />
        <path d="M12 2v18" />
      </svg>
    </div>
  );
}

function matchesHref(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

function resolveActiveHref(pathname: string, sections: ReturnType<typeof ministryNavForRole>): string | null {
  let best: string | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      if (matchesHref(pathname, item.href) && (best === null || item.href.length > best.length)) {
        best = item.href;
      }
    }
  }
  return best;
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

  const activeHref = resolveActiveHref(pathname, sections);

  return (
    <aside className="ministry-shell-sidebar h-full w-full shrink-0 flex flex-col text-[rgb(var(--ministry-sidebar-fg))]">
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <MoMark />
          <div className="min-w-0">
            <div className="ent-editorial text-[17px] leading-tight font-medium text-white">
              AgriVault <span className="text-[rgb(var(--ministry-gold))]">Data</span>
            </div>
            <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-200/55 leading-none">
              Ministry of Agriculture · Liberia
            </div>
          </div>
        </div>
      </div>

      <nav className="px-2.5 pb-5 pt-4 flex-1 overflow-y-auto min-h-0" aria-label="Ministry navigation">
        <div className="space-y-5">
          {sections.map((section, si) => (
            <div key={section.id}>
              {si > 0 ? <div className="mx-3 mb-4 h-px bg-white/[0.06]" aria-hidden /> : null}
              <div className="px-3 mb-2 ent-nav-section">{section.label}</div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === activeHref;
                  const Icon = navIconForHref(item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onNavigate(item.href)}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ent-nav-item ${
                        active
                          ? "bg-[rgb(var(--ministry-gold))]/[0.14] text-white font-medium shadow-[inset_0_0_0_1px_rgb(var(--ministry-gold)/0.25)]"
                          : "text-emerald-50/75 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[rgb(var(--ministry-gold))]"
                        />
                      ) : null}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
                          active
                            ? "bg-[rgb(var(--ministry-gold))]/20 text-[rgb(var(--ministry-gold))]"
                            : "bg-white/[0.04] text-emerald-100/60 group-hover:bg-white/[0.08] group-hover:text-emerald-50"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                      </span>
                      <span className="block min-w-0 flex-1 truncate pr-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-white/[0.08] p-3.5 space-y-3.5 bg-black/20">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="ent-label !text-[9px] !tracking-[0.16em] text-emerald-200/50">Data integrity</span>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-emerald-100">98.4%</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[98.4%] rounded-full bg-gradient-to-r from-emerald-500 to-amber-300" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-emerald-100/55">Verified by national data bureau</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-600/25 grid place-items-center ring-2 ring-[rgb(var(--ministry-gold))]/30">
            <span className="text-[11px] font-semibold text-emerald-50">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white truncate leading-snug">{user.name}</div>
            <div className="font-mono text-[9px] text-emerald-200/55 truncate mt-0.5">{formatRoleLabel(navRole)}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
