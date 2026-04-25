"use client";

import * as React from "react";
import { ArrowRight, FileText, Loader2, MapPin, PackageOpen, ShieldCheck, Truck } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils/formatters";

type Module = "rice" | "cocoa";

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
  href: string;
};

export default function DashboardWidgets({ module }: { module: Module }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <QuickActions module={module} />
      <RecentActivity module={module} />
    </div>
  );
}

function QuickActions({ module }: { module: Module }) {
  const actions =
    module === "rice"
      ? [
          { title: "Log production", detail: "Capture yields, loss causes, prices", href: "/rice/production", icon: FileText },
          { title: "Loss alerts", detail: "Prioritize high-loss counties", href: "/rice/loss", icon: ShieldCheck },
          { title: "Generate report", detail: "Export PDF/CSV outputs", href: "/rice/reports", icon: FileText },
          { title: "View map", detail: "County heatmap", href: "/map", icon: MapPin },
        ]
      : [
          { title: "Create lot", detail: "Start chain of custody", href: "/cocoa/lots", icon: PackageOpen },
          { title: "Log movement", detail: "Dispatch → receive reconciliation", href: "/cocoa/movements", icon: Truck },
          { title: "Farmer registry", detail: "Register & geotag farmers", href: "/cocoa/farmers", icon: MapPin },
          { title: "EUDR checklist", detail: "Generate DDS readiness", href: "/cocoa/eudr", icon: ShieldCheck },
        ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-[16px] text-gray-900">Quick actions</div>
          <div className="mt-1 text-[12px] text-gray-600">
            Common workflows for {module === "rice" ? "Ministry dashboards" : "Cocoa compliance ops"}.
          </div>
        </div>
        <a href={module === "rice" ? "/rice" : "/cocoa/lots"} className="text-[12px] text-forest-800 hover:underline inline-flex items-center gap-1">
          Open module <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="rounded-xl border border-gray-200 hover:bg-gray-50 p-3 flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-forest-50 border border-forest-100 grid place-items-center text-forest-800 shrink-0">
              <a.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-gray-900">{a.title}</div>
              <div className="text-[11px] text-gray-500">{a.detail}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ module }: { module: Module }) {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const next: ActivityItem[] = [];

        if (module === "rice") {
          const res = await supabase
            .from("rice_production_records")
            .select("id,county,season,actual_yield_kg,recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(8);
          if (res.error) throw res.error;
          for (const r of res.data ?? []) {
            next.push({
              id: `rice-${r.id}`,
              title: "Production record added",
              detail: `${r.county ?? "Unknown county"} · ${r.season} · ${Number(r.actual_yield_kg ?? 0).toFixed(0)}kg`,
              at: r.recorded_at ?? new Date().toISOString(),
              href: "/rice/production",
            });
          }
        } else {
          const [lots, moves] = await Promise.all([
            supabase
              .from("lots")
              .select("id,lot_code,created_at,status")
              .eq("commodity", "cocoa")
              .order("created_at", { ascending: false })
              .limit(4),
            supabase
              .from("movements")
              .select("id,created_at,status,weight_kg_dispatched,weight_kg_received")
              .order("created_at", { ascending: false })
              .limit(4),
          ]);
          if (lots.error && moves.error) throw lots.error ?? moves.error;

          for (const l of lots.data ?? []) {
            next.push({
              id: `lot-${l.id}`,
              title: "Lot created",
              detail: `${l.lot_code} · ${l.status}`,
              at: l.created_at ?? new Date().toISOString(),
              href: "/cocoa/lots",
            });
          }
          for (const m of moves.data ?? []) {
            const d = Number(m.weight_kg_dispatched ?? 0);
            const r = Number(m.weight_kg_received ?? 0);
            next.push({
              id: `mv-${m.id}`,
              title: "Movement updated",
              detail: `${m.status} · ${d.toFixed(0)}kg → ${r ? `${r.toFixed(0)}kg` : "pending"}`,
              at: m.created_at ?? new Date().toISOString(),
              href: "/cocoa/movements",
            });
          }
        }

        const sorted = next.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
        if (!cancelled) setItems(sorted);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load activity.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [module, reload]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="font-display text-[16px] text-gray-900">Recent activity</div>
        <div className="mt-1 text-[12px] text-gray-600">A quick view of the most recent records you can access.</div>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="p-3 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <AlertBanner
            severity="warning"
            message={error}
            actions={[{ label: "Retry", onClick: () => setReload((v) => v + 1) }]}
          />
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-[12px] font-medium text-gray-900">No activity yet</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Seed demo data, or create your first record to populate the timeline.
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((it) => (
              <a key={it.id} href={it.href} className="block rounded-xl border border-gray-100 hover:bg-gray-50 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-gray-900">{it.title}</div>
                    <div className="text-[11px] text-gray-500">{it.detail}</div>
                  </div>
                  <div className="shrink-0 font-mono text-[10px] text-gray-400">{formatDateTime(it.at)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

