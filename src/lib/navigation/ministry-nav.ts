import type { UserRole } from "@/lib/supabase/types";

import {
  CAC_COUNTY_ROLES,
  CLAN_FIELD_ROLES,
  DAO_DISTRICT_ROLES,
  DONOR_VISIBILITY_ROLES,
  MINISTRY_NATIONAL_ROLES,
} from "@/lib/auth/operational-roles";

/** Safe default when profile.role is missing or invalid (matches ministry-wide read posture). */
export const MINISTRY_NAV_FALLBACK_ROLE: UserRole = "ministry_officer";

const KNOWN_ROLES_SET = new Set<UserRole>([
  "super_admin",
  "admin",
  "ministry_admin",
  "ministry_officer",
  "government_officer",
  "county_agriculture_coordinator",
  "county_officer",
  "dao_officer",
  "district_officer",
  "clan_technician",
  "cooperative_manager",
  "field_agent",
  "warehouse_manager",
  "donor_observer",
  "donor_partner",
  "exporter",
  "call_center_agent",
  "auditor",
]);

export function normalizeMinistryNavRole(role: UserRole | null | undefined): UserRole {
  if (role != null && KNOWN_ROLES_SET.has(role)) return role;
  return MINISTRY_NAV_FALLBACK_ROLE;
}

export type MinistryNavItem = {
  label: string;
  href: string;
  rolesDeny?: UserRole[];
  rolesAllow?: UserRole[];
};

export type MinistryNavSection = {
  id: string;
  label: string;
  items: MinistryNavItem[];
  rolesDeny?: UserRole[];
  rolesAllow?: UserRole[];
};

function denied(role: UserRole, list?: UserRole[]) {
  return list?.includes(role) ?? false;
}

function itemVisible(role: UserRole, item: MinistryNavItem): boolean {
  if (item.rolesAllow?.length && !item.rolesAllow.includes(role)) return false;
  if (denied(role, item.rolesDeny)) return false;
  return true;
}

function sectionVisible(role: UserRole, section: MinistryNavSection): boolean {
  if (section.rolesAllow?.length && !section.rolesAllow.includes(role)) return false;
  if (denied(role, section.rolesDeny)) return false;
  return true;
}

/** District-facing DAO workspace roles (includes CLAN technicians using DAO tools). */
export const DAO_WORKSPACE_ROLES: UserRole[] = [...DAO_DISTRICT_ROLES, ...CLAN_FIELD_ROLES];

const DAO_DENY: UserRole[] = [...DAO_WORKSPACE_ROLES];

/** Read-mostly external stakeholders */
const DONOR_AUDITOR_DENY: UserRole[] = [...DONOR_VISIBILITY_ROLES, "auditor"];

export const MINISTRY_NAV: MinistryNavSection[] = [
  {
    id: "operational-workspaces",
    label: "Operational workspaces",
    items: [
      {
        label: "CLAN workspace",
        href: "/workspace/clan",
        rolesAllow: [...CLAN_FIELD_ROLES, ...DAO_DISTRICT_ROLES, ...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
      },
      {
        label: "DAO workspace",
        href: "/workspace/dao",
        rolesAllow: [...CLAN_FIELD_ROLES, ...DAO_DISTRICT_ROLES, ...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
      },
      {
        label: "CAC workspace",
        href: "/workspace/cac",
        rolesAllow: [...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
      },
      { label: "Ministry workspace", href: "/workspace/ministry", rolesAllow: [...MINISTRY_NATIONAL_ROLES] },
    ],
  },
  {
    id: "national-overview",
    label: "National Overview",
    items: [
      { label: "Command Center", href: "/command-center", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "National Operations", href: "/national-operations", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "National Heat Map", href: "/national-heat-map", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    items: [
      { label: "DAO & CAC reports", href: "/reporting" },
      { label: "Pending Verifications", href: "/verification-queue", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Escalations", href: "/alerts", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Reporting Analytics", href: "/reports", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "county-operations",
    label: "County Operations",
    items: [
      {
        label: "County Dashboard",
        href: "/county-dashboard",
        rolesAllow: [...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
        rolesDeny: [...DONOR_AUDITOR_DENY],
      },
      { label: "DAO Monitoring", href: "/field-agents", rolesDeny: [...DAO_DENY, ...DONOR_AUDITOR_DENY] },
      { label: "Inspection Queue", href: "/field/inspections", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "pilot-gis",
    label: "Pilot GIS",
    items: [
      {
        label: "Farm boundary capture",
        href: "/field/boundary-capture",
        rolesAllow: [...DAO_WORKSPACE_ROLES, ...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
        rolesDeny: [...DONOR_AUDITOR_DENY],
      },
      {
        label: "Geo registry",
        href: "/geo-registry",
        rolesAllow: [...DAO_WORKSPACE_ROLES, ...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
        rolesDeny: [...DONOR_AUDITOR_DENY],
      },
      {
        label: "Operational map",
        href: "/map",
        rolesAllow: [...DAO_WORKSPACE_ROLES, ...CAC_COUNTY_ROLES, ...MINISTRY_NATIONAL_ROLES],
        rolesDeny: [...DONOR_AUDITOR_DENY],
      },
    ],
  },
  {
    id: "warehouses-logistics",
    label: "Warehouses & Logistics",
    items: [
      { label: "Warehouse Command", href: "/logistics", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Transfers", href: "/transfers", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Inventory", href: "/inventory", rolesDeny: ["donor_partner", "donor_observer"] },
    ],
  },
  {
    id: "food-security",
    label: "Food Security",
    items: [
      { label: "Food Security Dashboard", href: "/food-security", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Alerts", href: "/alerts", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "farmers",
    label: "Farmers",
    items: [
      { label: "Farmer Registry", href: "/farmers", rolesDeny: ["donor_partner", "donor_observer"] },
      { label: "Cooperatives", href: "/cooperatives", rolesDeny: ["donor_partner", "donor_observer"] },
      { label: "Farm Profiles", href: "/farm-profiles", rolesDeny: ["donor_partner", "donor_observer"] },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { label: "Users & Roles", href: "/admin/users", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Audit Logs", href: "/compliance/audit-log", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Compliance", href: "/compliance", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "System Settings", href: "/admin/settings", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
];

export function ministryNavForRole(role: UserRole | null | undefined): MinistryNavSection[] {
  const r = normalizeMinistryNavRole(role);
  return MINISTRY_NAV.filter((s) => sectionVisible(r, s))
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => itemVisible(r, i)),
    }))
    .filter((s) => s.items.length > 0);
}

/** Longest href match wins */
export function ministryBreadcrumb(pathname: string): { kicker: string; title: string } {
  if (pathname === "/reporting") return { kicker: "Reporting", title: "DAO & CAC reports" };
  if (pathname === "/reporting/workspace") return { kicker: "Reporting", title: "DAO & CAC reports" };
  if (pathname === "/logistics") return { kicker: "Warehouses & Logistics", title: "Warehouse command" };
  if (pathname === "/compliance") return { kicker: "Administration", title: "Compliance" };
  if (pathname === "/reports") return { kicker: "Reporting", title: "Ministry reports center" };
  if (pathname.startsWith("/national-heat-map")) return { kicker: "National command", title: "National heat map" };
  if (pathname.startsWith("/farm-profiles")) return { kicker: "Farmer system", title: "Farm profiles" };
  if (pathname.startsWith("/inventory/equipment")) return { kicker: "Inputs & inventory", title: "Equipment" };
  if (pathname.startsWith("/production/market-prices")) return { kicker: "Production intelligence", title: "Market prices" };
  if (pathname.startsWith("/inventory/warehouse/")) return { kicker: "Inputs & inventory", title: "Warehouse detail" };
  if (pathname.startsWith("/admin/users")) return { kicker: "Administration", title: "Users & roles" };
  if (pathname.startsWith("/admin/system")) return { kicker: "Administration", title: "System diagnostics" };
  if (pathname.startsWith("/admin/governance")) return { kicker: "Administration", title: "Permissions" };
  if (pathname.startsWith("/workspace/clan")) return { kicker: "Operational workspaces", title: "CLAN workspace" };
  if (pathname.startsWith("/workspace/dao")) return { kicker: "Operational workspaces", title: "DAO workspace" };
  if (pathname.startsWith("/workspace/cac")) return { kicker: "Operational workspaces", title: "CAC workspace" };
  if (pathname.startsWith("/workspace/ministry")) return { kicker: "Operational workspaces", title: "Ministry workspace" };
  if (pathname.startsWith("/county-dashboard")) return { kicker: "Operations", title: "County dashboard" };
  if (pathname.startsWith("/district-dashboard")) return { kicker: "Operations", title: "District operations" };
  if (pathname.startsWith("/field/boundary-capture")) return { kicker: "Pilot GIS", title: "Farm boundary capture" };
  if (pathname.startsWith("/geo-registry")) return { kicker: "Pilot GIS", title: "Geo registry" };
  if (pathname.startsWith("/map")) return { kicker: "Pilot GIS", title: "Operational map" };

  let best = { href: "", section: "AIS", label: "Workspace" };
  for (const sec of MINISTRY_NAV) {
    for (const item of sec.items) {
      if (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))) {
        if (item.href.length >= best.href.length) best = { href: item.href, section: sec.label, label: item.label };
      }
    }
  }
  if (!best.href && pathname.startsWith("/admin")) {
    return { kicker: "Administration", title: "Console" };
  }
  return { kicker: best.section, title: best.label };
}

export function collectNavHrefs(): string[] {
  const h: string[] = [];
  for (const s of MINISTRY_NAV) for (const i of s.items) h.push(i.href);
  return h;
}
