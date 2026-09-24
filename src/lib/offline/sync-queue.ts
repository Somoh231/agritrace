import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureOperationalSubmission } from "@/lib/workflow/submission-bridge";
import type { Farmer, Plot, RiceProductionRecord } from "@/lib/supabase/types";

import { getDB } from "./db";

type QueueStoreName = "pending_farmers" | "pending_production_records" | "pending_plots";

type QueuedRecord = {
  client_id: string;
  data: Record<string, unknown>;
  created_at: string;
  sync_attempts: number;
  synced: boolean;
};

function uuid() {
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback for older browsers (requires Web Crypto).
  if (!c?.getRandomValues) throw new Error("crypto.getRandomValues is not available in this environment.");
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function putQueued(store: QueueStoreName, record: QueuedRecord) {
  const db = await getDB();
  await db.put(store, record as any);
}

async function getUnsynced(store: QueueStoreName): Promise<QueuedRecord[]> {
  const db = await getDB();
  const all = (await db.getAll(store)) as any[];
  return (all ?? []).filter((r) => r && r.synced !== true) as QueuedRecord[];
}

export async function queueFarmer(data: Partial<Farmer>): Promise<string> {
  const client_id = uuid();
  (data as any).client_id = client_id;
  await putQueued("pending_farmers", {
    client_id,
    data: data as any,
    created_at: new Date().toISOString(),
    sync_attempts: 0,
    synced: false,
  });
  return client_id;
}

export async function queueProductionRecord(data: Partial<RiceProductionRecord>): Promise<string> {
  const client_id = uuid();
  (data as any).client_id = client_id;
  await putQueued("pending_production_records", {
    client_id,
    data: data as any,
    created_at: new Date().toISOString(),
    sync_attempts: 0,
    synced: false,
  });
  return client_id;
}

export async function queuePlot(data: Partial<Plot>): Promise<string> {
  const client_id = uuid();
  (data as any).client_id = client_id;
  await putQueued("pending_plots", {
    client_id,
    data: data as any,
    created_at: new Date().toISOString(),
    sync_attempts: 0,
    synced: false,
  });
  return client_id;
}

const MAX_SYNC_ATTEMPTS = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReplayOutcome = { ok: true; serverId: string } | { ok: false; error: string };

function queuedOwner(r: QueuedRecord): string | null {
  const d = r.data as Record<string, unknown>;
  const owner = d.registered_by ?? d.recorded_by;
  return typeof owner === "string" && owner ? owner : null;
}

/**
 * Replays one queued row through the operator's own session so RLS, geography
 * scope and attribution apply exactly as for an online write. `client_id` is
 * unique server-side, so a retried upsert after a lost response is idempotent.
 */
async function replayRow(
  table: "farmers" | "plots" | "rice_production_records",
  r: QueuedRecord,
  row: Record<string, unknown>,
): Promise<ReplayOutcome> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(table)
    .upsert({ ...row, client_id: r.client_id }, { onConflict: "client_id", ignoreDuplicates: false })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "not persisted" };
  return { ok: true, serverId: String((data as { id: string }).id) };
}

/** Offline plots reference the farmer's device client_id until that farmer has a server id. */
async function resolveFarmerId(
  farmerRef: string,
  syncedFarmerIds: Map<string, string>,
): Promise<string | null> {
  const mapped = syncedFarmerIds.get(farmerRef);
  if (mapped) return mapped;
  if (!UUID_RE.test(farmerRef)) return null;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("farmers")
    .select("id")
    .or(`id.eq.${farmerRef},client_id.eq.${farmerRef}`)
    .limit(1)
    .maybeSingle();
  return data ? String((data as { id: string }).id) : null;
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number; errors: string[] }> {
  const db = await getDB();
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const operatorId = session?.user?.id ?? null;

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];
  if (!operatorId) {
    return { synced, failed, errors: ["auth:Sign in to replay the offline queue."] };
  }

  const [farmers, plots, records] = await Promise.all([
    getUnsynced("pending_farmers"),
    getUnsynced("pending_plots"),
    getUnsynced("pending_production_records"),
  ]);

  // Offline forms may omit geography the operator is bound to; fill it from their
  // own profile (never overriding what was captured) so RLS scope checks pass.
  const { data: operatorProfile } = await supabase
    .from("profiles")
    .select("county,district")
    .eq("id", operatorId)
    .maybeSingle();
  const withOperatorGeography = (row: Record<string, unknown>) => ({
    ...row,
    county: row.county ?? (operatorProfile as { county?: string | null } | null)?.county ?? null,
    district: row.district ?? (operatorProfile as { district?: string | null } | null)?.district ?? null,
  });

  const syncedFarmerIds = new Map<string, string>();
  for (const f of (await db.getAll("pending_farmers")) as Array<QueuedRecord & { server_id?: string }>) {
    if (f?.synced && f.server_id) syncedFarmerIds.set(f.client_id, f.server_id);
  }

  async function process(
    store: QueueStoreName,
    table: "farmers" | "plots" | "rice_production_records",
    queued: QueuedRecord[],
    prepare: (r: QueuedRecord) => Promise<Record<string, unknown> | string>,
    onSynced?: (r: QueuedRecord, serverId: string) => Promise<void>,
  ) {
    for (const r of queued) {
      if ((r.sync_attempts ?? 0) >= MAX_SYNC_ATTEMPTS) {
        failed += 1;
        errors.push(`manual_review:${r.client_id} exceeded retry limit (manual review).`);
        continue;
      }
      const owner = queuedOwner(r);
      if (owner && owner !== operatorId) {
        // Never re-attribute another operator's capture to whoever is signed in on a shared device.
        failed += 1;
        errors.push(`${table}:${r.client_id} was captured by another operator; sign in as that operator to sync it.`);
        continue;
      }
      const prepared = await prepare(r);
      const outcome: ReplayOutcome =
        typeof prepared === "string" ? { ok: false, error: prepared } : await replayRow(table, r, prepared);
      if (outcome.ok) {
        await db.put(store, { ...r, synced: true, server_id: outcome.serverId } as any);
        synced += 1;
        if (onSynced) await onSynced(r, outcome.serverId);
      } else {
        await db.put(store, { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
        failed += 1;
        errors.push(`${table}:${outcome.error}`);
      }
    }
  }

  // Farmers first: plots and production records depend on their server ids.
  await process(
    "pending_farmers",
    "farmers",
    farmers,
    async (r) => withOperatorGeography({ ...(r.data as Record<string, unknown>), registered_by: operatorId }),
    async (r, serverId) => {
      syncedFarmerIds.set(r.client_id, serverId);
      const d = r.data as Record<string, unknown>;
      await ensureOperationalSubmission({
        kind: "register_farmer",
        payload: d,
        entityRefs: { farmer_id: serverId, farmer_client_id: r.client_id },
      });
    },
  );

  await process(
    "pending_plots",
    "plots",
    plots,
    async (r) => {
      const d = { ...(r.data as Record<string, unknown>) };
      const farmerRef = String(d.farmer_id ?? "").trim();
      const farmerId = farmerRef ? await resolveFarmerId(farmerRef, syncedFarmerIds) : null;
      if (!farmerId) return "farmer for this boundary has not synced yet";
      return { ...d, farmer_id: farmerId, registered_by: operatorId };
    },
    async (r) => {
      const plotData = r.data as Record<string, unknown>;
      const farmerRef = String(plotData.farmer_id ?? "").trim();
      const farmerId = syncedFarmerIds.get(farmerRef) ?? farmerRef;
      const props = (plotData.polygon_geojson as { properties?: Record<string, unknown> } | undefined)?.properties;
      await ensureOperationalSubmission({
        kind: "farm_boundary_capture",
        payload: plotData,
        entityRefs: {
          farmer_id: farmerId,
          plot_client_id: String(r.client_id),
          captured_at: String(props?.captured_at ?? r.created_at),
        },
      });
    },
  );

  await process(
    "pending_production_records",
    "rice_production_records",
    records,
    async (r) => {
      const d = { ...(r.data as Record<string, unknown>) };
      const farmerRef = String(d.farmer_id ?? "").trim();
      const farmerId = farmerRef ? await resolveFarmerId(farmerRef, syncedFarmerIds) : null;
      if (!farmerId) return "farmer for this production record has not synced yet";
      return { ...d, farmer_id: farmerId, recorded_by: operatorId };
    },
  );

  await purgeSyncedRecords();
  return { synced, failed, errors };
}

/**
 * Synced captures contain farmer PII; keep them on the device only while an
 * unsynced dependent still needs the farmer's server id.
 */
async function purgeSyncedRecords(): Promise<void> {
  const db = await getDB();
  const pendingPlots = await getUnsynced("pending_plots");
  const pendingRecords = await getUnsynced("pending_production_records");
  const referenced = new Set(
    [...pendingPlots, ...pendingRecords].map((r) => String((r.data as Record<string, unknown>).farmer_id ?? "")),
  );
  for (const store of ["pending_plots", "pending_production_records"] as const) {
    for (const r of (await db.getAll(store)) as QueuedRecord[]) {
      if (r?.synced) await db.delete(store, r.client_id);
    }
  }
  for (const r of (await db.getAll("pending_farmers")) as QueuedRecord[]) {
    if (r?.synced && !referenced.has(r.client_id)) await db.delete("pending_farmers", r.client_id);
  }
}

export async function getPendingCount(): Promise<number> {
  const [farmers, plots, records] = await Promise.all([
    getUnsynced("pending_farmers"),
    getUnsynced("pending_plots"),
    getUnsynced("pending_production_records"),
  ]);
  return farmers.length + plots.length + records.length;
}

export async function getSyncErrors(): Promise<string[]> {
  const db = await getDB();
  const stores: QueueStoreName[] = ["pending_farmers", "pending_plots", "pending_production_records"];
  const msgs: string[] = [];
  for (const store of stores) {
    const all = (await db.getAll(store)) as any[];
    for (const r of all ?? []) {
      if (!r) continue;
      if (r.synced === true) continue;
      if ((r.sync_attempts ?? 0) >= 5) msgs.push(`${store}:${String(r.client_id)} exceeded retry limit`);
    }
  }
  return msgs;
}

const QUEUE_CLEAR_KEY = "av_offline_queue_clear_at";

/** Pilot UX: timestamp when the offline queue last became empty (local clock). */
export function recordQueueClearTimestamp(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(QUEUE_CLEAR_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function readQueueClearTimestamp(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(QUEUE_CLEAR_KEY);
  } catch {
    return null;
  }
}

