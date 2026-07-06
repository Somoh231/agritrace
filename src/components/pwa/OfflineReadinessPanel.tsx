"use client";

import * as React from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/enterprise";
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

function readinessTone(label: string): "success" | "warning" | "danger" | "neutral" {
  if (label === "Ready" || label === "Installed" || label === "Install available") return "success";
  if (label === "Pending sync" || label === "Needs setup") return "warning";
  if (label === "Sync failed") return "danger";
  return "neutral";
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
  const installAvailable = Boolean(deferredPrompt) && !installedView;

  let storageLabel = "Needs setup";
  if (typeof indexedDB !== "undefined") storageLabel = "Ready";

  let gpsLabel = "Needs setup";
  if (gpsState === "granted") gpsLabel = "Ready";
  else if (gpsState === "prompt" || gpsState === "unknown") gpsLabel = "Needs setup";
  else if (gpsState === "denied") gpsLabel = "Denied";

  let syncLabel = "Ready";
  if (errors.length > 0) syncLabel = "Sync failed";
  else if (pending > 0) syncLabel = "Pending sync";

  const installLabel = installedView ? "Installed" : installAvailable ? "Install available" : "Manual setup required";
  const lastClear = formatShort(queueClear);

  const rows = [
    { label: "Install", value: installLabel },
    { label: "GPS permission", value: gpsLabel },
    { label: "Offline storage", value: storageLabel },
    { label: "Pending sync", value: pending > 0 ? `${pending} on device` : "None" },
    { label: "Sync health", value: syncLabel },
    { label: "Network", value: online ? "Online" : "Offline" },
  ];

  return (
    <div className={className ?? "rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3"}>
      <p className="ent-label">Offline readiness checklist</p>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-slate-600">{row.label}</span>
            <StatusBadge tone={readinessTone(row.value === "None" ? "Ready" : row.value)}>{row.value}</StatusBadge>
          </li>
        ))}
        {lastClear ?
          <li className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2">
            <span className="text-[13px] text-slate-600">Queue last cleared</span>
            <span className="font-mono text-[11px] text-slate-500">{lastClear}</span>
          </li>
        : null}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-200 pt-3">
        <Link href="/field/sync-queue" className="text-[13px] font-medium text-forest-700 hover:text-forest-800">
          View offline queue
        </Link>
        <button type="button" onClick={() => void refresh()} className="text-[13px] font-medium text-slate-600 hover:text-ink-900">
          Refresh status
        </button>
      </div>
    </div>
  );
}
