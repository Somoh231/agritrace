import type { CommodityType } from "@/lib/supabase/types";

/**
 * Single source of truth for pilot constraints.
 * Import these constants anywhere pilot scoping is needed.
 */
export const PILOT_MODE = true;

export const PILOT_COMMODITIES: CommodityType[] = ["rice"];

export const PILOT_COUNTIES = ["Nimba", "Bong", "Lofa"] as const;

export const PILOT_SEASON = "2026-A" as const;

/**
 * The platform still renders illustrative fixtures (src/lib/demo, ministry
 * canonical data) wherever validated operational records do not exist. While
 * true, every platform page carries PREVIEW_DATA_LABEL. Turn off only when
 * those fallbacks are removed and pages show validated records alone.
 */
export const PREVIEW_DATA_MODE = true;

/** Owner-approved wording (2026-09-29). */
export const PREVIEW_DATA_LABEL = "Illustrative preview data — not production programme results";

