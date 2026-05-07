import type { SupabaseClient } from "@supabase/supabase-js";

import { canonicalTransferOrders } from "@/lib/logistics/canonical-transfers";
import { mapWarehouseTransferRows } from "@/lib/logistics/transfer-map";
import type { TransferOrderView } from "@/lib/logistics/types";

type DbTransferRow = Record<string, unknown>;

export async function listTransferOrdersServer(supabase: SupabaseClient): Promise<TransferOrderView[]> {
  const { data, error } = await supabase
    .from("warehouse_transfer_orders")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(300);

  let remote: TransferOrderView[] = [];
  if (!error && data?.length) remote = await mapWarehouseTransferRows(supabase, data as DbTransferRow[]);

  const mergedCodes = new Set(remote.map((r) => r.transferCode));
  const canonical = canonicalTransferOrders().filter((c) => !mergedCodes.has(c.transferCode));
  return [...remote, ...canonical];
}

export async function findTransferOrderServer(
  supabase: SupabaseClient,
  transferId: string,
): Promise<TransferOrderView | null> {
  const orders = await listTransferOrdersServer(supabase);
  return orders.find((o) => o.id === transferId) ?? null;
}
