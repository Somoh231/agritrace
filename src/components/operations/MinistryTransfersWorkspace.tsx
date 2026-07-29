"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Map, Package } from "lucide-react";

import {
  AlertCard,
  DashboardPanel,
  DataSourceBadge,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import { OperationalRiskChipRow } from "@/components/operations/OperationalRiskChip";
import TransferCustodyPanel from "@/components/logistics/TransferCustodyPanel";
import TransferStatusPipeline, { buildTransferStatusCounts } from "@/components/logistics/TransferStatusPipeline";
import {
  toTransferGridRow,
  transferActionToPermission,
  transferOperationalContext,
  transferStatusTone,
  type TransferGridRow,
} from "@/components/logistics/transfer-workspace-utils";
import { RegistryKpiStrip } from "@/components/registry";
import { useTransferOrders, type TransferOrdersResult } from "@/features/transfers/hooks/use-transfer-orders";
import { useOperationalActor } from "@/lib/ops/operational-actor-context";
import { canPerform } from "@/lib/ops/permissions";
import { postTransferWorkflow } from "@/lib/ops/workflow-api-client";
import type { TransferOrderView, TransferWorkflowStatus } from "@/lib/logistics/types";
import { operationalQueryKeys } from "@/platform/query-keys";

export default function MinistryTransfersWorkspace() {
  const searchParams = useSearchParams();
  const codeFilter = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const queryClient = useQueryClient();
  const actor = useOperationalActor();
  const [workflowErr, setWorkflowErr] = React.useState<string | null>(null);
  const { data: ordersResult, isPending, isError, error } = useTransferOrders();
  const orders = React.useMemo(() => ordersResult?.data ?? [], [ordersResult]);
  const transferSource = ordersResult?.source;

  const rows = React.useMemo(() => orders.map(toTransferGridRow), [orders]);

  const filteredRows = React.useMemo(
    () =>
      codeFilter ? rows.filter((r) => String(r.transferCode).toUpperCase().includes(codeFilter)) : rows,
    [rows, codeFilter],
  );

  const statusCounts = React.useMemo(() => buildTransferStatusCounts(orders), [orders]);

  const patchOrder = React.useCallback(
    (id: string, next: TransferWorkflowStatus, note: string) => {
      queryClient.setQueryData<TransferOrdersResult>(operationalQueryKeys.transfers.list(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((o) => {
            if (o.id !== id) return o;
            const iso = new Date().toISOString();
            const patch: Partial<TransferOrderView> = { status: next };
            if (next === "approved") patch.approvedAt = iso;
            if (next === "dispatched") patch.dispatchedAt = iso;
            if (next === "delivered") patch.deliveredAt = iso;
            if (next === "completed") patch.completedAt = iso;
            return { ...o, ...patch, notes: note || o.notes };
          }),
        };
      });
    },
    [queryClient],
  );

  const runWorkflow = React.useCallback(
    async (
      id: string,
      action: "approve" | "reject" | "escalate" | "dispatch" | "mark_received" | "verify" | "investigate",
    ) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      if (order.source !== "supabase" || !/^[0-9a-f-]{36}$/i.test(order.id)) {
        setWorkflowErr("Canonical and offline transfer examples are read-only in the national ledger. Select a live Supabase transfer to record custody.");
        return;
      }
      const ctx = transferOperationalContext(order);
      const perm = transferActionToPermission(action);
      if (!canPerform(actor, perm, ctx)) return;

      let next: TransferWorkflowStatus | null = null;
      let note = "";
      switch (action) {
        case "approve":
          next = "approved";
          note = "Approved — county logistics chain updated.";
          break;
        case "reject":
          next = "disputed";
          note = "Rejected — corridor investigation opened.";
          break;
        case "escalate":
          next = "disputed";
          note = "Escalated — ministry oversight engaged.";
          break;
        case "dispatch":
          next = "dispatched";
          note = "Dispatched — seal custody transferred.";
          break;
        case "mark_received":
          next = "delivered";
          note = "Receiving bay confirmation logged.";
          break;
        case "verify":
          next = "completed";
          note = "National reconcile verified.";
          break;
        case "investigate":
          next = "disputed";
          note = "Investigation assigned — custody preserved.";
          break;
        default:
          break;
      }
      if (!next) return;

      const key = operationalQueryKeys.transfers.list();
      const prev = queryClient.getQueryData<TransferOrdersResult>(key);
      setWorkflowErr(null);

      patchOrder(id, next, note);

      const result = await postTransferWorkflow({ transferId: id, action });

      if (!result.ok) {
        if (prev) queryClient.setQueryData(key, prev);
        setWorkflowErr(`Workflow denied (${result.code}) — ${result.message}`);
        return;
      }
      if (!result.persisted) {
        if (prev) queryClient.setQueryData(key, prev);
        setWorkflowErr("The server did not persist this custody decision; the local preview was reverted.");
        return;
      }

      queryClient.setQueryData<TransferOrdersResult>(key, (curr) => {
        if (!curr) return curr;
        return {
          ...curr,
          data: curr.data.map((o) => (o.id === result.order.id ? result.order : o)),
        };
      });
    },
    [actor, orders, patchOrder, queryClient],
  );

  const columns: GridColumn<TransferGridRow>[] = [
    { key: "transferCode", header: "Transfer ID", width: "140px" },
    { key: "category", header: "Corridor type" },
    { key: "corridorCounty", header: "Lane county" },
    { key: "origin", header: "Source WH" },
    { key: "destination", header: "Destination WH" },
    { key: "sku", header: "SKU" },
    { key: "quantity", header: "Qty" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge tone={transferStatusTone(String(row.status))}>{String(row.status)}</StatusBadge>,
    },
    {
      key: "requestedAt",
      header: "Requested",
      render: (row) => <span className="font-mono text-[10px]">{String(row.requestedAt).slice(0, 19).replace("T", " ")}</span>,
    },
    {
      key: "posture",
      header: "Risk / posture",
      render: (row) => <OperationalRiskChipRow variants={row._detail.chips} />,
    },
  ];

  const disputed = orders.filter((o) => o.status === "disputed").length;
  const inTransit = orders.filter((o) => o.status === "in_transit" || o.status === "dispatched").length;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Chain of custody · National logistics"
        title="National transfer trace"
        description="Ministry-grade fertilizer, seed, donor inventory, and redistribution custody — TRF identifiers, verification checkpoints, receiving attestations, and audit-grade workflow actions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {transferSource ? <DataSourceBadge source={transferSource} /> : null}
            <Link href="/map" className="inline-flex h-10 items-center gap-2 rounded-lg btn-gov-outline px-4 text-[12px]">
              <Map className="h-4 w-4" aria-hidden />
              Map corridors
            </Link>
            <Link href="/inventory" className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[12px] font-semibold">
              <Package className="h-4 w-4" aria-hidden />
              Warehouse command
            </Link>
          </div>
        }
      />

      {actor.role === "donor_observer" ? (
        <AlertCard tone="info" title="Donor observer posture">
          Corridor ledger is read-only. Custody mutations require logistics or county ministry roles.
        </AlertCard>
      ) : null}

      {workflowErr ? <AlertCard tone="danger" title="Workflow error">{workflowErr}</AlertCard> : null}

      {isError ? (
        <AlertCard tone="danger" title="Transfer ledger unavailable">
          {error instanceof Error ? error.message : "Unknown error loading transfers."}
        </AlertCard>
      ) : null}

      {codeFilter ? (
        <AlertCard tone="info" title="Active filter">
          Showing transfers matching <strong>{codeFilter}</strong>.{" "}
          <Link href="/transfers" className="font-medium text-forest-700 hover:underline">
            Clear filter
          </Link>
        </AlertCard>
      ) : null}

      <RegistryKpiStrip
        items={[
          { label: "Legs in scope", value: String(filteredRows.length), hint: "Current filter" },
          { label: "In transit", value: String(inTransit), hint: "Dispatched or corridor", deltaTone: "neutral" },
          { label: "Disputed", value: String(disputed), hint: "Investigation queue", deltaTone: disputed ? "down" : "up" },
          { label: "Verified", value: String(statusCounts.completed ?? 0), hint: "Reconciled custody", deltaTone: "up" },
        ]}
      />

      <DashboardPanel>
        <SectionHeader kicker="Custody pipeline" title="Transfer status pipeline" subtitle="National workflow posture across all TRF legs" />
        {isPending ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="mt-4">
            <TransferStatusPipeline counts={statusCounts} />
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader
            kicker="TRF ledger"
            title="Chain-of-custody transfers"
            subtitle={`${filteredRows.length} legs · grouped by workflow status`}
          />
        </div>

        {isPending ? (
          <div className="p-8 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No transfers in scope"
              description="Adjust corridor filters or open the warehouse command center to initiate a new TRF leg."
              action={
                <Link href="/inventory" className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                  Warehouse command
                </Link>
              }
            />
          </div>
        ) : (
          <EnterpriseDataGrid<TransferGridRow>
            rows={filteredRows}
            columns={columns}
            filename="national-transfers.csv"
            dense
            theme="light"
            stickyHeader
            groupHeaderKey="status"
            groupHeaderTitle="Status"
            getRowKey={(row) => String(row.id)}
            renderExpanded={(row) => (
              <TransferCustodyPanel detail={row._detail} actor={actor} onWorkflow={(id, action) => void runWorkflow(id, action)} />
            )}
          />
        )}
      </DashboardPanel>
    </div>
  );
}
