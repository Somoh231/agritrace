"use client";

import * as React from "react";
import Link from "next/link";

import { DashboardPanel, SectionHeader, StatusBadge } from "@/components/enterprise";
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

  return (
    <Link
      href={href}
      className="block rounded-2xl transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
    >
      <DashboardPanel className={count > 0 ? "border-amber-200/80 bg-amber-50/20" : undefined}>
        <SectionHeader
          kicker="Sync intake"
          title={label}
          subtitle={count > 0 ? "Records waiting to sync" : "All records synced"}
          action={<StatusBadge tone={online ? "success" : "warning"}>{online ? "Online" : "Offline"}</StatusBadge>}
        />
        <p className={`mt-3 font-display text-[2rem] font-semibold tabular-nums tracking-tight ${count > 0 ? "text-amber-700" : "text-emerald-700"}`}>
          {pending == null ? "—" : count}
        </p>
      </DashboardPanel>
    </Link>
  );
}
