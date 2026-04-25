"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FarmerHit = { id: string; full_name: string; county: string; national_id: string | null };
type LotHit = { id: string; lot_code: string; status: string; commodity: string };
type ReportHit = { id: string; report_code: string; title: string; status: string };

export default function SearchClient() {
  const search = useSearchParams();
  const q = (search.get("q") ?? "").trim();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [farmers, setFarmers] = React.useState<FarmerHit[]>([]);
  const [lots, setLots] = React.useState<LotHit[]>([]);
  const [reports, setReports] = React.useState<ReportHit[]>([]);
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    if (!q) return;
    let cancelled = false;
    (async () => {
      setError(null);
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const like = `%${q}%`;

        const [f, l, r] = await Promise.all([
          supabase
            .from("farmers")
            .select("id,full_name,county,national_id")
            .or(`full_name.ilike.${like},national_id.ilike.${like}`)
            .limit(8),
          supabase
            .from("lots")
            .select("id,lot_code,status,commodity")
            .ilike("lot_code", like)
            .limit(8),
          supabase
            .from("reports")
            .select("id,report_code,title,status")
            .or(`report_code.ilike.${like},title.ilike.${like}`)
            .limit(8),
        ]);

        if (cancelled) return;
        if (f.error && l.error && r.error) {
          setError(
            `No results available for your current access. (${[f.error?.message, l.error?.message, r.error?.message]
              .filter(Boolean)
              .join(" · ")})`,
          );
          return;
        }
        setFarmers((f.data ?? []) as FarmerHit[]);
        setLots((l.data ?? []) as LotHit[]);
        setReports((r.data ?? []) as ReportHit[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, reload]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg text-gray-900">Search</div>
            <div className="mt-1 text-[12px] text-gray-600">
              Query across farmers, lots, and reports (scoped by your role and organization).
            </div>
          </div>
          <div className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-2 text-[12px] text-gray-600">
            <Search className="h-4 w-4" />
            <span className="font-mono">{q || "—"}</span>
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <AlertBanner
              severity="warning"
              message={error}
              actions={[{ label: "Retry", onClick: () => setReload((v) => v + 1) }]}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </div>
        ) : q ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <ResultCard title="Farmers" empty="No matching farmers." items={farmers} render={(f) => (
              <a key={f.id} href="/cocoa/farmers" className="block rounded-lg border border-gray-100 hover:bg-gray-50 px-3 py-2">
                <div className="text-[12px] font-medium text-gray-900">{f.full_name}</div>
                <div className="text-[11px] text-gray-500">{f.county}{f.national_id ? ` · ${f.national_id}` : ""}</div>
              </a>
            )} />

            <ResultCard title="Lots" empty="No matching lots." items={lots} render={(l) => (
              <a key={l.id} href="/cocoa/lots" className="block rounded-lg border border-gray-100 hover:bg-gray-50 px-3 py-2">
                <div className="text-[12px] font-medium text-gray-900">{l.lot_code}</div>
                <div className="text-[11px] text-gray-500">{l.commodity} · {l.status}</div>
              </a>
            )} />

            <ResultCard title="Reports" empty="No matching reports." items={reports} render={(r) => (
              <a key={r.id} href="/rice/reports" className="block rounded-lg border border-gray-100 hover:bg-gray-50 px-3 py-2">
                <div className="text-[12px] font-medium text-gray-900">{r.title}</div>
                <div className="text-[11px] text-gray-500">{r.report_code} · {r.status}</div>
              </a>
            )} />
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
            <div className="text-[12px] font-medium text-gray-900">Type in the top search bar</div>
            <div className="mt-1 text-[11px] text-gray-600">
              Example: <span className="font-mono">Nimba</span>,{" "}
              <span className="font-mono">LIB-COC</span>,{" "}
              <span className="font-mono">RPT-MOA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard<T>({
  title,
  empty,
  items,
  render,
}: {
  title: string;
  empty: string;
  items: T[];
  render: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-[12px] font-medium text-gray-900">{title}</div>
      </div>
      <div className="p-2 space-y-1">
        {items.length === 0 ? (
          <div className="p-3 text-[11px] text-gray-500">{empty}</div>
        ) : (
          items.map((x) => render(x))
        )}
      </div>
    </div>
  );
}

