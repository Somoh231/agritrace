import { NextResponse } from "next/server";

import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const canonical = {
    source: "canonical" as const,
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
      return NextResponse.json(canonical);
    }

    const [farmersRes, metricsRes, eventsRes, daoRes] = await Promise.all([
      supabase.from("farmers").select("id", { count: "exact", head: true }),
      supabase.from("pilot_county_metrics").select("*").limit(80),
      supabase.from("pilot_operational_events").select("*").order("occurred_at", { ascending: false }).limit(14),
      supabase.from("pilot_dao_officers").select("dao_code,full_name,county,district,compliance_score").limit(40),
    ]);

    return NextResponse.json({
      source: "live",
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
    });
  } catch {
    return NextResponse.json(canonical);
  }
}
