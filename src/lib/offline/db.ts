import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface AgriVaultDB extends DBSchema {
  pending_farmers: {
    key: string; // client_id (UUID generated on device)
    value: {
      client_id: string;
      data: Record<string, unknown>;
      created_at: string;
      sync_attempts: number;
      synced: boolean;
    };
  };
  pending_production_records: {
    key: string;
    value: {
      client_id: string;
      data: Record<string, unknown>;
      created_at: string;
      sync_attempts: number;
      synced: boolean;
    };
  };
  pending_plots: {
    key: string;
    value: {
      client_id: string;
      data: Record<string, unknown>;
      created_at: string;
      sync_attempts: number;
      synced: boolean;
    };
  };
}

let db: IDBPDatabase<AgriVaultDB>;

export async function getDB() {
  if (!db) {
    db = await openDB<AgriVaultDB>("agrivault-offline", 1, {
      upgrade(db) {
        db.createObjectStore("pending_farmers", { keyPath: "client_id" });
        db.createObjectStore("pending_production_records", { keyPath: "client_id" });
        db.createObjectStore("pending_plots", { keyPath: "client_id" });
      },
    });
  }
  return db;
}

