"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, PanelRightClose, Wifi, WifiOff, X } from "lucide-react";

import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { operationsRailForRole, type OperationsRailLink } from "@/lib/ops/operations-rail-config";
import type { UserRole } from "@/lib/supabase/types";

function isActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0] ?? href;
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

function toneDot(tone: OperationsRailLink["tone"]): string {
  if (tone === "alert") return "bg-rose-400";
  if (tone === "escalation") return "bg-amber-400";
  return "bg-emerald-400/80";
}

function useOnline(): boolean {
  const [online, setOnline] = React.useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  React.useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export default function OperationsRail({
  role,
  pathname,
  variant = "desktop",
  onClose,
  onCollapse,
  onNavigate,
}: {
  role: UserRole;
  pathname: string;
  variant?: "desktop" | "drawer";
  onClose?: () => void;
  onCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const config = operationsRailForRole(role);
  const online = useOnline();

  return (
    <div className="flex h-full min-h-0 flex-col text-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--ministry-gold))]/15 px-3 py-2.5">
        <div className="min-w-0">
          <div className="cmd-kicker">Operations</div>
          <div className="mt-1 truncate font-serif-display text-[15px] leading-none text-white">{config.tier} status</div>
        </div>
        {variant === "drawer" ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close operations panel"
            className="shrink-0 rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse operations panel"
            className="shrink-0 rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <p className="text-[11px] leading-snug text-slate-400">{config.focus}</p>

        {/* Persistent operational context */}
        <div className="mt-3 cmd-surface p-2.5">
          <div className="cmd-kicker">Live status</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">Connectivity</span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                online
                  ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-200"
                  : "border-amber-800/50 bg-amber-950/30 text-amber-100"
              }`}
            >
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">Sync health</span>
            <SyncStatusIndicator />
          </div>
          {!online ? (
            <p className="mt-2 text-[10px] leading-snug text-amber-100/90">
              Data safely stored on device. Queue syncs when connectivity returns.
            </p>
          ) : null}
        </div>

        {config.sections.map((section) => (
          <div key={section.id} className="mt-4">
            <div className="cmd-kicker mb-1.5">{section.label}</div>
            <ul className="mt-1.5 space-y-1">
              {section.links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
                        active
                          ? "border-emerald-700/60 bg-emerald-950/30"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot(link.tone)}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-slate-100">{link.label}</span>
                        {link.hint ? (
                          <span className="block truncate text-[10px] text-slate-500">{link.hint}</span>
                        ) : null}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
