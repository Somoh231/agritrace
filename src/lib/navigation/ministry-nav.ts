import type { UserRole } from "@/lib/supabase/types";

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
    id: "national-command",
    label: "National command",
    rolesDeny: [...DONOR_AUDITOR_DENY],
    items: [
      {
        label: "Command center",
        href: "/command-center",
        rolesDeny: ["county_officer", ...DAO_DENY, "warehouse_manager", ...DONOR_AUDITOR_DENY],
      },
      {
        label: "National overview",
        href: "/executive-briefing",
        rolesDeny: [...DAO_DENY, "warehouse_manager", ...DONOR_AUDITOR_DENY, "call_center_agent"],
      },
      { label: "Food security", href: "/food-security", rolesDeny: [...DONOR_AUDITOR_DENY] },
      {
        label: "National heat map",
        href: "/national-heat-map",
        rolesDeny: [...DONOR_AUDITOR_DENY],
      },
      { label: "Alerts & incidents", href: "/alerts", rolesDeny: [...DONOR_AUDITOR_DENY] },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    rolesDeny: [...DONOR_AUDITOR_DENY],
    items: [
      {
        label: "County operations",
        href: "/county-operations",
        rolesDeny: [...DAO_DENY],
      },
      {
        label: "District operations",
        href: "/district-dashboard",
        rolesAllow: [...DAO_WORKSPACE_ROLES, "county_officer", "ministry_officer", "government_officer", "super_admin", "admin"],
      },
      {
        label: "County dashboard",
        href: "/county-dashboard",
        rolesAllow: ["county_officer", "ministry_officer", "government_officer", "super_admin", "admin"],
      },
      {
        label: "DAO monitoring",
        href: "/field-agents",
        rolesDeny: [...DAO_DENY],
      },
      { label: "Field activity", href: "/field/mobile" },
      { label: "Inspection queue", href: "/field/inspections" },
    ],
  },
  {
    id: "farmer-system",
    label: "Farmer system",
    items: [
      { label: "Farmer registry", href: "/farmers", rolesDeny: ["donor_partner"] },
      { label: "Cooperatives", href: "/cooperatives", rolesDeny: [...DAO_DENY, "donor_partner"] },
      { label: "Farm profiles", href: "/farm-profiles", rolesDeny: ["donor_partner"] },
      { label: "Geo mapping", href: "/geo-registry" },
      { label: "Verification queue", href: "/verification-queue", rolesDeny: [...DONOR_AUDITOR_DENY] },
      {
        label: "Registration approvals",
        href: "/registration-approvals",
        rolesDeny: [...DONOR_AUDITOR_DENY, ...DAO_DENY],
      },
    ],
  },
  {
    id: "inventory",
    label: "Inputs & inventory",
    rolesDeny: ["donor_partner"],
    items: [
      { label: "National inventory", href: "/inventory", rolesDeny: ["auditor"] },
      { label: "Warehouses", href: "/operations/warehouses", rolesDeny: [...DAO_DENY, "auditor"] },
      { label: "Fertilizer", href: "/inventory/fertilizer", rolesDeny: ["auditor"] },
      { label: "Seed distribution", href: "/inventory/seed-distribution", rolesDeny: ["auditor"] },
      { label: "Equipment", href: "/inventory/equipment", rolesDeny: ["auditor"] },
      { label: "Donor shipments", href: "/inventory/donor-shipments", rolesDeny: [...DAO_DENY] },
      {
        label: "Stock movement",
        href: "/inventory/transfers",
        rolesDeny: [...DAO_DENY, "auditor"],
      },
    ],
  },
  {
    id: "subsidies",
    label: "Subsidies & programmes",
    rolesDeny: [...DONOR_AUDITOR_DENY],
    items: [
      {
        label: "Subsidy allocation",
        href: "/subsidies/allocation",
        rolesDeny: [...DAO_DENY, "auditor"],
      },
      {
        label: "Voucher management",
        href: "/subsidies/vouchers",
        rolesDeny: [...DAO_DENY, "auditor"],
      },
      { label: "Beneficiary verification", href: "/subsidies/verification" },
      { label: "Distribution tracking", href: "/subsidies/distribution" },
      {
        label: "Programme analytics",
        href: "/subsidies/analytics",
        rolesDeny: [...DAO_DENY, "call_center_agent"],
      },
    ],
  },
  {
    id: "production",
    label: "Production intelligence",
    rolesDeny: [...DONOR_AUDITOR_DENY],
    items: [
      { label: "Rice production", href: "/production/rice" },
      { label: "County dashboards", href: "/production/county", rolesDeny: DAO_DENY },
      {
        label: "Yield forecasting",
        href: "/production/forecasting",
        rolesDeny: [...DAO_DENY, "call_center_agent"],
      },
      { label: "Loss hotspots", href: "/production/loss-hotspots" },
      { label: "Market prices", href: "/production/market-prices" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance & reporting",
    items: [
      { label: "Ministry reports", href: "/reports/ministry" },
      { label: "Donor reports", href: "/reports/donor" },
      { label: "Audit logs", href: "/compliance/audit-log" },
      {
        label: "Compliance center",
        href: "/compliance/reports",
      },
      {
        label: "Distribution anomalies",
        href: "/compliance/anomalies",
        rolesDeny: DAO_DENY,
      },
      {
        label: "Procurement oversight",
        href: "/compliance/procurement",
        rolesDeny: [...DAO_DENY, "call_center_agent", "donor_partner"],
      },
    ],
  },
  {
    id: "traceability",
    label: "Commodity traceability",
    rolesDeny: ["donor_partner"],
    items: [
      { label: "Cocoa chain (EUDR)", href: "/cocoa/lots", rolesDeny: DAO_DENY },
      { label: "Rice programme detail", href: "/rice/production", rolesDeny: DAO_DENY },
    ],
  },
];

export function ministryNavForRole(role: UserRole): MinistryNavSection[] {
  return MINISTRY_NAV.filter((s) => sectionVisible(role, s))
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => itemVisible(role, i)),
    }))
    .filter((s) => s.items.length > 0);
}

/** Longest href match wins */
export function ministryBreadcrumb(pathname: string): { kicker: string; title: string } {
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
