/**
 * Dashboard layout modes — a small, centralized system so every page sits in a
 * deliberate width/background instead of floating as a tiny card in empty space.
 *
 *  - command : centered, capped reading width (dashboards, command surfaces)
 *  - table   : wide workspace that uses most of the horizontal space (lists/tables)
 *  - admin   : light background, full-width content (admin consoles)
 *  - map     : full-bleed canvas with no chrome (the GIS capture surface)
 */
export type LayoutMode = "command" | "table" | "admin" | "map";

/** Routes that are a single full-height map canvas (must fill the viewport). */
const MAP_PREFIXES = ["/field/boundary-capture"];

/** Wide, list/table-heavy workspaces that benefit from horizontal space. */
const TABLE_PREFIXES = [
  "/farmers",
  "/cooperatives",
  "/farm-profiles",
  "/transfers",
  "/inventory",
  "/logistics",
  "/verification-queue",
  "/registration-approvals",
  "/alerts",
  "/activity",
  "/compliance",
  "/field-agents",
  "/field/inspections",
  "/field/pest-reports",
  "/field/extension-reports",
  "/field/sync-queue",
  "/subsidies",
  "/search",
  // GIS/map pages that are scrollable stacks (not single full-height canvases)
  "/map",
  "/national-heat-map",
  "/geo-registry",
];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function resolveLayoutMode(pathname: string): LayoutMode {
  if (MAP_PREFIXES.some((p) => matches(pathname, p))) return "map";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (TABLE_PREFIXES.some((p) => matches(pathname, p))) return "table";
  return "command";
}

/** Tailwind classes for the inner content container of each non-map mode. */
export const LAYOUT_CONTAINER_CLASS: Record<Exclude<LayoutMode, "map">, string> = {
  command: "mx-auto w-full max-w-[1240px] min-w-0 px-4 py-5 md:px-8 md:py-7",
  table: "mx-auto w-full max-w-[1760px] min-w-0 px-4 py-5 md:px-6 md:py-6",
  admin: "mx-auto w-full max-w-[1600px] min-w-0 px-4 py-5 md:px-7 md:py-7",
};
