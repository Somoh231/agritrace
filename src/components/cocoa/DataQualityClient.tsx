"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ScoreBreakdown = {
  missing_gps_farmers: number;
  missing_farmer_id: number;
  unresolved_discrepancies: number;
  incomplete_movements: number;
  expired_compliance: number;
};

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

export default function DataQualityClient() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [breakdown, setBreakdown] = React.useState<ScoreBreakdown | null>(null);
  const [score, setScore] = React.useState<number>(0);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const messages: string[] = [];

    const { count: fc, error: fcErr } = await supabase
      .from("farmers")
      .select("id", { count: "exact", head: true })
      .or("latitude.is.null,longitude.is.null");
    if (fcErr) messages.push(`GPS count: ${fcErr.message}`);

    const [{ count: nNull }, { count: nEmpty }] = await Promise.all([
      supabase.from("farmers").select("id", { count: "exact", head: true }).is("national_id", null),
      supabase.from("farmers").select("id", { count: "exact", head: true }).eq("national_id", ""),
    ]);
    const missingId = (nNull ?? 0) + (nEmpty ?? 0);

    const { data: discRows, error: discErr } = await supabase
      .from("discrepancy_issues")
      .select("id")
      .neq("status", "resolved")
      .limit(500);
    if (discErr && !String(discErr.message).includes("does not exist") && discErr.code !== "42P01") {
      messages.push(`Discrepancies: ${discErr.message}`);
    }

    const { count: inc, error: movErr } = await supabase
      .from("movements")
      .select("id", { count: "exact", head: true })
      .in("status", ["dispatched", "in_transit"])
      .is("received_at", null);
    if (movErr) messages.push(`Movements: ${movErr.message}`);

    const { data: compRows, error: compErr } = await supabase
      .from("compliance_records")
      .select("id,expiry_date")
      .not("expiry_date", "is", null)
      .limit(500);
    if (compErr && !String(compErr.message).includes("does not exist") && compErr.code !== "42P01") {
      messages.push(`Compliance: ${compErr.message}`);
    }

    const today = new Date().toISOString().slice(0, 10);
    const expired =
      (compRows as any[])?.filter((c) => c.expiry_date && String(c.expiry_date) < today).length ?? 0;

    const bd: ScoreBreakdown = {
      missing_gps_farmers: fc ?? 0,
      missing_farmer_id: missingId,
      unresolved_discrepancies: discErr ? 0 : discRows?.length ?? 0,
      incomplete_movements: inc ?? 0,
      expired_compliance: expired,
    };
    setBreakdown(bd);

    const penalty =
      bd.missing_gps_farmers * 2 +
      bd.missing_farmer_id * 2 +
      bd.unresolved_discrepancies * 5 +
      bd.incomplete_movements * 3 +
      bd.expired_compliance * 4;
    setScore(clamp100(100 - Math.min(80, penalty)));

    if (messages.length) setError(messages.join(" · "));
    else setError(null);

    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const onPrimary = () => load();
    window.addEventListener("agritrace-primary-action", onPrimary);
    return () => window.removeEventListener("agritrace-primary-action", onPrimary);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
        <div>
          <div className="font-display text-[16px] text-gray-900">Data quality score</div>
          <div className="text-[12px] text-gray-500">
            Pilot heuristic: penalties for missing identifiers, open discrepancies, incomplete custody, expired checks.
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? <AlertBanner severity="warning" message={error} actions={[{ label: "Retry", onClick: load }]} /> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Computing…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Score</div>
              <div className="mt-2 font-display text-5xl text-gray-900">{score}</div>
              <div className="mt-1 text-[11px] text-gray-500">out of 100</div>
            </div>
            <div className="space-y-2 text-[12px] text-gray-700">
              <Row label="Farmers missing GPS" value={breakdown?.missing_gps_farmers ?? 0} />
              <Row label="Farmers missing national ID" value={breakdown?.missing_farmer_id ?? 0} />
              <Row label="Unresolved discrepancies" value={breakdown?.unresolved_discrepancies ?? 0} />
              <Row label="Incomplete movements (no receipt)" value={breakdown?.incomplete_movements ?? 0} />
              <Row label="Expired compliance records" value={breakdown?.expired_compliance ?? 0} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
      <span>{label}</span>
      <span className="font-mono text-amber-800">{value}</span>
    </div>
  );
}
