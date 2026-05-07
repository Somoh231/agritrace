import { MINISTRY_INVENTORY_MOVEMENTS } from "@/lib/data/ministry-canonical-data";
import type { MovementTimelineRow } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function fetchNationalMovementTimeline(limit = 80): Promise<MovementTimelineRow[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("id, created_at, movement_type, quantity, reference, warehouse_from, warehouse_to, created_by, inventory_items(sku)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data?.length) throw new Error("no rows");

    const whIds = new Set<string>();
    for (const r of data as Record<string, unknown>[]) {
      if (r.warehouse_from) whIds.add(String(r.warehouse_from));
      if (r.warehouse_to) whIds.add(String(r.warehouse_to));
    }
    const { data: wh } =
      whIds.size > 0
        ? await supabase.from("warehouses").select("id,name,ministry_code").in("id", [...whIds])
        : { data: [] as Record<string, unknown>[] };
    const whMap = new Map<string, Record<string, unknown>>(
      (wh ?? []).map((w: Record<string, unknown>) => [String(w.id), w]),
    );

    return (data as Record<string, unknown>[]).map((r) => {
      const wf = r.warehouse_from ? whMap.get(String(r.warehouse_from)) : undefined;
      const wt = r.warehouse_to ? whMap.get(String(r.warehouse_to)) : undefined;
      const sku =
        r.inventory_items && typeof r.inventory_items === "object" && r.inventory_items !== null && "sku" in r.inventory_items
          ? String((r.inventory_items as { sku?: string }).sku ?? "—")
          : "—";
      const src = wf ? `${String(wf.ministry_code ?? wf.name)}` : "External / adjustment";
      const dst = wt ? `${String(wt.ministry_code ?? wt.name)}` : "—";
      const uid = r.created_by ? String(r.created_by).slice(0, 8) : "—";
      return {
        id: String(r.id),
        at: String(r.created_at ?? ""),
        movementType: String(r.movement_type ?? ""),
        source: src,
        destination: dst,
        quantity: Number(r.quantity ?? 0),
        operator: uid,
        status: "posted",
        reference: String(r.reference ?? sku),
      };
    });
  } catch {
    return MINISTRY_INVENTORY_MOVEMENTS.map((m, i) => ({
      id: `mov-canon-${i}`,
      at: m.occurredAt,
      movementType: m.movementType,
      source: m.fromWarehouseCode,
      destination: m.toWarehouseCode,
      quantity: m.quantity,
      operator: "Fixture",
      status: "posted",
      reference: m.reference,
    }));
  }
}
