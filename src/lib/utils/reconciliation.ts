import type { Farmer, Lot, Movement, Plot } from "@/lib/supabase/types";

export function calculateVariancePct(dispatched: number, received: number): number {
  if (!Number.isFinite(dispatched) || dispatched <= 0) return 0;
  const pct = ((received - dispatched) / dispatched) * 100;
  return Math.round(pct * 10) / 10;
}

export function getVarianceSeverity(
  pct: number,
  dispatched?: number,
  received?: number,
): "normal" | "warning" | "alert" | "fraud" {
  if (
    typeof dispatched === "number" &&
    typeof received === "number" &&
    Number.isFinite(dispatched) &&
    Number.isFinite(received) &&
    received > dispatched
  ) {
    return "fraud";
  }

  const abs = Math.abs(pct);
  if (abs <= 2) return "normal";
  if (abs <= 5) return "warning";
  return "alert";
}

export function getVarianceColor(severity: string): string {
  switch (severity) {
    case "normal":
      return "text-green-700 bg-green-50";
    case "warning":
      return "text-amber-800 bg-amber-50";
    case "alert":
    case "fraud":
      return "text-red-800 bg-red-50";
    default:
      return "text-gray-700 bg-gray-100";
  }
}

export function isEUDRCompliant(
  lot: Lot,
  movements: Movement[],
  farmers: Farmer[],
  plots: Plot[],
): boolean {
  const allFarmersHaveId = farmers.every((f) => Boolean(f.national_id));
  const allPlotsHaveGps = plots.every(
    (p) => p.center_latitude != null && p.center_longitude != null,
  );
  const allPlotsClear = plots.every((p) => p.deforestation_check_status === "clear");
  const allMovementsReceived = movements.every((m) => m.status === "received");
  const noBadVariance = movements.every((m) => {
    if (m.weight_kg_received == null) return false;
    const pct = calculateVariancePct(m.weight_kg_dispatched, m.weight_kg_received);
    const sev = getVarianceSeverity(pct, m.weight_kg_dispatched, m.weight_kg_received);
    return sev !== "alert" && sev !== "fraud";
  });

  void lot;
  return (
    allFarmersHaveId &&
    allPlotsHaveGps &&
    allPlotsClear &&
    allMovementsReceived &&
    noBadVariance
  );
}

