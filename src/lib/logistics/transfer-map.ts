import type { SupabaseClient } from "@supabase/supabase-js";

import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";

type DbTransferRow = Record<string, unknown>;

export async function mapWarehouseTransferRows(
  supabase: SupabaseClient,
  rows: DbTransferRow[],
): Promise<TransferOrderView[]> {
  if (!rows.length) return [];
  const whIds = new Set<string>();
  for (const r of rows) {
    if (r.warehouse_from) whIds.add(String(r.warehouse_from));
    if (r.warehouse_to) whIds.add(String(r.warehouse_to));
  }
  const itemIds = [...new Set(rows.map((r) => r.inventory_item_id).filter(Boolean).map(String))];

  const [{ data: whData }, { data: invData }] = await Promise.all([
    whIds.size
      ? supabase.from("warehouses").select("id,ministry_code,name").in("id", [...whIds])
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    itemIds.length
      ? supabase.from("inventory_items").select("id,sku,name").in("id", itemIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const whMap = new Map<string, Record<string, unknown>>(
    (whData ?? []).map((w: Record<string, unknown>) => [String(w.id), w]),
  );
  const invMap = new Map<string, Record<string, unknown>>(
    (invData ?? []).map((x: Record<string, unknown>) => [String(x.id), x]),
  );

  return rows.map((r) => {
    const wf = whMap.get(String(r.warehouse_from ?? ""));
    const wt = whMap.get(String(r.warehouse_to ?? ""));
    const inv = r.inventory_item_id ? invMap.get(String(r.inventory_item_id)) : undefined;
    const sku = (inv?.sku as string | undefined) ?? (r.sku_code as string | undefined) ?? "—";
    return {
      id: String(r.id),
      transferCode: String(r.transfer_code ?? ""),
      fromMinistryCode: String(wf?.ministry_code ?? "—"),
      toMinistryCode: String(wt?.ministry_code ?? "—"),
      fromName: String(wf?.name ?? "Source"),
      toName: String(wt?.name ?? "Destination"),
      sku,
      quantity: Number(r.quantity ?? 0),
      status: r.status as TransferWorkflowStatus,
      requestedAt: String(r.requested_at ?? new Date().toISOString()),
      approvedAt: r.approved_at != null ? String(r.approved_at) : null,
      dispatchedAt: r.dispatched_at != null ? String(r.dispatched_at) : null,
      deliveredAt: r.delivered_at ? String(r.delivered_at) : null,
      completedAt: r.completed_at ? String(r.completed_at) : null,
      operatorLabel: r.operator_label ? String(r.operator_label) : null,
      notes: r.notes ? String(r.notes) : null,
      source: "supabase" as const,
    };
  });
}
