import type { VerificationGridRow } from "@/features/verification/model/types";

const OPEN_STATUSES = new Set(["pending", "under_review", "escalated"]);

export function countOpenVerificationRowsForCounty(rows: VerificationGridRow[] | undefined, county: string | null): number {
  if (!rows?.length || !county?.trim()) return 0;
  const c = county.trim().toLowerCase();
  return rows.filter((r) => String(r.county).toLowerCase() === c && OPEN_STATUSES.has(r._detail.status)).length;
}

export function countOpenVerificationRowsForWarehouse(rows: VerificationGridRow[] | undefined, warehouseCode: string | null): number {
  if (!rows?.length || !warehouseCode?.trim()) return 0;
  return rows.filter(
    (r) => r._detail.relatedWarehouse === warehouseCode && OPEN_STATUSES.has(r._detail.status),
  ).length;
}
