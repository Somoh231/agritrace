import { NextResponse } from "next/server";

import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { PUBLIC_POLICY } from "@/lib/http/rate-limit-policies";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ctx = await beginApiRequestAsync(request, PUBLIC_POLICY);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const canonical = {
    source: "canonical" as const,
    sourceDetail: "Public pilot canonical dataset; no live operational records are included.",
    counts: {
      fixtureFarmers: MINISTRY_FARMERS.length,
      fixtureWarehouses: MINISTRY_WAREHOUSES.length,
      fixtureDaoOfficers: MINISTRY_DAO_OFFICERS.length,
      fixtureOperationalEvents: MINISTRY_OPERATIONAL_EVENTS.length,
      fixtureCountyMetrics: MINISTRY_COUNTY_METRICS.length,
    },
    countyMetrics: MINISTRY_COUNTY_METRICS,
    recentEvents: MINISTRY_OPERATIONAL_EVENTS.slice(0, 14),
    daoOfficersSample: MINISTRY_DAO_OFFICERS.slice(0, 12),
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(canonical, { headers: apiHeaders(ctx, PUBLIC_POLICY) });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.is_active === false) {
      return NextResponse.json(canonical, { headers: apiHeaders(ctx, PUBLIC_POLICY) });
    }

    const [farmersRes, metricsRes, eventsRes, daoRes] = await Promise.all([
      supabase.from("farmers").select("id", { count: "exact", head: true }),
      supabase.from("pilot_county_metrics").select("*").limit(80),
      supabase.from("pilot_operational_events").select("*").order("occurred_at", { ascending: false }).limit(14),
      supabase.from("pilot_dao_officers").select("dao_code,full_name,county,district,compliance_score").limit(40),
    ]);

    const fallbacks = [
      metricsRes.error || !metricsRes.data?.length ? "county metrics" : null,
      eventsRes.error || !eventsRes.data?.length ? "operational events" : null,
      daoRes.error || !daoRes.data?.length ? "DAO officers" : null,
    ].filter(Boolean);

    return NextResponse.json({
      source: fallbacks.length ? "mixed" : "live",
      sourceDetail: fallbacks.length
        ? `Live RLS-governed summary with canonical pilot fallback for: ${fallbacks.join(", ")}.`
        : "Live RLS-governed Supabase summary.",
      authenticated: true,
      counts: {
        farmersTotal: farmersRes.count ?? null,
        countyMetricRows: metricsRes.data?.length ?? 0,
        operationalEventRows: eventsRes.data?.length ?? 0,
        daoOfficerRows: daoRes.data?.length ?? 0,
      },
      countyMetrics: metricsRes.error ? MINISTRY_COUNTY_METRICS : metricsRes.data ?? MINISTRY_COUNTY_METRICS,
      recentEvents:
        eventsRes.error || !eventsRes.data?.length
          ? canonical.recentEvents
          : eventsRes.data,
      daoOfficersSample:
        daoRes.error || !daoRes.data?.length ? canonical.daoOfficersSample : daoRes.data,
    }, { headers: apiHeaders(ctx, PUBLIC_POLICY) });
  } catch {
    return NextResponse.json(canonical, { headers: apiHeaders(ctx, PUBLIC_POLICY) });
  }
}
