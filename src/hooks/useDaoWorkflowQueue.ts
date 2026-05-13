"use client";

import * as React from "react";

import {
  migrateLegacyDaoLocalStorageQueue,
  daoQueueDelete,
  daoQueueGet,
  daoQueueGetAll,
  daoQueuePut,
} from "@/lib/dao/dao-workflow-db";
import type { DaoWorkflowKind, DaoWorkflowRecord, DaoWorkflowStatus } from "@/lib/dao/dao-workflow-types";
import { injectSampleDaoQueueIfEmpty } from "@/lib/dao/dao-sample-workflow";
import { persistWorkflowByKind } from "@/lib/dao/dao-workflow-writers";

function nowIso() {
  return new Date().toISOString();
}

function newWorkflowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `dao-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function titleForDaoWorkflowKind(kind: DaoWorkflowKind): string {
  switch (kind) {
    case "register_farmer":
      return "Register farmer";
    case "farm_inspection":
      return "Farm inspection";
    case "pest_disease_report":
      return "Pest / disease report";
    case "production_estimate":
      return "Production estimate";
    case "subsidy_delivery_verify":
      return "Verify subsidy delivery";
    case "gps_field_evidence":
      return "GPS point / field evidence";
    case "clan_crop_monitoring":
      return "Crop monitoring (CLAN)";
    case "clan_field_activity_report":
      return "Field activity report (CLAN)";
    case "dao_district_summary":
      return "District summary (DAO)";
    case "dao_operational_review":
      return "Operational review (DAO)";
    case "dao_verification_review":
      return "Verification review (DAO)";
    case "dao_district_escalation":
      return "District escalation (DAO)";
    case "cac_county_operational_summary":
      return "County operational summary (CAC)";
    case "cac_county_verification":
      return "County verification (CAC)";
    case "cac_county_escalation":
      return "County escalation (CAC)";
    case "cac_reporting_compliance":
      return "Reporting compliance (CAC)";
    default:
      return kind;
  }
}

export function useDaoWorkflowQueue() {
  const [items, setItems] = React.useState<DaoWorkflowRecord[]>([]);
  const [flushing, setFlushing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    await migrateLegacyDaoLocalStorageQueue();
    await injectSampleDaoQueueIfEmpty();
    const rows = await daoQueueGetAll();
    setItems(rows);
  }, []);

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const put = React.useCallback(
    async (rec: DaoWorkflowRecord) => {
      await daoQueuePut(rec);
      await refresh();
    },
    [refresh],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await daoQueueDelete(id);
      await refresh();
    },
    [refresh],
  );

  const saveDraft = React.useCallback(
    async (kind: DaoWorkflowKind, payload: Record<string, unknown>, title?: string) => {
      const id = `draft-${kind}`;
      const prev = await daoQueueGet(id);
      const rec: DaoWorkflowRecord = {
        id,
        kind,
        status: "draft",
        payload,
        sync_attempts: prev?.sync_attempts ?? 0,
        created_at: prev?.created_at ?? nowIso(),
        updated_at: nowIso(),
        title: title ?? titleForDaoWorkflowKind(kind),
      };
      await put(rec);
    },
    [put],
  );

  const queuePending = React.useCallback(
    async (kind: DaoWorkflowKind, payload: Record<string, unknown>, title?: string, errorHint?: string) => {
      const rec: DaoWorkflowRecord = {
        id: newWorkflowId(),
        kind,
        status: "pending_sync",
        payload,
        sync_attempts: 0,
        created_at: nowIso(),
        updated_at: nowIso(),
        title: title ?? titleForDaoWorkflowKind(kind),
        error_message: errorHint,
      };
      await put(rec);
    },
    [put],
  );

  const markSubmitted = React.useCallback(
    async (kind: DaoWorkflowKind, brief: Record<string, unknown>) => {
      const rec: DaoWorkflowRecord = {
        id: newWorkflowId(),
        kind,
        status: "submitted",
        payload: brief,
        sync_attempts: 0,
        created_at: nowIso(),
        updated_at: nowIso(),
        title: `${titleForDaoWorkflowKind(kind)} · Submitted`,
      };
      await put(rec);
    },
    [put],
  );

  const onRemoteFailure = React.useCallback(
    async (kind: DaoWorkflowKind, payload: Record<string, unknown>, message: string) => {
      await queuePending(kind, payload, undefined, message);
    },
    [queuePending],
  );

  const retryOne = React.useCallback(
    async (row: DaoWorkflowRecord) => {
      const res = await persistWorkflowByKind(row.kind, row.payload);
      const attempts = row.sync_attempts + 1;
      if (res.ok) {
        await daoQueuePut({
          ...row,
          status: "submitted",
          error_message: undefined,
          sync_attempts: attempts,
          updated_at: nowIso(),
          title: `${row.title ?? titleForDaoWorkflowKind(row.kind)} · Submitted`,
        });
      } else {
        await daoQueuePut({
          ...row,
          status: "failed",
          error_message: res.error,
          sync_attempts: attempts,
          updated_at: nowIso(),
        });
      }
      await refresh();
    },
    [refresh],
  );

  const flushPending = React.useCallback(async () => {
    setFlushing(true);
    try {
      const pending = await daoQueueGetAll();
      const todo = pending.filter((x) => x.status === "pending_sync" || x.status === "failed");
      for (const row of todo) {
        await retryOne(row);
      }
      await refresh();
    } finally {
      setFlushing(false);
    }
  }, [refresh, retryOne]);

  const counts = React.useMemo(() => {
    const c: Record<DaoWorkflowStatus, number> = {
      draft: 0,
      pending_sync: 0,
      submitted: 0,
      failed: 0,
    };
    for (const x of items) c[x.status] += 1;
    return c;
  }, [items]);

  return {
    items,
    counts,
    refresh,
    saveDraft,
    queuePending,
    markSubmitted,
    onRemoteFailure,
    remove,
    flushPending,
    flushing,
    retryOne,
  };
}
