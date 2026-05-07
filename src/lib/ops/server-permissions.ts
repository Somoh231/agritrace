import type { OperationalActor } from "@/lib/ops/permissions";
import { resolveOperationalActor } from "@/lib/ops/current-actor";
import type { Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkflowAuthFailureCode =
  | "unauthorized"
  | "missing_profile"
  | "configuration_error";

export type WorkflowAuthFailure = {
  ok: false;
  status: 401 | 403 | 500;
  code: WorkflowAuthFailureCode;
  message: string;
};

export type WorkflowPrincipal = {
  ok: true;
  supabase: SupabaseClient;
  userId: string;
  profile: Profile;
  actor: OperationalActor;
};

/** Preflight for desks that require county (or equivalent) on the profile — mirrors future RLS assumptions. */
export function workflowScopeFailure(actor: OperationalActor): { code: "missing_scope"; message: string } | null {
  if (actor.role === "national_admin" || actor.role === "donor_observer") return null;
  if (actor.role === "county_supervisor" || actor.role === "dao_officer") {
    if (!actor.county?.trim()) {
      return {
        code: "missing_scope",
        message: "County assignment is required on the operator profile for this workflow desk.",
      };
    }
  }
  if (actor.role === "warehouse_manager") {
    if (!actor.county?.trim()) {
      return {
        code: "missing_scope",
        message: "County assignment is required for warehouse custody workflows.",
      };
    }
  }
  return null;
}

/**
 * Loads the authenticated Supabase session and profile row — server-only source of truth for operational scope.
 * Never derive permissions from client-supplied role or county.
 */
export async function requireWorkflowPrincipal(): Promise<WorkflowPrincipal | WorkflowAuthFailure> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user?.id) {
      return {
        ok: false,
        status: 401,
        code: "unauthorized",
        message: "Authentication required for ministry workflow mutations.",
      };
    }

    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,organization_id,county,district,phone,is_active,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profileRow) {
      console.error("[workflow] Profile lookup failed", profileErr?.message ?? "no row");
      return {
        ok: false,
        status: 403,
        code: "missing_profile",
        message: "Operator profile is missing — ministry workflows cannot be attributed.",
      };
    }

    const profile = profileRow as Profile;
    const actor = resolveOperationalActor(profile);

    return { ok: true, supabase, userId: user.id, profile, actor };
  } catch (e) {
    console.error("[workflow] Principal resolution error", e instanceof Error ? e.message : e);
    return {
      ok: false,
      status: 500,
      code: "configuration_error",
      message: e instanceof Error ? e.message : "Server configuration error.",
    };
  }
}
