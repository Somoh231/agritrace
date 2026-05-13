import type { UserRole } from "@/lib/supabase/types";

import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import {
  isClanFieldRole,
  isCountyCoordinatorRole,
  isDaoDistrictRole,
  isDaoWorkspaceRole,
  isDonorObserverRole,
  isMinistryNationalRole,
} from "@/lib/auth/operational-roles";

export type PilotWorkspaceId = "clan" | "dao" | "cac" | "ministry";

export type PilotRouteAccessResult = { ok: true } | { ok: false; redirectTo: string };

/** Pilot GIS surfaces (boundary, registry, operational map) — not advanced GIS intelligence. */
export function canAccessPilotPrimaryGis(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isDaoWorkspaceRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

/** Advanced / experimental GIS workspace — ministry + CAC only (pilot containment). */
export function canAccessAdvancedGisIntelligence(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  if (isClanFieldRole(role) || isDaoDistrictRole(role)) return false;
  return isMinistryNationalRole(role) || isCountyCoordinatorRole(role);
}

/** National command surfaces (ministry desk — not DAO field chain). */
export function canAccessNationalCommandCenter(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isMinistryNationalRole(role);
}

export function canAccessNationalOperationsShell(role: UserRole): boolean {
  return canAccessNationalCommandCenter(role);
}

/** National heat map — operational read-through without donor/auditor. */
export function canAccessNationalHeatMap(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isMinistryNationalRole(role) || isCountyCoordinatorRole(role) || isDaoDistrictRole(role) || isClanFieldRole(role);
}

export function canAccessExecutiveBriefing(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isMinistryNationalRole(role) || isCountyCoordinatorRole(role);
}

/** DAO monitoring of CLAN / field agents — not for CLAN technicians. */
export function canAccessFieldAgentsMonitoring(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor" || isClanFieldRole(role)) return false;
  return isDaoDistrictRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

export function canAccessReportingHub(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isDaoWorkspaceRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

export function canAccessVerificationQueue(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor" || isClanFieldRole(role)) return false;
  return isDaoDistrictRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

/** Inventory / transfers / logistics — not CLAN capture roles. */
export function canAccessWarehouseLogisticsRoutes(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor" || isClanFieldRole(role)) return false;
  return (
    isDaoDistrictRole(role) ||
    isCountyCoordinatorRole(role) ||
    isMinistryNationalRole(role) ||
    role === "warehouse_manager" ||
    role === "cooperative_manager" ||
    role === "exporter"
  );
}

export function canAccessSubsidiesAndProduction(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return (
    isDaoWorkspaceRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role) || role === "warehouse_manager"
  );
}

export function canAccessFarmersCooperativesProfiles(role: UserRole): boolean {
  if (isDonorObserverRole(role)) return false;
  return true;
}

export function canAccessAlerts(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isDaoWorkspaceRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

export function canAccessComplianceRoutes(role: UserRole): boolean {
  if (isDonorObserverRole(role)) return false;
  return true;
}

export function canAccessActivitySearchDashboard(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isMinistryNationalRole(role) || role === "call_center_agent";
}

/** Aligns with operational workspace nav: who may open each hub. */
export function canAccessPilotWorkspace(role: UserRole, workspace: PilotWorkspaceId): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  const clanDaoDesk =
    isClanFieldRole(role) || isDaoDistrictRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
  switch (workspace) {
    case "clan":
    case "dao":
      return clanDaoDesk;
    case "cac":
      return isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
    case "ministry":
      return isMinistryNationalRole(role);
    default:
      return false;
  }
}

/** Safe redirect after a workspace access denial (no new routes). */
export function pilotRoleLandingPath(role: UserRole): string {
  if (isDonorObserverRole(role)) return "/donor-dashboard";
  if (role === "auditor") return "/audit-tools";
  if (isMinistryNationalRole(role)) return "/command-center";
  if (isCountyCoordinatorRole(role)) return "/county-dashboard";
  if (isDaoDistrictRole(role)) return "/district-dashboard";
  if (isClanFieldRole(role)) return "/field/mobile";
  if (role === "warehouse_manager") return "/inventory";
  if (role === "cooperative_manager") return "/cooperatives";
  if (role === "exporter") return "/farmers";
  if (role === "call_center_agent") return "/farmers";
  return "/district-dashboard";
}

export function assertPilotWorkspaceAccess(
  role: UserRole,
  workspace: PilotWorkspaceId,
): { ok: true } | { ok: false; redirectTo: string } {
  if (canAccessPilotWorkspace(role, workspace)) return { ok: true };
  return { ok: false, redirectTo: pilotRoleLandingPath(role) };
}

/** County command center — CAC desk + ministry national oversight. */
export function canAccessCountyDashboard(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

/**
 * District operations hub — CLAN + DAO capture; CAC and ministry may open for oversight
 * (district UI applies read-only for non-DAO roles where applicable).
 */
export function canAccessDistrictDashboard(role: UserRole): boolean {
  if (isDonorObserverRole(role) || role === "auditor") return false;
  return isClanFieldRole(role) || isDaoDistrictRole(role) || isCountyCoordinatorRole(role) || isMinistryNationalRole(role);
}

export function assertCountyDashboardAccess(role: UserRole): { ok: true } | { ok: false; redirectTo: string } {
  if (canAccessCountyDashboard(role)) return { ok: true };
  return { ok: false, redirectTo: pilotRoleLandingPath(role) };
}

export function assertDistrictDashboardAccess(role: UserRole): { ok: true } | { ok: false; redirectTo: string } {
  if (canAccessDistrictDashboard(role)) return { ok: true };
  return { ok: false, redirectTo: pilotRoleLandingPath(role) };
}

// --- Central pilot HTTP route policy (middleware) ---

function normalizePilotPath(pathname: string): string {
  const base = pathname.split("?")[0] ?? pathname;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** Prefixes that receive centralized role checks in middleware. */
export function needsPilotRoleGate(pathname: string): boolean {
  const p = normalizePilotPath(pathname);
  const roots = [
    "/gis-intelligence",
    "/admin",
    "/command-center",
    "/national-operations",
    "/national-heat-map",
    "/executive-briefing",
    "/county-dashboard",
    "/district-dashboard",
    "/workspace",
    "/field-agents",
    "/field",
    "/geo-registry",
    "/map",
    "/verification-queue",
    "/reporting",
    "/inventory",
    "/transfers",
    "/logistics",
    "/operations",
    "/subsidies",
    "/production",
    "/alerts",
    "/registration-approvals",
    "/food-security",
    "/rice",
    "/cocoa",
    "/compliance",
    "/farm-profiles",
    "/farmers",
    "/cooperatives",
    "/activity",
    "/search",
    "/dashboard",
  ];
  return roots.some((r) => p === r || p.startsWith(`${r}/`));
}

type PilotRule = { prefix: string; canAccess: (role: UserRole) => boolean };

const PILOT_ROUTE_RULES: PilotRule[] = [
  { prefix: "/gis-intelligence", canAccess: (r) => canAccessAdvancedGisIntelligence(r) },
  { prefix: "/admin", canAccess: (r) => isAdminConsoleRole(r) },
  { prefix: "/command-center", canAccess: (r) => canAccessNationalCommandCenter(r) },
  { prefix: "/national-operations", canAccess: (r) => canAccessNationalOperationsShell(r) },
  { prefix: "/national-heat-map", canAccess: (r) => canAccessNationalHeatMap(r) },
  { prefix: "/executive-briefing", canAccess: (r) => canAccessExecutiveBriefing(r) },
  { prefix: "/county-dashboard", canAccess: (r) => canAccessCountyDashboard(r) },
  { prefix: "/district-dashboard", canAccess: (r) => canAccessDistrictDashboard(r) },
  { prefix: "/workspace/ministry", canAccess: (r) => canAccessPilotWorkspace(r, "ministry") },
  { prefix: "/workspace/cac", canAccess: (r) => canAccessPilotWorkspace(r, "cac") },
  { prefix: "/workspace/dao", canAccess: (r) => canAccessPilotWorkspace(r, "dao") },
  { prefix: "/workspace/clan", canAccess: (r) => canAccessPilotWorkspace(r, "clan") },
  {
    prefix: "/workspace",
    canAccess: (r) =>
      canAccessPilotWorkspace(r, "clan") ||
      canAccessPilotWorkspace(r, "dao") ||
      canAccessPilotWorkspace(r, "cac") ||
      canAccessPilotWorkspace(r, "ministry"),
  },
  { prefix: "/field-agents", canAccess: (r) => canAccessFieldAgentsMonitoring(r) },
  { prefix: "/field", canAccess: (r) => isDaoWorkspaceRole(r) || isCountyCoordinatorRole(r) || isMinistryNationalRole(r) },
  { prefix: "/geo-registry", canAccess: (r) => canAccessPilotPrimaryGis(r) },
  { prefix: "/map", canAccess: (r) => canAccessPilotPrimaryGis(r) },
  { prefix: "/verification-queue", canAccess: (r) => canAccessVerificationQueue(r) },
  { prefix: "/reporting", canAccess: (r) => canAccessReportingHub(r) },
  { prefix: "/inventory", canAccess: (r) => canAccessWarehouseLogisticsRoutes(r) },
  { prefix: "/transfers", canAccess: (r) => canAccessWarehouseLogisticsRoutes(r) },
  { prefix: "/logistics", canAccess: (r) => canAccessWarehouseLogisticsRoutes(r) },
  { prefix: "/operations", canAccess: (r) => canAccessWarehouseLogisticsRoutes(r) },
  { prefix: "/subsidies", canAccess: (r) => canAccessSubsidiesAndProduction(r) },
  { prefix: "/production", canAccess: (r) => canAccessSubsidiesAndProduction(r) },
  { prefix: "/alerts", canAccess: (r) => canAccessAlerts(r) },
  { prefix: "/registration-approvals", canAccess: (r) => canAccessVerificationQueue(r) },
  { prefix: "/food-security", canAccess: (r) => canAccessNationalHeatMap(r) },
  { prefix: "/rice", canAccess: (r) => canAccessSubsidiesAndProduction(r) },
  { prefix: "/cocoa", canAccess: (r) => canAccessSubsidiesAndProduction(r) },
  { prefix: "/compliance", canAccess: (r) => canAccessComplianceRoutes(r) },
  { prefix: "/farm-profiles", canAccess: (r) => canAccessFarmersCooperativesProfiles(r) },
  { prefix: "/farmers", canAccess: (r) => canAccessFarmersCooperativesProfiles(r) },
  { prefix: "/cooperatives", canAccess: (r) => canAccessFarmersCooperativesProfiles(r) },
  { prefix: "/activity", canAccess: (r) => canAccessActivitySearchDashboard(r) },
  { prefix: "/search", canAccess: (r) => canAccessActivitySearchDashboard(r) },
  { prefix: "/dashboard", canAccess: (r) => canAccessActivitySearchDashboard(r) },
];

const PILOT_RULES_SORTED = [...PILOT_ROUTE_RULES].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Canonical pilot access check for gated operational paths.
 * Uses longest-prefix matching; unknown paths under the dashboard remain handled elsewhere.
 */
export function assertPilotRouteAccess(role: UserRole, pathname: string): PilotRouteAccessResult {
  const p = normalizePilotPath(pathname);
  if (!needsPilotRoleGate(pathname)) return { ok: true };

  for (const rule of PILOT_RULES_SORTED) {
    if (p === rule.prefix || p.startsWith(`${rule.prefix}/`)) {
      if (rule.canAccess(role)) return { ok: true };
      const dest = pilotRoleLandingPath(role);
      if (dest === p) return { ok: true };
      return { ok: false, redirectTo: dest };
    }
  }
  return { ok: true };
}

/** Metadata for audits / docs — mirrors middleware rule order (longest prefix). */
export const PILOT_ROUTE_INVENTORY: { route: string; intendedRoles: string; mechanism: string }[] = [
  { route: "/gis-intelligence", intendedRoles: "Ministry national, CAC (advanced GIS)", mechanism: "middleware + assertPilotRouteAccess" },
  { route: "/admin", intendedRoles: "Admin console (ministry national)", mechanism: "middleware + admin/layout" },
  { route: "/command-center", intendedRoles: "Ministry national", mechanism: "middleware" },
  { route: "/national-operations", intendedRoles: "Ministry national", mechanism: "middleware" },
  { route: "/national-heat-map", intendedRoles: "Ministry, CAC, DAO, CLAN (no donor/auditor)", mechanism: "middleware" },
  { route: "/executive-briefing", intendedRoles: "Ministry national, CAC", mechanism: "middleware" },
  { route: "/county-dashboard", intendedRoles: "CAC, ministry national", mechanism: "middleware + page assert" },
  { route: "/district-dashboard", intendedRoles: "CLAN, DAO, CAC, ministry", mechanism: "middleware + page assert" },
  { route: "/workspace/*", intendedRoles: "Per hub (CLAN/DAO/CAC/Ministry)", mechanism: "middleware + page assert" },
  { route: "/field-agents", intendedRoles: "DAO, CAC, ministry", mechanism: "middleware" },
  { route: "/field", intendedRoles: "CLAN, DAO, CAC, ministry", mechanism: "middleware" },
  { route: "/geo-registry, /map", intendedRoles: "Pilot GIS (CLAN, DAO, CAC, ministry)", mechanism: "middleware" },
  { route: "/verification-queue, /registration-approvals", intendedRoles: "DAO, CAC, ministry", mechanism: "middleware" },
  { route: "/reporting", intendedRoles: "CLAN, DAO, CAC, ministry", mechanism: "middleware" },
  { route: "/inventory, /transfers, /logistics, /operations", intendedRoles: "DAO, CAC, ministry, warehouse, cooperative, exporter", mechanism: "middleware" },
  { route: "/subsidies, /production, /rice, /cocoa", intendedRoles: "Operational + warehouse", mechanism: "middleware" },
  { route: "/alerts", intendedRoles: "CLAN, DAO, CAC, ministry", mechanism: "middleware" },
  { route: "/food-security", intendedRoles: "Operational chain", mechanism: "middleware" },
  { route: "/compliance", intendedRoles: "Authenticated non-donor", mechanism: "middleware" },
  { route: "/farmers, /cooperatives, /farm-profiles", intendedRoles: "Authenticated non-donor", mechanism: "middleware" },
  { route: "/activity, /search, /dashboard", intendedRoles: "Ministry national, call_center_agent", mechanism: "middleware" },
];
