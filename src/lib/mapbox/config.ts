export const LIBERIA_CENTER = { longitude: -9.4295, latitude: 6.4281 } as const;
export const LIBERIA_ZOOM = 6.5;

export function mapboxToken() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
  }
  return token;
}

/** Token for optional Mapbox panels (CAC map, previews). Returns null when unset. */
export function optionalMapboxToken(): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  return token && token.length >= 20 ? token : null;
}

