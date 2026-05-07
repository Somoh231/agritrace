import { MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";

export function warehouseCountyForMinistryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return MINISTRY_WAREHOUSES.find((w) => w.ministryCode === code)?.county ?? null;
}
