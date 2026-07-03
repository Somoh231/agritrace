/**
 * Unified data-source taxonomy for ministry pilot surfaces.
 *
 * LIVE    — Operational Supabase tables (farmers, rice_production_records, …)
 * PILOT   — Ministry pilot / canonical fixture tier (pilot_* tables or CSV canonical)
 * OFFLINE — IndexedDB queues and unsynced local captures
 * DEMO    — Illustrative national figures (`agriculture-pilot-data`)
 */

export type DataSourceKind = "live" | "pilot" | "offline" | "demo";

export type DataSourceMeta = {
  kind: DataSourceKind;
  /** Short label for badges */
  label: string;
  /** Why this source was chosen (fallback path, table name, etc.) */
  detail?: string;
  /** When multiple layers contribute to a view */
  mixed?: DataSourceKind[];
};

export type SourcedResult<T> = {
  data: T;
  source: DataSourceMeta;
};

export const DATA_SOURCE_LABELS: Record<DataSourceKind, string> = {
  live: "Live data",
  pilot: "Pilot dataset",
  offline: "Offline queue",
  demo: "Demo data",
};

export const DATA_SOURCE_DESCRIPTIONS: Record<DataSourceKind, string> = {
  live: "Loaded from operational Supabase tables for your signed-in scope.",
  pilot: "Ministry pilot tables or canonical fixtures — structured seed data, not illustrative demo.",
  offline: "Device-local queue pending sync to Supabase.",
  demo: "Illustrative national pilot figures for training and walkthroughs.",
};

/** Disclosure priority — highest index wins when merging mixed sources. */
const DISCLOSURE_PRIORITY: DataSourceKind[] = ["live", "offline", "pilot", "demo"];

export function dataSourceMeta(
  kind: DataSourceKind,
  detail?: string,
  mixed?: DataSourceKind[],
): DataSourceMeta {
  return {
    kind,
    label: DATA_SOURCE_LABELS[kind],
    detail,
    mixed: mixed?.length ? mixed : undefined,
  };
}

export function liveSource(detail?: string): DataSourceMeta {
  return dataSourceMeta("live", detail);
}

export function pilotSource(detail?: string): DataSourceMeta {
  return dataSourceMeta("pilot", detail ?? "Canonical ministry fixtures");
}

export function demoSource(detail?: string): DataSourceMeta {
  return dataSourceMeta("demo", detail ?? "Illustrative pilot dataset");
}

export function offlineSource(detail?: string): DataSourceMeta {
  return dataSourceMeta("offline", detail ?? "IndexedDB pending sync");
}

export function sourced<T>(data: T, source: DataSourceMeta): SourcedResult<T> {
  return { data, source };
}

/** Pick the most conservative (most disclosure-worthy) source for a page badge. */
export function resolveDisplaySource(sources: DataSourceMeta[]): DataSourceMeta {
  if (!sources.length) return liveSource();
  const kinds = [...new Set(sources.map((s) => s.kind))];
  if (kinds.length === 1) return sources[0]!;
  const worst = kinds.sort((a, b) => DISCLOSURE_PRIORITY.indexOf(b) - DISCLOSURE_PRIORITY.indexOf(a))[0]!;
  return {
    kind: worst,
    label: `Mixed · ${kinds.map((k) => DATA_SOURCE_LABELS[k]).join(" + ")}`,
    detail: sources.map((s) => s.detail).filter(Boolean).join(" · ") || undefined,
    mixed: kinds,
  };
}

export function isLiveSource(source: DataSourceMeta): boolean {
  return source.kind === "live" && !source.mixed?.some((k) => k !== "live");
}

export function requiresDisclosure(source: DataSourceMeta): boolean {
  return source.kind !== "live" || Boolean(source.mixed?.some((k) => k !== "live"));
}
