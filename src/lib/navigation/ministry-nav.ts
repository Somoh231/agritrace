import type { UserRole } from "@/lib/supabase/types";

export type MinistryNavItem = {
  label: string;
  href: string;
  /** Hide this link for these roles */
  rolesDeny?: UserRole[];
  /** When set, only these roles see the link */
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

const DAO_ROLES: UserRole[] = ["district_officer", "field_agent"];
const DAO_DENY: UserRole[] = [...DAO_ROLES];

export const MINISTRY_NAV: MinistryNavSection[] = [
  {
    id: "county-command",
    label: "County command",
    rolesAllow: ["county_officer"],
    items: [{ label: "County dashboard", href: "/county-dashboard" }],
  },
  {
    id: "district-command",
    label: "District operations",
    rolesAllow: [...DAO_ROLES],
    items: [{ label: "District dashboard", href: "/district-dashboard" }],
  },
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        label: "National command center",
        href: "/command-center",
        rolesDeny: [
          "county_officer",
          "district_officer",
          "field_agent",
          "warehouse_manager",
          "donor_partner",
        ],
      },
      {
        label: "Executive briefing",
        href: "/executive-briefing",
        rolesDeny: [...DAO_DENY, "warehouse_manager", "donor_partner", "call_center_agent"],
      },
      { label: "Food security intelligence", href: "/food-security", rolesDeny: ["donor_partner"] },
      { label: "Live alerts", href: "/alerts", rolesDeny: ["donor_partner"] },
    ],
  },
  {
    id: "farmer-registry",
    label: "Farmer registry",
    items: [
      { label: "Farmers", href: "/farmers" },
      { label: "Cooperatives", href: "/cooperatives", rolesDeny: [...DAO_DENY] },
      { label: "Geo-mapping", href: "/geo-registry" },
      { label: "Verification queue", href: "/verification-queue", rolesDeny: ["donor_partner"] },
      {
        label: "Registration approvals",
        href: "/registration-approvals",
        rolesDeny: ["donor_partner", "auditor", ...DAO_DENY],
      },
    ],
  },
  {
    id: "field",
    label: "District field operations",
    rolesDeny: ["donor_partner"],
    items: [
      { label: "DAO roster & assignments", href: "/field-agents" },
      { label: "Offline sync queue", href: "/field/sync-queue" },
      { label: "Inspection visits", href: "/field/inspections" },
      { label: "Extension officer reports", href: "/field/extension-reports" },
      { label: "Disease / pest reports", href: "/field/pest-reports" },
      { label: "Mobile field workspace", href: "/field/mobile" },
    ],
  },
  {
    id: "inventory",
    label: "Inputs & inventory",
    items: [
      { label: "National inventory", href: "/inventory", rolesDeny: ["donor_partner"] },
      {
        label: "Warehouse operations",
        href: "/operations/warehouses",
        rolesDeny: ["donor_partner", "auditor", ...DAO_DENY],
      },
      { label: "Fertilizer tracking", href: "/inventory/fertilizer", rolesDeny: ["donor_partner"] },
      { label: "Seed distribution", href: "/inventory/seed-distribution", rolesDeny: ["donor_partner"] },
      {
        label: "Inventory transfers",
        href: "/inventory/transfers",
        rolesDeny: ["donor_partner", "auditor", ...DAO_DENY],
      },
      { label: "Expiry monitoring", href: "/inventory/expiry", rolesDeny: ["donor_partner"] },
      { label: "Donor shipments", href: "/inventory/donor-shipments" },
    ],
  },
  {
    id: "subsidies",
    label: "Subsidies & programmes",
    items: [
      {
        label: "Subsidy allocation",
        href: "/subsidies/allocation",
        rolesDeny: ["donor_partner", "auditor", ...DAO_DENY],
      },
      {
        label: "Voucher management",
        href: "/subsidies/vouchers",
        rolesDeny: ["donor_partner", "auditor", ...DAO_DENY],
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
    items: [
      { label: "Rice production", href: "/production/rice" },
      { label: "County dashboards", href: "/production/county", rolesDeny: DAO_DENY },
      {
        label: "Yield forecasting",
        href: "/production/forecasting",
        rolesDeny: [...DAO_DENY, "call_center_agent"],
      },
      { label: "Seasonal performance", href: "/production/seasonal" },
      { label: "Loss hotspots", href: "/production/loss-hotspots" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance & audit",
    items: [
      { label: "Audit logs", href: "/compliance/audit-log" },
      { label: "Distribution anomalies", href: "/compliance/anomalies", rolesDeny: DAO_DENY },
      {
        label: "Procurement oversight",
        href: "/compliance/procurement",
        rolesDeny: [...DAO_DENY, "call_center_agent", "donor_partner"],
      },
      { label: "Compliance reports", href: "/compliance/reports" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    items: [
      { label: "Ministry reports", href: "/reports/ministry" },
      { label: "Export reports", href: "/reports/export" },
      { label: "Donor reporting", href: "/reports/donor" },
      { label: "PDF exports", href: "/reports/pdf" },
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
  if (pathname.startsWith("/admin/users")) return { kicker: "Administration", title: "User & role management" };
  if (pathname.startsWith("/admin/system")) return { kicker: "Administration", title: "System diagnostics" };
  if (pathname.startsWith("/county-dashboard")) return { kicker: "County command", title: "County dashboard" };
  if (pathname.startsWith("/district-dashboard")) return { kicker: "District operations", title: "District dashboard" };

  let best = { href: "", section: "MoA", label: "Workspace" };
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
