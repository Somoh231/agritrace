import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { DaoWorkflowRecord } from "@/lib/dao/dao-workflow-types";
import { LEGACY_QUEUE_STORAGE_KEY } from "@/lib/dao/dao-workflow-types";

interface DaoWorkflowDB extends DBSchema {
  dao_queue: {
    key: string;
    value: DaoWorkflowRecord;
    indexes: { "by-status": DaoWorkflowRecord["status"]; "by-updated": string };
  };
}

const DB_NAME = "agrivault-dao-workflows";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DaoWorkflowDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DaoWorkflowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DaoWorkflowDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore("dao_queue", { keyPath: "id" });
        store.createIndex("by-status", "status");
        store.createIndex("by-updated", "updated_at");
      },
    });
  }
  return dbPromise;
}

export async function daoQueuePut(record: DaoWorkflowRecord): Promise<void> {
  const db = await getDb();
  await db.put("dao_queue", record);
}

export async function daoQueueDelete(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("dao_queue", id);
}

export async function daoQueueGetAll(): Promise<DaoWorkflowRecord[]> {
  const db = await getDb();
  const rows = await db.getAll("dao_queue");
  return rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export async function daoQueueGet(id: string): Promise<DaoWorkflowRecord | undefined> {
  const db = await getDb();
  return db.get("dao_queue", id);
}

/** One-time migration from legacy localStorage queue → IndexedDB pending_sync */
export async function migrateLegacyDaoLocalStorageQueue(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_QUEUE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      kind: string;
      payload: Record<string, unknown>;
      createdAt: string;
    }>;
    const kindMap: Record<string, DaoWorkflowRecord["kind"] | undefined> = {
      farmer_registration: "register_farmer",
      field_inspection: "farm_inspection",
      subsidy_distribution: "subsidy_delivery_verify",
    };
    const now = new Date().toISOString();
    for (const row of parsed) {
      const k = kindMap[row.kind];
      if (!k) continue;
      const rec: DaoWorkflowRecord = {
        id: row.id,
        kind: k,
        status: "pending_sync",
        payload: row.payload,
        sync_attempts: 0,
        created_at: row.createdAt ?? now,
        updated_at: now,
        title: legacyTitle(k),
      };
      const existing = await daoQueueGet(rec.id);
      if (!existing) await daoQueuePut(rec);
    }
    window.localStorage.removeItem(LEGACY_QUEUE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function legacyTitle(kind: DaoWorkflowRecord["kind"]): string {
  switch (kind) {
    case "register_farmer":
      return "Farmer registration";
    case "farm_inspection":
      return "Farm inspection";
    case "subsidy_delivery_verify":
      return "Subsidy delivery";
    default:
      return kind;
  }
}
