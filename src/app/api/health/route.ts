import { NextResponse } from "next/server";

import { appEnvironment, type AppEnvironment } from "@/lib/env/app-env";
import { REQUEST_ID_HEADER, resolveRequestId, withRequestIdHeader } from "@/lib/http/request-context";
import { normalizeHttpUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "degraded" | "error";

type HealthPayload = {
  status: CheckStatus;
  service: "agrivault";
  /** Deployment label only: never a project ref, URL or key. */
  environment: AppEnvironment;
  timestamp: string;
  checks: {
    app: CheckStatus;
    supabase_config: CheckStatus;
    supabase_reachable: CheckStatus;
    mapbox_config: CheckStatus;
  };
  requestId: string;
};

export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  const timestamp = new Date().toISOString();

  const supabaseUrl = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  const supabaseConfig: CheckStatus = supabaseUrl && anonKey ? "ok" : "error";

  let supabaseReachable: CheckStatus = "degraded";
  if (supabaseConfig === "ok" && supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        method: "GET",
        headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      supabaseReachable = res.ok ? "ok" : "degraded";
    } catch {
      supabaseReachable = "degraded";
    }
  } else {
    supabaseReachable = "error";
  }

  const mapboxConfig: CheckStatus = mapbox ? "ok" : "degraded";

  const checks = {
    app: "ok" as const,
    supabase_config: supabaseConfig,
    supabase_reachable: supabaseReachable,
    mapbox_config: mapboxConfig,
  };

  const overall: CheckStatus =
    checks.supabase_config === "error" ? "error" : checks.supabase_reachable === "error" ? "degraded" : "ok";

  const body: HealthPayload = {
    status: overall,
    service: "agrivault",
    environment: appEnvironment(),
    timestamp,
    checks,
    requestId,
  };

  const httpStatus = overall === "error" ? 503 : 200;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: withRequestIdHeader(
      {
        "Cache-Control": "no-store",
        [REQUEST_ID_HEADER]: requestId,
      },
      requestId,
    ),
  });
}
