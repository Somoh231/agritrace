import type { CommodityType } from "@/lib/supabase/types";

/**
 * Single source of truth for pilot constraints.
 * Import these constants anywhere pilot scoping is needed.
 */
export const PILOT_MODE = true;

export const PILOT_COMMODITIES: CommodityType[] = ["rice"];

export const PILOT_COUNTIES = ["Nimba", "Bong", "Lofa"] as const;

export const PILOT_SEASON = "2026-A" as const;

