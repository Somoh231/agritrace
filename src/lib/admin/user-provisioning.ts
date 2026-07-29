import {
  roleRequiresClanOrFieldArea,
  roleRequiresCounty,
  roleRequiresDistrict,
} from "@/lib/auth/access-readiness";
import type { UserRole } from "@/lib/supabase/types";

export const PROVISIONABLE_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "ministry_admin",
  "ministry_officer",
  "county_agriculture_coordinator",
  "dao_officer",
  "clan_technician",
  "warehouse_manager",
  "auditor",
  "donor_observer",
  "exporter",
  "cooperative_manager",
  "call_center_agent",
];

const ROLE_SET = new Set<UserRole>(PROVISIONABLE_ROLES);
const PROVISIONER_ROLES = new Set<UserRole>(["super_admin", "admin", "ministry_admin"]);
const SYSTEM_ADMIN_ROLES = new Set<UserRole>(["super_admin", "admin"]);

export type ProvisioningInput = {
  email: string;
  full_name: string;
  roles: UserRole[];
  primary_role: UserRole;
  organization_id: string;
  phone?: string | null;
  employee_or_staff_id?: string | null;
  job_title?: string | null;
  department?: string | null;
  county?: string | null;
  district?: string | null;
  clan_or_field_area?: string | null;
};

export type ProvisioningValidation =
  | { ok: true; value: ProvisioningInput }
  | { ok: false; error: string };

export function normalizeWorkEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function canProvisionUsers(role: UserRole): boolean {
  return PROVISIONER_ROLES.has(role);
}

export function canAssignProvisionedRole(actorRole: UserRole, assignedRole: UserRole): boolean {
  if (!canProvisionUsers(actorRole)) return false;
  if (assignedRole === "super_admin" || assignedRole === "admin") {
    return actorRole === "super_admin";
  }
  if (assignedRole === "ministry_admin") return SYSTEM_ADMIN_ROLES.has(actorRole);
  return ROLE_SET.has(assignedRole);
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

export function validateProvisioningInput(
  input: Partial<ProvisioningInput>,
  actorRole: UserRole,
): ProvisioningValidation {
  const email = normalizeWorkEmail(String(input.email ?? ""));
  const fullName = String(input.full_name ?? "").trim();
  const organizationId = String(input.organization_id ?? "").trim();
  const roles = [...new Set(Array.isArray(input.roles) ? input.roles : [])];
  const primaryRole = input.primary_role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid work email address." };
  }
  if (fullName.length < 2 || fullName.length > 160) {
    return { ok: false, error: "Full name must be between 2 and 160 characters." };
  }
  if (!organizationId) {
    return { ok: false, error: "An organization or Ministry unit is required." };
  }
  if (!roles.length || !primaryRole || !roles.includes(primaryRole)) {
    return { ok: false, error: "Select at least one role and an explicit primary role." };
  }
  if (roles.some((role) => !ROLE_SET.has(role) || !canAssignProvisionedRole(actorRole, role))) {
    return { ok: false, error: "You are not permitted to assign one or more selected roles." };
  }

  const county = optionalText(input.county, 120);
  const district = optionalText(input.district, 160);
  const clanOrFieldArea = optionalText(input.clan_or_field_area, 160);
  if (roles.some(roleRequiresCounty) && !county) {
    return { ok: false, error: "County assignment is required for the selected role." };
  }
  if (roles.some(roleRequiresDistrict) && !district) {
    return { ok: false, error: "District assignment is required for the selected role." };
  }
  if (roles.some(roleRequiresClanOrFieldArea) && !clanOrFieldArea) {
    return { ok: false, error: "Clan or field-area assignment is required for the selected role." };
  }

  return {
    ok: true,
    value: {
      email,
      full_name: fullName,
      roles,
      primary_role: primaryRole,
      organization_id: organizationId,
      phone: optionalText(input.phone, 40),
      employee_or_staff_id: optionalText(input.employee_or_staff_id, 80),
      job_title: optionalText(input.job_title, 120),
      department: optionalText(input.department, 120),
      county,
      district,
      clan_or_field_area: clanOrFieldArea,
    },
  };
}
