"use client";

import * as React from "react";
import Link from "next/link";

import { getPendingCount, getSyncErrors, readQueueClearTimestamp } from "@/lib/offline/sync-queue";

import { detectInstallSurface } from "@/components/pwa/InstallAppGuide";
import { usePwaInstall } from "@/components/pwa/install-prompt-context";

function formatShort(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return null;
  }
}

export default function OfflineReadinessPanel({ className }: { className?: string }) {
  const { deferredPrompt, installed } = usePwaInstall();
  const [online, setOnline] = React.useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pending, setPending] = React.useState(0);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [gpsState, setGpsState] = React.useState<"unknown" | "granted" | "prompt" | "denied" | "unsupported">("unknown");
  const [queueClear, setQueueClear] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [p, e] = await Promise.all([getPendingCount(), getSyncErrors()]);
      setPending(p);
      setErrors(e);
    } catch {
      /* ignore */
    }
    setQueueClear(readQueueClearTimestamp());
  }, []);

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 30_000);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [refresh]);

  React.useEffect(() => {
    let perm: PermissionStatus | undefined;
    const apply = () => {
      if (!perm) return;
      if (perm.state === "granted") setGpsState("granted");
      else if (perm.state === "prompt") setGpsState("prompt");
      else if (perm.state === "denied") setGpsState("denied");
      else setGpsState("unknown");
    };
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        perm = p;
        apply();
        p.addEventListener("change", apply);
      })
      .catch(() => setGpsState("unknown"));
    return () => {
      if (perm) perm.removeEventListener("change", apply);
    };
  }, []);

  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  const surface = detectInstallSurface();
  const installedView = installed || standalone || surface === "installed";
  const installable = Boolean(deferredPrompt) && !installedView;

  let installLabel = "Needs setup";
  if (installedView) installLabel = "Ready";
  else if (installable) installLabel = "Ready";

  let storageLabel = "Needs setup";
  if (typeof indexedDB !== "undefined") storageLabel = "Ready";

  let gpsLabel = "Needs setup";
  if (gpsState === "granted") gpsLabel = "Ready";
  else if (gpsState === "prompt" || gpsState === "unknown") gpsLabel = "Needs setup";
  else if (gpsState === "denied") gpsLabel = "Needs setup";

  let syncLabel = "Ready";
  if (errors.length > 0) syncLabel = "Sync failed";
  else if (pending > 0) syncLabel = online ? "Pending sync" : "Pending sync";

  const lastClear = formatShort(queueClear);

  return (
    <div
      className={
        className ??
        "rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-[12px] text-slate-300 sm:px-4"
      }
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Offline readiness</div>
      <ul className="mt-2 space-y-1.5 font-mono text-[11px] leading-snug">
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">App</span>
          <span className={installedView ? "text-emerald-300" : installable ? "text-emerald-300" : "text-amber-200/90"}>
            {installedView ? "Installed" : installable ? "Installable" : "Use browser install steps"}
          </span>
        </li>
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">Install status</span>
          <span className={installLabel === "Ready" ? "text-emerald-300" : "text-amber-200/90"}>{installLabel}</span>
        </li>
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">GPS permission</span>
          <span className={gpsLabel === "Ready" ? "text-emerald-300" : "text-amber-200/90"}>{gpsLabel}</span>
        </li>
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">Offline storage</span>
          <span className={storageLabel === "Ready" ? "text-emerald-300" : "text-rose-200/90"}>{storageLabel}</span>
        </li>
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">Pending sync</span>
          <span className={pending > 0 ? "text-amber-200/90" : "text-emerald-300"}>{pending > 0 ? `${pending} on device` : "None"}</span>
        </li>
        <li className="flex flex-wrap justify-between gap-2">
          <span className="text-slate-500">Sync health</span>
          <span
            className={
              syncLabel === "Sync failed" ? "text-rose-300" : syncLabel === "Pending sync" ? "text-amber-200/90" : "text-emerald-300"
            }
          >
            {syncLabel}
          </span>
        </li>
        {lastClear ? (
          <li className="flex flex-wrap justify-between gap-2 border-t border-slate-800/80 pt-1.5">
            <span className="text-slate-500">Queue last cleared</span>
            <span className="text-slate-400">{lastClear}</span>
          </li>
        ) : null}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-800/80 pt-2">
        <Link href="/field/sync-queue" className="text-[11px] font-medium text-emerald-400 underline decoration-emerald-600/40 hover:text-emerald-300">
          View offline queue
        </Link>
        <button type="button" onClick={() => void refresh()} className="text-[11px] font-medium text-slate-400 underline hover:text-slate-200">
          Refresh
        </button>
      </div>
    </div>
  );
}
