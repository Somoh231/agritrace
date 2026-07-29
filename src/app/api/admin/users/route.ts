import { NextResponse } from "next/server";

import {
  canProvisionUsers,
  normalizeWorkEmail,
  validateProvisioningInput,
  type ProvisioningInput,
} from "@/lib/admin/user-provisioning";
import { parseJsonObject } from "@/lib/http/api-security";
import { apiHeaders } from "@/lib/http/api-response";
import { guardAdminApiRequest } from "@/lib/http/admin-api-guard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

const PROFILE_COLUMNS =
  "id,email,full_name,role,organization_id,county,district,clan_or_field_area,phone,is_active,account_status,employee_or_staff_id,job_title,department,invited_at,activated_at,deactivated_at,provisioned_by,created_at,updated_at";
const LEGACY_PROFILE_COLUMNS =
  "id,email,full_name,role,organization_id,county,district,phone,is_active,deactivated_at,created_at";
const HISTORY_ACTIONS = [
  "ACCOUNT_CREATED",
  "INVITATION_SENT",
  "INVITATION_RESENT",
  "PROFILE_COMPLETED",
  "ROLE_ASSIGNED",
  "ROLE_REMOVED",
  "GEOGRAPHIC_SCOPE_ASSIGNED",
  "GEOGRAPHIC_SCOPE_CHANGED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_DEACTIVATED",
  "PASSWORD_RESET_INITIATED",
  "ADMIN_PROVISIONING_FAILURE",
];

function isProvisioningSchemaUnavailable(error: { code?: string; message?: string } | null | undefined) {
  const code = error?.code?.toUpperCase();
  const message = error?.message?.toLowerCase() ?? "";
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    message.includes("profile_role_assignments") ||
    message.includes("clan_or_field_area") ||
    message.includes("account_status")
  );
}

function safeSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Use the deployment request origin when configuration is invalid.
    }
  }
  return new URL(request.url).origin;
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  email: string,
) {
  const users = await listAuthUsers(admin);
  return users.find((user) => normalizeWorkEmail(user.email ?? "") === email) ?? null;
}

async function listAuthUsers(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const users: any[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    users.push(...result.data.users);
    if (result.data.users.length < 200) break;
  }
  return users;
}

async function writeAudit(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  actorId: string,
  action: string,
  subjectId: string | null,
  requestId: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await admin.from("audit_log").insert({
    user_id: actorId,
    action,
    table_name: "profiles",
    record_id: subjectId,
    new_values: { request_id: requestId, ...metadata },
  } as any);
  if (error) throw error;
}

function safeFailure(
  message: string,
  status: number,
  headers: Record<string, string>,
) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function GET(request: Request) {
  const gate = await guardAdminApiRequest(request, "read");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const role = (url.searchParams.get("role") ?? "").trim() as UserRole | "";
  const active = (url.searchParams.get("active") ?? "").trim();
  const headers = apiHeaders(gate.ctx);

  try {
    const admin = getSupabaseAdminClient();
    const authUsers = await listAuthUsers(admin);

    const ids = authUsers.map((user) => user.id);
    if (!ids.length) return NextResponse.json({ users: [], schemaReady: true }, { headers });

    let schemaReady = true;
    const currentProfilesRes = await admin.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
    let profileRows: any[] = currentProfilesRes.data ?? [];
    let profileError = currentProfilesRes.error;
    if (profileError && isProvisioningSchemaUnavailable(profileError)) {
      schemaReady = false;
      const legacyProfilesRes = await admin.from("profiles").select(LEGACY_PROFILE_COLUMNS).in("id", ids);
      profileRows = legacyProfilesRes.data ?? [];
      profileError = legacyProfilesRes.error;
    }
    if (profileError) throw profileError;

    let assignments: any[] = [];
    let history: any[] = [];
    if (schemaReady) {
      const [assignmentRes, historyRes] = await Promise.all([
        admin
          .from("profile_role_assignments")
          .select("id,profile_id,role,is_primary,assigned_by,assigned_at,removed_at")
          .in("profile_id", ids)
          .is("removed_at", null),
        admin
          .from("audit_log")
          .select("id,user_id,action,record_id,new_values,created_at")
          .in("record_id", ids)
          .in("action", HISTORY_ACTIONS)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      if (assignmentRes.error) throw assignmentRes.error;
      if (historyRes.error) throw historyRes.error;
      assignments = assignmentRes.data ?? [];
      history = historyRes.data ?? [];
    }

    const profileById = new Map(profileRows.map((profile: any) => [profile.id, profile]));
    const merged = authUsers.map((user) => {
      const profile = profileById.get(user.id) as any;
      const roles = schemaReady
        ? assignments.filter((item) => item.profile_id === user.id)
        : profile
          ? [{ profile_id: user.id, role: profile.role, is_primary: true, assigned_at: profile.created_at }]
          : [];
      return {
        id: user.id,
        email: user.email ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        created_at: user.created_at,
        profile: profile
          ? {
              ...profile,
              account_status:
                profile.account_status ?? (profile.is_active === false ? "inactive" : "active"),
              clan_or_field_area: profile.clan_or_field_area ?? null,
            }
          : null,
        role_assignments: roles,
        access_history: history.filter((item) => item.record_id === user.id),
      };
    });

    const filtered = merged.filter((user) => {
      if (role && !user.role_assignments.some((assignment: any) => assignment.role === role)) return false;
      if (active === "true" && user.profile?.is_active === false) return false;
      if (active === "false" && user.profile?.is_active !== false) return false;
      if (q) {
        const haystack = `${user.email ?? ""} ${user.profile?.full_name ?? ""} ${
          user.profile?.employee_or_staff_id ?? ""
        } ${user.role_assignments.map((item: any) => item.role).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return NextResponse.json({ users: filtered, schemaReady }, { headers });
  } catch (error) {
    console.error("Admin workforce list failed", { requestId: gate.ctx.requestId, error });
    return safeFailure("Unable to load workforce users.", 500, headers);
  }
}

export async function POST(request: Request) {
  const gate = await guardAdminApiRequest(request, "mutation");
  if (!gate.ok) return gate.response;
  const headers = apiHeaders(gate.ctx);
  if (!canProvisionUsers(gate.role)) {
    return safeFailure("User-provisioning permission is required.", 403, headers);
  }

  const parsed = await parseJsonObject(request, 20_000);
  if (!parsed.ok) return safeFailure(parsed.error, parsed.status, headers);
  const validation = validateProvisioningInput(parsed.body as Partial<ProvisioningInput>, gate.role);
  if (!validation.ok) return safeFailure(validation.error, 400, headers);

  const admin = getSupabaseAdminClient();
  const preflight = await admin.from("profile_role_assignments").select("id", { head: true }).limit(1);
  if (preflight.error && isProvisioningSchemaUnavailable(preflight.error)) {
    return safeFailure(
      "Workforce provisioning is not enabled on this environment. Apply the approved workforce identity migration to staging first.",
      503,
      headers,
    );
  }
  if (preflight.error) return safeFailure("Unable to verify provisioning readiness.", 503, headers);

  const input = validation.value;
  let createdUserId: string | null = null;
  try {
    if (await findAuthUserByEmail(admin, input.email)) {
      return safeFailure("A user with this work email already exists.", 409, headers);
    }

    const redirectTo = `${safeSiteOrigin(request)}/auth/complete?mode=invite`;
    const invite = await admin.auth.admin.inviteUserByEmail(input.email, {
      redirectTo,
      data: { full_name: input.full_name, provisioned_by: gate.userId },
    });
    if (invite.error || !invite.data.user) throw invite.error ?? new Error("Invitation failed.");
    createdUserId = invite.data.user.id;

    const now = new Date().toISOString();
    const profilePatch = {
      email: input.email,
      full_name: input.full_name,
      role: input.primary_role,
      organization_id: input.organization_id,
      county: input.county,
      district: input.district,
      clan_or_field_area: input.clan_or_field_area,
      phone: input.phone,
      employee_or_staff_id: input.employee_or_staff_id,
      job_title: input.job_title,
      department: input.department,
      is_active: false,
      account_status: "invited",
      invited_at: now,
      activated_at: null,
      deactivated_at: null,
      provisioned_by: gate.userId,
    };
    const profileResult = await admin.from("profiles").update(profilePatch as any).eq("id", createdUserId);
    if (profileResult.error) throw profileResult.error;

    const roleResult = await admin.rpc("replace_workforce_role_assignments", {
      target_profile_id: createdUserId,
      assigned_roles: input.roles,
      selected_primary_role: input.primary_role,
      actor_profile_id: gate.userId,
      audit_request_id: gate.ctx.requestId,
    });
    if (roleResult.error) throw roleResult.error;

    await writeAudit(admin, gate.userId, "ACCOUNT_CREATED", createdUserId, gate.ctx.requestId);
    await writeAudit(admin, gate.userId, "INVITATION_SENT", createdUserId, gate.ctx.requestId);
    await writeAudit(admin, gate.userId, "PROFILE_COMPLETED", createdUserId, gate.ctx.requestId);
    await writeAudit(admin, gate.userId, "GEOGRAPHIC_SCOPE_ASSIGNED", createdUserId, gate.ctx.requestId, {
      county: input.county,
      district: input.district,
      clan_or_field_area: input.clan_or_field_area,
      organization_id: input.organization_id,
    });

    return NextResponse.json(
      {
        user: {
          id: createdUserId,
          email: input.email,
          account_status: "invited",
          roles: input.roles,
          primary_role: input.primary_role,
        },
      },
      { status: 201, headers },
    );
  } catch (error) {
    if (createdUserId) {
      const compensation = await admin.auth.admin.deleteUser(createdUserId);
      if (compensation.error) {
        console.error("Provisioning compensation failed", {
          requestId: gate.ctx.requestId,
          userId: createdUserId,
          error: compensation.error,
        });
      }
    }
    try {
      await writeAudit(admin, gate.userId, "ADMIN_PROVISIONING_FAILURE", createdUserId, gate.ctx.requestId, {
        compensated: Boolean(createdUserId),
      });
    } catch {
      // The primary failure remains logged server-side below.
    }
    console.error("Admin workforce provisioning failed", {
      requestId: gate.ctx.requestId,
      userId: createdUserId,
      error,
    });
    return safeFailure(
      "The account could not be provisioned. No operational access was granted.",
      500,
      headers,
    );
  }
}

export async function PATCH(request: Request) {
  const gate = await guardAdminApiRequest(request, "mutation");
  if (!gate.ok) return gate.response;
  const headers = apiHeaders(gate.ctx);
  if (!canProvisionUsers(gate.role)) {
    return safeFailure("User-provisioning permission is required.", 403, headers);
  }

  const parsed = await parseJsonObject(request, 20_000);
  if (!parsed.ok) return safeFailure(parsed.error, parsed.status, headers);
  const body = parsed.body as Partial<ProvisioningInput> & { userId?: string; is_active?: boolean };
  if (!body.userId) return safeFailure("Missing userId.", 400, headers);
  if (body.userId === gate.userId) {
    return safeFailure("Administrators cannot change their own roles or activation state.", 409, headers);
  }

  const admin = getSupabaseAdminClient();
  try {
    const [profileResult, authResult] = await Promise.all([
      admin.from("profiles").select(PROFILE_COLUMNS).eq("id", body.userId).maybeSingle(),
      admin.auth.admin.getUserById(body.userId),
    ]);
    if (profileResult.error && isProvisioningSchemaUnavailable(profileResult.error)) {
      return safeFailure(
        "Workforce provisioning is not enabled on this environment. Apply the approved workforce identity migration to staging first.",
        503,
        headers,
      );
    }
    if (profileResult.error || authResult.error || !profileResult.data || !authResult.data.user) {
      return safeFailure("User record not found.", 404, headers);
    }

    const currentProfile = profileResult.data as any;
    const validation = validateProvisioningInput(
      {
        ...body,
        email: authResult.data.user.email ?? currentProfile.email ?? "",
      },
      gate.role,
    );
    if (!validation.ok) return safeFailure(validation.error, 400, headers);
    const input = validation.value;
    if (body.is_active === true) {
      const unban = await admin.auth.admin.updateUserById(body.userId, { ban_duration: "none" });
      if (unban.error) throw unban.error;
    }

    const profilePatch = {
      full_name: input.full_name,
      organization_id: input.organization_id,
      county: input.county,
      district: input.district,
      clan_or_field_area: input.clan_or_field_area,
      phone: input.phone,
      employee_or_staff_id: input.employee_or_staff_id,
      job_title: input.job_title,
      department: input.department,
      ...(typeof body.is_active === "boolean"
        ? {
            is_active: body.is_active,
            account_status: body.is_active ? "active" : "inactive",
            activated_at: body.is_active ? currentProfile.activated_at ?? new Date().toISOString() : currentProfile.activated_at,
            deactivated_at: body.is_active ? null : new Date().toISOString(),
          }
        : {}),
    };
    const profileUpdate = await admin.from("profiles").update(profilePatch as any).eq("id", body.userId);
    if (profileUpdate.error) throw profileUpdate.error;

    const roleUpdate = await admin.rpc("replace_workforce_role_assignments", {
      target_profile_id: body.userId,
      assigned_roles: input.roles,
      selected_primary_role: input.primary_role,
      actor_profile_id: gate.userId,
      audit_request_id: gate.ctx.requestId,
    });
    if (roleUpdate.error) throw roleUpdate.error;

    if (body.is_active === false) {
      const ban = await admin.auth.admin.updateUserById(body.userId, { ban_duration: "876000h" });
      if (ban.error) {
        console.error("Auth ban failed after application deactivation", {
          requestId: gate.ctx.requestId,
          userId: body.userId,
          error: ban.error,
        });
      }
    }

    await writeAudit(admin, gate.userId, "GEOGRAPHIC_SCOPE_CHANGED", body.userId, gate.ctx.requestId, {
      county: input.county,
      district: input.district,
      clan_or_field_area: input.clan_or_field_area,
      organization_id: input.organization_id,
    });
    if (typeof body.is_active === "boolean") {
      await writeAudit(
        admin,
        gate.userId,
        body.is_active ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
        body.userId,
        gate.ctx.requestId,
      );
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Admin workforce update failed", {
      requestId: gate.ctx.requestId,
      userId: body.userId,
      error,
    });
    return safeFailure("The workforce user could not be updated.", 500, headers);
  }
}

export async function PUT(request: Request) {
  const gate = await guardAdminApiRequest(request, "mutation");
  if (!gate.ok) return gate.response;
  const headers = apiHeaders(gate.ctx);
  if (!canProvisionUsers(gate.role)) {
    return safeFailure("User-provisioning permission is required.", 403, headers);
  }

  const parsed = await parseJsonObject(request, 4_000);
  if (!parsed.ok) return safeFailure(parsed.error, parsed.status, headers);
  const body = parsed.body as { userId?: string; action?: "resend_invitation" | "password_reset" };
  if (!body.userId || !body.action) return safeFailure("Missing user action.", 400, headers);

  const admin = getSupabaseAdminClient();
  try {
    const [userResult, profileResult] = await Promise.all([
      admin.auth.admin.getUserById(body.userId),
      admin.from("profiles").select("account_status").eq("id", body.userId).maybeSingle(),
    ]);
    if (userResult.error || !userResult.data.user?.email || profileResult.error || !profileResult.data) {
      return safeFailure("User record not found.", 404, headers);
    }
    if (body.action === "resend_invitation" && (profileResult.data as any).account_status !== "invited") {
      return safeFailure("Only invited accounts can receive a replacement setup link.", 409, headers);
    }

    const redirectTo = `${safeSiteOrigin(request)}/auth/complete?mode=${
      body.action === "resend_invitation" ? "invite" : "recovery"
    }`;
    const reset = await admin.auth.resetPasswordForEmail(userResult.data.user.email, { redirectTo });
    if (reset.error) throw reset.error;

    await writeAudit(
      admin,
      gate.userId,
      body.action === "resend_invitation" ? "INVITATION_RESENT" : "PASSWORD_RESET_INITIATED",
      body.userId,
      gate.ctx.requestId,
    );
    if (body.action === "resend_invitation") {
      await admin.from("profiles").update({ invited_at: new Date().toISOString() } as any).eq("id", body.userId);
    }
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Admin workforce email action failed", {
      requestId: gate.ctx.requestId,
      userId: body.userId,
      action: body.action,
      error,
    });
    return safeFailure("The secure email action could not be initiated.", 500, headers);
  }
}
