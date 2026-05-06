"use client";

import * as React from "react";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { OpsMetric } from "@/components/pilot/pilot-ui";

export default function ExecutiveBriefingClient() {
  const [farmers, setFarmers] = React.useState<number | null>(null);
  const [counties, setCounties] = React.useState<number | null>(null);
  const [riceKg, setRiceKg] = React.useState<number | null>(null);
  const [risk, setRisk] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [fc, cc, rice, fs] = await Promise.all([
          supabase.from("farmers").select("id", { count: "exact", head: true }),
          supabase.from("counties").select("id", { count: "exact", head: true }),
          supabase.from("rice_production_records").select("actual_yield_kg"),
          supabase.from("food_security_indicators").select("national_risk_score").limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        setFarmers(fc.count ?? 0);
        setCounties(cc.count ?? 0);
        const kg = ((rice.data ?? []) as any[]).reduce((s, r) => s + Number(r.actual_yield_kg ?? 0), 0);
        setRiceKg(kg);
        setRisk(fs.data?.national_risk_score ?? null);
      } catch {
        if (!cancelled) {
          setFarmers(null);
          setCounties(null);
          setRiceKg(null);
          setRisk(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MinistryPageShell
      title="Executive briefing"
      description="Consolidated ministry posture synthesized from live registry and intelligence tables."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
        <OpsMetric
          label="Farmers registered"
          value={farmers != null ? Intl.NumberFormat().format(farmers) : "—"}
          tone="forest"
        />
        <OpsMetric label="Counties onboarded" value={counties != null ? String(counties) : "—"} tone="navy" />
        <OpsMetric
          label="Rice production booked (kg)"
          value={riceKg != null ? Intl.NumberFormat().format(Math.round(riceKg)) : "—"}
          tone="forest"
        />
        <OpsMetric label="Food security risk score" value={risk != null ? String(risk) : "—"} tone="amber" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-700/60 bg-slate-900/30 px-5 py-4 text-[13px] text-slate-400 leading-relaxed">
        <p>
          This briefing pulls directly from Supabase operational tables. Empty values indicate RLS restrictions or tables awaiting
          seed data.
        </p>
      </div>
    </MinistryPageShell>
  );
}
