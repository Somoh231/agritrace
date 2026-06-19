import {
  isClanFieldRole,
  isCountyCoordinatorRole,
  isDaoDistrictRole,
  isMinistryNationalRole,
} from "@/lib/auth/operational-roles";
import type { UserRole } from "@/lib/supabase/types";

export type OperationsRailTier = "National" | "County" | "District" | "Field" | "Operations";

export type OperationsRailLink = {
  label: string;
  href: string;
  hint?: string;
  tone?: "default" | "alert" | "escalation";
};

export type OperationsRailSection = {
  id: string;
  label: string;
  links: OperationsRailLink[];
};

export type OperationsRailConfig = {
  tier: OperationsRailTier;
  /** One-line operational orientation for this role's command surface. */
  focus: string;
  sections: OperationsRailSection[];
};

const NATIONAL: OperationsRailConfig = {
  tier: "National",
  focus: "National status across all counties.",
  sections: [
    {
      id: "priority",
      label: "Command",
      links: [
        { label: "Command center", href: "/command-center", hint: "National posture" },
        { label: "National operations", href: "/national-operations", hint: "Cross-programme" },
        { label: "National heat map", href: "/national-heat-map", hint: "County signals" },
        { label: "Food security", href: "/food-security", hint: "Early warning" },
      ],
    },
    {
      id: "watch",
      label: "Alerts & escalations",
      links: [
        { label: "Live alerts", href: "/alerts", tone: "alert" },
        { label: "Verification escalations", href: "/verification-queue", tone: "escalation" },
      ],
    },
    {
      id: "actions",
      label: "Pending actions",
      links: [
        { label: "Ministry reports", href: "/reports" },
        { label: "Audit log", href: "/compliance/audit-log" },
      ],
    },
  ],
};

const COUNTY: OperationsRailConfig = {
  tier: "County",
  focus: "County status, verification, and escalations.",
  sections: [
    {
      id: "priority",
      label: "County operations",
      links: [
        { label: "County command center", href: "/county-dashboard", hint: "Districts & maps" },
        { label: "Verification queue", href: "/verification-queue", hint: "Approve / reject" },
        { label: "County map", href: "/map", hint: "Operational layer" },
      ],
    },
    {
      id: "watch",
      label: "Alerts & escalations",
      links: [
        { label: "Escalations", href: "/alerts", tone: "escalation" },
        { label: "Compliance", href: "/compliance", tone: "alert" },
      ],
    },
    {
      id: "actions",
      label: "Pending actions",
      links: [
        { label: "CAC reporting hub", href: "/reporting/workspace?tab=cac" },
        { label: "Executive briefing", href: "/executive-briefing" },
      ],
    },
  ],
};

const DISTRICT: OperationsRailConfig = {
  tier: "District",
  focus: "District review queues and field monitoring.",
  sections: [
    {
      id: "priority",
      label: "District operations",
      links: [
        { label: "District command", href: "/district-dashboard", hint: "DAO posture" },
        { label: "Review queue", href: "/verification-queue", hint: "CLAN submissions" },
        { label: "Field monitoring", href: "/field-agents", hint: "Coverage & cadence" },
      ],
    },
    {
      id: "watch",
      label: "Alerts & escalations",
      links: [
        { label: "Alerts", href: "/alerts", tone: "alert" },
        { label: "Inspections", href: "/field/inspections", tone: "escalation" },
      ],
    },
    {
      id: "actions",
      label: "Pending actions",
      links: [
        { label: "DAO reporting hub", href: "/reporting/workspace?tab=dao" },
        { label: "Warehouse coordination", href: "/operations/warehouses" },
      ],
    },
  ],
};

const FIELD: OperationsRailConfig = {
  tier: "Field",
  focus: "Field work, capture, and offline sync.",
  sections: [
    {
      id: "priority",
      label: "Field work",
      links: [
        { label: "Field activity", href: "/field/mobile", hint: "Offline capture" },
        { label: "GPS boundary capture", href: "/field/boundary-capture", hint: "Walk corners" },
        { label: "Offline queue", href: "/field/sync-queue", hint: "Pending sync" },
      ],
    },
    {
      id: "watch",
      label: "Alerts & escalations",
      links: [
        { label: "Pest & disease", href: "/field/pest-reports", tone: "alert" },
        { label: "Inspection visits", href: "/field/inspections", tone: "escalation" },
      ],
    },
    {
      id: "actions",
      label: "Pending actions",
      links: [
        { label: "Farm registration", href: "/farmers" },
        { label: "Field home", href: "/field" },
      ],
    },
  ],
};

const GENERIC: OperationsRailConfig = {
  tier: "Operations",
  focus: "Operational status and live signals.",
  sections: [
    {
      id: "priority",
      label: "Operations",
      links: [
        { label: "Command center", href: "/command-center", hint: "National posture" },
        { label: "Operational map", href: "/map", hint: "Live layer" },
        { label: "Reports", href: "/reports", hint: "Analytics & exports" },
      ],
    },
    {
      id: "watch",
      label: "Alerts & escalations",
      links: [{ label: "Live alerts", href: "/alerts", tone: "alert" }],
    },
    {
      id: "actions",
      label: "Pending actions",
      links: [{ label: "Activity", href: "/activity" }],
    },
  ],
};

/** Role-specific operations rail content (CLAN / DAO / CAC / Ministry + safe fallback). */
export function operationsRailForRole(role: UserRole | null | undefined): OperationsRailConfig {
  if (isMinistryNationalRole(role)) return NATIONAL;
  if (isCountyCoordinatorRole(role)) return COUNTY;
  if (isDaoDistrictRole(role)) return DISTRICT;
  if (isClanFieldRole(role)) return FIELD;
  return GENERIC;
}
