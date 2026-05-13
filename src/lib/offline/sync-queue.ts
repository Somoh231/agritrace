import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

export async function processSyncQueue(): Promise<{ synced: number; failed: number; errors: string[] }> {
  const db = await getDB();

  const [farmers, plots, records] = await Promise.all([
    getUnsynced("pending_farmers"),
    getUnsynced("pending_plots"),
    getUnsynced("pending_production_records"),
  ]);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  // Batch sync via Supabase Edge Function (more reliable than one-by-one).
  const supabase = getSupabaseBrowserClient();

  const flaggedFarmers = farmers.filter((r) => (r.sync_attempts ?? 0) >= 5);
  const flaggedPlots = plots.filter((r) => (r.sync_attempts ?? 0) >= 5);
  const flaggedRecords = records.filter((r) => (r.sync_attempts ?? 0) >= 5);
  for (const r of [...flaggedFarmers, ...flaggedPlots, ...flaggedRecords]) {
    failed += 1;
    errors.push(`manual_review:${r.client_id} exceeded retry limit (manual review).`);
  }

  const batchFarmers = farmers
    .filter((r) => (r.sync_attempts ?? 0) < 5)
    .map((r) => ({ ...(r.data as any), client_id: r.client_id }));
  const batchPlots = plots
    .filter((r) => (r.sync_attempts ?? 0) < 5)
    .map((r) => ({ ...(r.data as any), client_id: r.client_id }));
  const batchRecords = records
    .filter((r) => (r.sync_attempts ?? 0) < 5)
    .map((r) => ({ ...(r.data as any), client_id: r.client_id }));

  if (batchFarmers.length || batchPlots.length || batchRecords.length) {
    const { data, error } = await supabase.functions.invoke("sync-batch", {
      body: {
        farmers: batchFarmers,
        plots: batchPlots,
        production_records: batchRecords,
      },
    });

    if (error) {
      const msg = error.message ?? "sync-batch failed";
      // Increment attempts for all sent records.
      for (const r of farmers.filter((r) => (r.sync_attempts ?? 0) < 5)) {
        await db.put("pending_farmers", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
      }
      for (const r of plots.filter((r) => (r.sync_attempts ?? 0) < 5)) {
        await db.put("pending_plots", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
      }
      for (const r of records.filter((r) => (r.sync_attempts ?? 0) < 5)) {
        await db.put("pending_production_records", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
      }
      failed += batchFarmers.length + batchPlots.length + batchRecords.length;
      errors.push(`sync-batch:${msg}`);
    } else {
      const rf = (data as any)?.farmers;
      const rp = (data as any)?.plots;
      const rr = (data as any)?.production_records;

      const farmersOk = !(rf?.errors?.length);
      const plotsOk = !(rp?.errors?.length);
      const recordsOk = !(rr?.errors?.length);

      if (farmersOk) {
        for (const r of farmers.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_farmers", { ...r, synced: true } as any);
        }
        synced += batchFarmers.length;
      } else {
        for (const r of farmers.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_farmers", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
        }
        failed += batchFarmers.length;
        for (const e of (rf?.errors ?? []) as string[]) errors.push(`farmers:${e}`);
      }

      if (plotsOk) {
        for (const r of plots.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_plots", { ...r, synced: true } as any);
        }
        synced += batchPlots.length;
      } else {
        for (const r of plots.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_plots", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
        }
        failed += batchPlots.length;
        for (const e of (rp?.errors ?? []) as string[]) errors.push(`plots:${e}`);
      }

      if (recordsOk) {
        for (const r of records.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_production_records", { ...r, synced: true } as any);
        }
        synced += batchRecords.length;
      } else {
        for (const r of records.filter((r) => (r.sync_attempts ?? 0) < 5)) {
          await db.put("pending_production_records", { ...r, sync_attempts: (r.sync_attempts ?? 0) + 1 } as any);
        }
        failed += batchRecords.length;
        for (const e of (rr?.errors ?? []) as string[]) errors.push(`production_records:${e}`);
      }
    }
  }

  return { synced, failed, errors };
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

