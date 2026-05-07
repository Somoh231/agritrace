import type { UserRole } from "@/lib/supabase/types";

/** Safe default when profile.role is missing or invalid (matches ministry-wide read posture). */
export const MINISTRY_NAV_FALLBACK_ROLE: UserRole = "ministry_officer";

const KNOWN_ROLES_SET = new Set<UserRole>([
  "super_admin",
  "admin",
  "ministry_officer",
  "government_officer",
  "county_officer",
  "district_officer",
  "cooperative_manager",
  "field_agent",
  "warehouse_manager",
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

/** District-facing DAO workspace roles */
export const DAO_WORKSPACE_ROLES: UserRole[] = ["district_officer", "field_agent"];

const DAO_DENY: UserRole[] = [...DAO_WORKSPACE_ROLES];

/** Read-mostly external stakeholders */
const DONOR_AUDITOR_DENY: UserRole[] = ["donor_partner", "auditor"];

export const MINISTRY_NAV: MinistryNavSection[] = [
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
      { label: "DAO & CAO Reports", href: "/reporting" },
      { label: "Pending Verifications", href: "/verification-queue", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Escalations", href: "/alerts", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Reporting Analytics", href: "/reports", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "county-operations",
    label: "County Operations",
    items: [
      { label: "County Dashboard", href: "/county-dashboard", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "DAO Monitoring", href: "/field-agents", rolesDeny: [...DAO_DENY, ...DONOR_AUDITOR_DENY] },
      { label: "Inspection Queue", href: "/field/inspections", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "warehouses-logistics",
    label: "Warehouses & Logistics",
    items: [
      { label: "Warehouse Command", href: "/logistics", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Transfers", href: "/transfers", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Inventory", href: "/inventory", rolesDeny: ["donor_partner"] },
    ],
  },
  {
    id: "food-security",
    label: "Food Security",
    items: [
      { label: "National Heat Map", href: "/national-heat-map", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Food Security Dashboard", href: "/food-security", rolesDeny: [...DONOR_AUDITOR_DENY] },
      { label: "Alerts", href: "/alerts", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "farmers",
    label: "Farmers",
    items: [
      { label: "Farmer Registry", href: "/farmers", rolesDeny: ["donor_partner"] },
      { label: "Cooperatives", href: "/cooperatives", rolesDeny: ["donor_partner"] },
      { label: "Farm Profiles", href: "/farm-profiles", rolesDeny: ["donor_partner"] },
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
  if (pathname === "/reporting") return { kicker: "Reporting", title: "DAO & CAO reports" };
  if (pathname === "/reporting/workspace") return { kicker: "Reporting", title: "DAO & CAO reports" };
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
  if (pathname.startsWith("/county-dashboard")) return { kicker: "Operations", title: "County dashboard" };
  if (pathname.startsWith("/district-dashboard")) return { kicker: "Operations", title: "District operations" };

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
