import { NextResponse } from "next/server";

import {
  canAccessComplianceRoutes,
} from "@/lib/auth/workspace-access";
import {
  isDonorObserverRole,
  isMinistryNationalRole,
} from "@/lib/auth/operational-roles";
import { assessOperationalAccess } from "@/lib/auth/access-readiness";
import { API_ERROR_UNAUTHORIZED } from "@/lib/http/api-security";
import { resolveRequestId, withRequestIdHeader } from "@/lib/http/request-context";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

export type ApiSession = {
  userId: string;
  role: UserRole;
  profile: Profile;
  requestId: string;
};

export type ApiSessionResult =
  | { ok: true; session: ApiSession }
  | { ok: false; response: NextResponse };

function jsonAuthError(requestId: string, status: 401 | 403, message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: withRequestIdHeader({}, requestId) },
  );
}

/** Requires a valid Supabase session and profiles row. */
export async function requireApiSession(request: Request): Promise<ApiSessionResult> {
  const requestId = resolveRequestId(request);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, response: jsonAuthError(requestId, 401, API_ERROR_UNAUTHORIZED) };
    }

    let { data: profileRow, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,organization_id,county,district,clan_or_field_area,phone,is_active,account_status,created_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      const legacy = await supabase
        .from("profiles")
        .select("id,email,full_name,role,organization_id,county,district,phone,is_active,created_at")
        .eq("id", user.id)
        .maybeSingle();
      profileRow = legacy.data as typeof profileRow;
      error = legacy.error;
    }

    if (error || !profileRow) {
      return { ok: false, response: jsonAuthError(requestId, 403, "Forbidden") };
    }
    const roleResult = await supabase
      .from("profile_role_assignments")
      .select("role")
      .eq("profile_id", user.id)
      .is("removed_at", null);
    const assignedRoles =
      roleResult.error || !roleResult.data
        ? [profileRow.role as UserRole]
        : roleResult.data.map((item: { role: UserRole }) => item.role);
    const readiness = assessOperationalAccess(profileRow, assignedRoles);
    if (!readiness.ok) {
      return { ok: false, response: jsonAuthError(requestId, 403, "Forbidden") };
    }

    return {
      ok: true,
      session: {
        userId: user.id,
        role: readiness.role,
        profile: profileRow as Profile,
        requestId,
      },
    };
  } catch {
    return { ok: false, response: jsonAuthError(requestId, 401, API_ERROR_UNAUTHORIZED) };
  }
}

export type ReportExportKind = "compliance" | "donor" | "rice" | "dds" | "executive";

/** Role gates aligned with middleware / workspace-access conventions. */
export function canExportReport(role: UserRole, kind: ReportExportKind): boolean {
  switch (kind) {
    case "compliance":
    case "rice":
      return canAccessComplianceRoutes(role);
    case "donor":
      return isDonorObserverRole(role) || isMinistryNationalRole(role) || role === "auditor";
    case "dds":
      return (
        role === "exporter" ||
        role === "cooperative_manager" ||
        isMinistryNationalRole(role) ||
        role === "super_admin" ||
        role === "admin"
      );
    case "executive":
      return isMinistryNationalRole(role) || role === "auditor";
    default:
      return false;
  }
}

export function forbidReportExport(session: ApiSession, kind: ReportExportKind): NextResponse | null {
  if (!canExportReport(session.role, kind)) {
    return jsonAuthError(session.requestId, 403, "Forbidden");
  }
  return null;
}
