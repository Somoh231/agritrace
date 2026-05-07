import { canonicalTransferOrders } from "@/lib/logistics/canonical-transfers";
import { collectExistingCodes, suggestTransferCode } from "@/lib/logistics/transfer-code";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const LOCAL_KEY = "agrivault-logistics-transfer-local";

function readLocal(): TransferOrderView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as TransferOrderView[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: TransferOrderView[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

const STATUS_FLOW: TransferWorkflowStatus[] = [
  "requested",
  "approved",
  "dispatched",
  "in_transit",
  "delivered",
  "completed",
];

function nextStatus(cur: TransferWorkflowStatus): TransferWorkflowStatus | null {
  if (cur === "disputed") return null;
  const i = STATUS_FLOW.indexOf(cur);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1] ?? null;
}

type DbTransferRow = Record<string, unknown>;

async function mapDbRows(rows: DbTransferRow[]): Promise<TransferOrderView[]> {
  if (!rows.length) return [];
  const supabase = getSupabaseBrowserClient();
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
    const sku =
      (inv?.sku as string | undefined) ?? (r.sku_code as string | undefined) ?? "—";
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

export async function listTransferOrders(): Promise<TransferOrderView[]> {
  let remote: TransferOrderView[] = [];
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("warehouse_transfer_orders")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(300);
    if (!error && data?.length) remote = await mapDbRows(data as DbTransferRow[]);
  } catch {
    remote = [];
  }

  const mergedCodes = new Set(remote.map((r) => r.transferCode));
  const canonical = canonicalTransferOrders().filter((c) => !mergedCodes.has(c.transferCode));
  const local = readLocal().filter((l) => !mergedCodes.has(l.transferCode));
  return [...remote, ...local, ...canonical];
}

export async function advanceTransferOrder(row: TransferOrderView): Promise<{ ok: boolean; error?: string }> {
  const next = nextStatus(row.status);
  if (!next) return { ok: false, error: "Already terminal or disputed — reset via new request." };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: next, updated_at: now };
  if (next === "approved") patch.approved_at = now;
  if (next === "dispatched") patch.dispatched_at = now;
  if (next === "delivered") patch.delivered_at = now;
  if (next === "completed") patch.completed_at = now;

  if (row.source === "supabase" && !row.id.startsWith("canonical-")) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("warehouse_transfer_orders").update(patch).eq("id", row.id);
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
    }
  }

  const locals = readLocal();
  const idx = locals.findIndex((x) => x.id === row.id || x.transferCode === row.transferCode);
  if (idx >= 0) {
    const cur = locals[idx];
    const updated: TransferOrderView = {
      ...cur,
      status: next,
      approvedAt: next === "approved" ? now : cur.approvedAt,
      dispatchedAt: next === "dispatched" ? now : cur.dispatchedAt,
      deliveredAt: next === "delivered" ? now : cur.deliveredAt,
      completedAt: next === "completed" ? now : cur.completedAt,
    };
    locals[idx] = updated;
    writeLocal(locals);
    return { ok: true };
  }

  if (row.source === "canonical") {
    const clone: TransferOrderView = {
      ...row,
      id: `local-${row.transferCode}`,
      status: next,
      source: "local",
      approvedAt: next === "approved" ? now : row.approvedAt,
      dispatchedAt: next === "dispatched" ? now : row.dispatchedAt,
      deliveredAt: next === "delivered" ? now : row.deliveredAt,
      completedAt: next === "completed" ? now : row.completedAt,
    };
    writeLocal([...readLocal().filter((x) => x.transferCode !== row.transferCode), clone]);
    return { ok: true };
  }

  return { ok: false, error: "Row not found for local update." };
}

export async function disputeTransferOrder(row: TransferOrderView): Promise<{ ok: boolean; error?: string }> {
  const noteLine = `Disputed ${new Date().toISOString().slice(0, 10)}`;
  const patch = {
    status: "disputed" as const,
    updated_at: new Date().toISOString(),
    notes: [row.notes, noteLine].filter(Boolean).join(" · "),
  };
  if (row.source === "supabase" && !row.id.startsWith("canonical-")) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("warehouse_transfer_orders").update(patch).eq("id", row.id);
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
    }
  }
  const locals = readLocal();
  const idx = locals.findIndex((x) => x.id === row.id || x.transferCode === row.transferCode);
  if (idx >= 0) {
    locals[idx] = { ...locals[idx], status: "disputed", notes: patch.notes };
    writeLocal(locals);
    return { ok: true };
  }
  const clone = {
    ...row,
    id: `local-${row.transferCode}`,
    status: "disputed" as const,
    notes: patch.notes,
    source: "local" as const,
  };
  writeLocal([...readLocal().filter((x) => x.transferCode !== row.transferCode), clone]);
  return { ok: true };
}

export async function createTransferRequest(params: {
  fromWarehouseId: string;
  toWarehouseId: string;
  inventoryItemId: string;
  skuLabel: string;
  quantity: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  const existing = await listTransferOrders();
  const codes = collectExistingCodes(existing);

  let fromCode = "WH-UNK";
  let toCode = "WH-UNK";
  try {
    const { data: wh } = await supabase.from("warehouses").select("id,ministry_code").in("id", [params.fromWarehouseId, params.toWarehouseId]);
    const map = new Map<string, string>(
      (wh ?? []).map((w: Record<string, unknown>) => [String(w.id), String(w.ministry_code ?? "")]),
    );
    fromCode = map.get(params.fromWarehouseId) || fromCode;
    toCode = map.get(params.toWarehouseId) || toCode;
  } catch {
    /* ignore */
  }

  const transferCode = suggestTransferCode(fromCode, toCode, codes);
  const payload = {
    transfer_code: transferCode,
    warehouse_from: params.fromWarehouseId,
    warehouse_to: params.toWarehouseId,
    inventory_item_id: params.inventoryItemId,
    sku_code: params.skuLabel,
    quantity: params.quantity,
    status: "requested" as const,
    notes: params.notes ?? null,
    requested_at: new Date().toISOString(),
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("warehouse_transfer_orders").insert({
      ...payload,
      requested_by: user?.id ?? null,
    } as Record<string, unknown>);
    if (!error) return { ok: true };
    throw error;
  } catch {
    const row: TransferOrderView = {
      id: `local-${transferCode}`,
      transferCode,
      fromMinistryCode: fromCode,
      toMinistryCode: toCode,
      fromName: fromCode,
      toName: toCode,
      sku: params.skuLabel,
      quantity: params.quantity,
      status: "requested",
      requestedAt: payload.requested_at,
      notes: params.notes ?? null,
      operatorLabel: "Local queue",
      source: "local",
    };
    writeLocal([row, ...readLocal()]);
    return { ok: true };
  }
}
