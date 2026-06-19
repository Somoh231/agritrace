"use client";

import * as React from "react";
import Link from "next/link";

import { getPendingCount } from "@/lib/offline/sync-queue";

/**
 * Compact, live offline-queue indicator for role workspaces.
 * Reads the real IndexedDB pending count — no fabricated values.
 */
export default function LiveQueueStat({
  href = "/field/sync-queue",
  label = "Offline queue",
}: {
  href?: string;
  label?: string;
}) {
  const [online, setOnline] = React.useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pending, setPending] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const n = await getPendingCount();
        if (alive) setPending(n);
      } catch {
        if (alive) setPending(0);
      }
    };
    void refresh();
    const id = window.setInterval(refresh, 15_000);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const count = pending ?? 0;
  const tone = count > 0 ? "text-amber-200" : "text-emerald-200";

  return (
    <Link href={href} className="group cmd-surface cmd-surface-hover flex items-center justify-between gap-3 px-3.5 py-3">
      <div className="min-w-0">
        <div className="cmd-kicker">{label}</div>
        <div className={`mt-1 font-serif-display text-[22px] leading-none ${tone}`}>
          {pending == null ? "—" : count}
        </div>
        <div className="mt-1 text-[11px] text-emerald-100/45">
          {count > 0 ? "records waiting to sync" : "all records synced"}
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${
          online
            ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-200"
            : "border-amber-800/50 bg-amber-950/30 text-amber-100"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
        {online ? "Online" : "Offline"}
      </span>
    </Link>
  );
}
