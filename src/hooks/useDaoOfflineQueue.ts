"use client";

import * as React from "react";

const QUEUE_KEY = "agrivault-dao-offline-queue";

export type QueuedDaoPayload = {
  id: string;
  kind: "farmer_registration" | "field_inspection" | "subsidy_distribution";
  payload: Record<string, unknown>;
  createdAt: string;
};

export function useDaoOfflineQueue() {
  const [queued, setQueued] = React.useState<QueuedDaoPayload[]>([]);

  const reload = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      setQueued(raw ? (JSON.parse(raw) as QueuedDaoPayload[]) : []);
    } catch {
      setQueued([]);
    }
  }, []);

  React.useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === QUEUE_KEY) reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

  const enqueue = React.useCallback((item: Omit<QueuedDaoPayload, "id" | "createdAt"> & { id?: string }) => {
    const row: QueuedDaoPayload = {
      id: item.id ?? crypto.randomUUID(),
      kind: item.kind,
      payload: item.payload,
      createdAt: new Date().toISOString(),
    };
    try {
      const prevRaw = localStorage.getItem(QUEUE_KEY);
      const prev = prevRaw ? (JSON.parse(prevRaw) as QueuedDaoPayload[]) : [];
      const next = [...prev, row];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
      setQueued(next);
    } catch {
      /* ignore */
    }
    return row.id;
  }, []);

  const clearSynced = React.useCallback((id: string) => {
    try {
      const prevRaw = localStorage.getItem(QUEUE_KEY);
      const prev = prevRaw ? (JSON.parse(prevRaw) as QueuedDaoPayload[]) : [];
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
      setQueued(next);
    } catch {
      /* ignore */
    }
  }, []);

  const online = typeof navigator !== "undefined" ? navigator.onLine : true;

  return { queued, enqueue, clearSynced, reload, online };
}
