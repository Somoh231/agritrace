/**
 * Liberia county polygons (ADM1) — loaded from public/data/liberia-counties.geojson.
 * Swap this file’s URL or add district/farm layers alongside without changing map components.
 */

export const LIBERIA_COUNTIES_GEOJSON_PATH = "/data/liberia-counties.geojson";

export type LiberiaCountyFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type?: string;
    properties?: Record<string, unknown>;
    geometry?: unknown;
  }>;
};

export async function fetchLiberiaCountiesGeoJSON(): Promise<LiberiaCountyFeatureCollection | null> {
  try {
    const res = await fetch(LIBERIA_COUNTIES_GEOJSON_PATH);
    if (!res.ok) return null;
    const data = (await res.json()) as LiberiaCountyFeatureCollection;
    if (data?.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length === 0) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
