"use client";

import * as React from "react";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";
import EnterpriseDataGrid from "@/components/operations/EnterpriseDataGrid";
import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LookupRow = { label: string; table: string; id: string; summary: string };

const LOOKUP_COLS: GridColumn<LookupRow>[] = [
  { key: "table", header: "Table" },
  { key: "id", header: "ID" },
  { key: "summary", header: "Summary" },
];

function MiniCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
      <div className="font-display text-[14px] font-semibold text-white">{title}</div>
      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}

export default function AuditToolsClient() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hits, setHits] = React.useState<LookupRow[]>([]);

  const lookup = async () => {
    const needle = q.trim();
    if (!needle) return;
    setLoading(true);
    setError(null);
    setHits([]);
    try {
      const supabase = getSupabaseBrowserClient();
      const tasks = await Promise.allSettled([
        supabase.from("farmers").select("id, full_name, registry_public_id").ilike("registry_public_id", `%${needle}%`).limit(12),
        supabase.from("lots").select("id, lot_code, status").ilike("lot_code", `%${needle}%`).limit(12),
        supabase.from("movements").select("id, lot_id, status").ilike("id", `%${needle}%`).limit(8),
        supabase.from("audit_log").select("id, action, table_name, created_at").ilike("action", `%${needle}%`).limit(20),
        supabase.from("donor_shipments").select("id, donor_name, programme_code, received_at").ilike("programme_code", `%${needle}%`).limit(12),
        supabase.from("distribution_logs").select("id, channel, distributed_at, quantity").ilike("channel", `%${needle}%`).limit(12),
        supabase.from("field_reports").select("id, county, summary, submitted_at").ilike("summary", `%${needle}%`).limit(12),
        supabase.from("geo_locations").select("id, farmer_id, captured_at").ilike("farmer_id", `%${needle}%`).limit(10),
        supabase.from("warehouse_transfer_orders").select("id, transfer_code, status").ilike("transfer_code", `%${needle}%`).limit(12),
        supabase.from("inventory_movements").select("id, movement_type, reference, created_at").ilike("reference", `%${needle}%`).limit(12),
      ]);

      const out: LookupRow[] = [];
      for (const r of tasks) {
        if (r.status !== "fulfilled") continue;
        const res = r.value as { data: Record<string, unknown>[] | null; error: unknown };
        if (!res?.data?.length) continue;
        const rows = res.data as Record<string, unknown>[];

        // Heuristic: inspect row keys to label the table.
        const sample = rows[0] ?? {};
        const table =
          "lot_code" in sample
            ? "lots"
            : "registry_public_id" in sample
              ? "farmers"
              : "programme_code" in sample
                ? "donor_shipments"
                : "distributed_at" in sample
                  ? "distribution_logs"
                  : "summary" in sample
                    ? "field_reports"
                    : "captured_at" in sample
                      ? "geo_locations"
                      : "transfer_code" in sample
                        ? "warehouse_transfer_orders"
                        : "movement_type" in sample
                          ? "inventory_movements"
                          : "table_name" in sample
                            ? "audit_log"
                            : "movements";

        for (const row of rows) {
          const id = String(row.id ?? "");
          const summary =
            table === "farmers"
              ? `${String(row.registry_public_id ?? "—")} · ${String(row.full_name ?? "—")}`
              : table === "lots"
                ? `${String(row.lot_code ?? "—")} · ${String(row.status ?? "—")}`
                : table === "audit_log"
                  ? `${String(row.action ?? "—")} · ${String(row.table_name ?? "—")} · ${String(row.created_at ?? "").slice(0, 10)}`
                  : table === "donor_shipments"
                    ? `${String(row.programme_code ?? "—")} · ${String(row.donor_name ?? "—")} · ${String(row.received_at ?? "")}`
                    : table === "distribution_logs"
                      ? `${String(row.channel ?? "—")} · qty ${String(row.quantity ?? "—")} · ${String(row.distributed_at ?? "").slice(0, 10)}`
                      : table === "field_reports"
                        ? `${String(row.county ?? "—")} · ${String(row.summary ?? "").slice(0, 80)}`
                        : table === "geo_locations"
                          ? `Farmer ${String(row.farmer_id ?? "—")} · ${String(row.captured_at ?? "")}`
                          : table === "warehouse_transfer_orders"
                            ? `${String(row.transfer_code ?? "—")} · ${String(row.status ?? "—")}`
                            : table === "inventory_movements"
                              ? `${String(row.movement_type ?? "—")} · ${String(row.reference ?? "—")}`
                              : `${Object.entries(row)
                                  .slice(0, 2)
                                  .map(([k, v]) => `${k}=${String(v ?? "")}`)
                                  .join(" · ")}`;
          out.push({ label: "", table, id, summary });
        }
      }

      setHits(out.slice(0, 120));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MinistryPageShell
      title="Audit tools"
      description="Read-only oversight toolkit: traceability lookup, inventory movement audit, DAO submission history, subsidy verification chain, and warehouse transaction history."
      actions={
        <a
          href="/api/reports/compliance-oversight"
          className="h-10 rounded-lg border border-emerald-700/45 bg-emerald-950/40 px-4 text-[12px] text-emerald-100 hover:bg-emerald-950/60 inline-flex items-center"
        >
          PDF compliance report
        </a>
      }
    >
      <div className="space-y-8 pb-10">
        <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-950/85 via-slate-900/40 to-slate-950/70 p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.26em] text-emerald-300/75">Read-only access</div>
          <h2 className="mt-2 font-display text-[16px] font-semibold text-white">Traceability lookup</h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-400">
            Search across registry IDs, lot codes, programme codes, and operational references. Results are governed by RLS — missing
            tables indicate role redaction rather than data loss.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Lookup: NIM-0001, TRF-*, programme code, lot code…"
              className="h-10 w-[min(520px,100%)] rounded-lg border border-slate-600 bg-slate-950 px-3 text-[12px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={() => void lookup()}
              disabled={!q.trim() || loading}
              className="h-10 rounded-lg bg-emerald-700 px-4 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setHits([]);
                setError(null);
              }}
              className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-100 hover:bg-slate-900"
            >
              Clear
            </button>
          </div>
          {error ? <div className="mt-3 rounded-lg border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-[12px] text-rose-200">{error}</div> : null}
          {hits.length ? (
            <div className="mt-4">
              <EnterpriseDataGrid rows={hits} columns={LOOKUP_COLS} filename="traceability-lookup.csv" title="Lookup hits" />
            </div>
          ) : (
            <div className="mt-4 text-[11px] text-slate-600 font-mono">No hits yet.</div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <MiniCard
            title="Inventory movement audit"
            body="Read-only ledger from inventory_movements. Some roles (donor/auditor) may be redacted by policy; use distribution_logs and donor_shipments for programme transparency."
          />
          <MiniCard
            title="DAO submission history"
            body="Field reports and rice production records by county and timestamp. Auditors can review cadence without any ability to mutate operational state."
          />
          <MiniCard
            title="Subsidy verification chain"
            body="distribution_logs + geo_locations + audit_log references. Cross-check channel tags, evidence refs, and custody trails."
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">DAO submission history (field_reports)</div>
            <div className="mt-3">
              <LiveQueryGrid
                table="field_reports"
                select="submitted_at,county,summary,channel,officer_profile_id"
                columns={[
                  { key: "submitted_at", header: "When" },
                  { key: "county", header: "County" },
                  { key: "channel", header: "Channel" },
                  { key: "summary", header: "Summary" },
                  { key: "officer_profile_id", header: "Officer" },
                ]}
                filename="dao-field-reports.csv"
                limit={200}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Subsidy verification chain (distribution_logs)</div>
            <div className="mt-3">
              <LiveQueryGrid
                table="distribution_logs"
                select="distributed_at,quantity,channel,warehouse_id,inventory_item_id,farmer_id,created_by"
                columns={[
                  { key: "distributed_at", header: "When" },
                  { key: "quantity", header: "Qty" },
                  { key: "channel", header: "Channel" },
                  { key: "warehouse_id", header: "Warehouse" },
                  { key: "inventory_item_id", header: "Item" },
                  { key: "farmer_id", header: "Farmer" },
                  { key: "created_by", header: "Actor" },
                ]}
                filename="subsidy-distribution-logs.csv"
                limit={200}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Warehouse transaction history (warehouse_transfer_orders)</div>
            <div className="mt-3">
              <LiveQueryGrid
                table="warehouse_transfer_orders"
                select="requested_at,transfer_code,status,quantity,warehouse_from,warehouse_to,sku_code,inventory_item_id"
                columns={[
                  { key: "requested_at", header: "When" },
                  { key: "transfer_code", header: "TRF" },
                  { key: "status", header: "Status" },
                  { key: "sku_code", header: "SKU" },
                  { key: "quantity", header: "Qty" },
                  { key: "warehouse_from", header: "From" },
                  { key: "warehouse_to", header: "To" },
                ]}
                filename="warehouse-transfer-orders.csv"
                limit={200}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
            <div className="font-display text-[14px] font-semibold text-white">Audit log (audit_log)</div>
            <p className="mt-1 text-[11px] text-slate-500">Immutable audit stream (RLS governs visibility by role).</p>
            <div className="mt-3">
              <LiveQueryGrid
                table="audit_log"
                select="created_at,user_id,action,table_name,record_id"
                columns={[
                  { key: "created_at", header: "When" },
                  { key: "user_id", header: "Actor" },
                  { key: "action", header: "Action" },
                  { key: "table_name", header: "Table" },
                  { key: "record_id", header: "Record" },
                ]}
                filename="audit-log.csv"
                limit={200}
              />
            </div>
          </div>
        </section>
      </div>
    </MinistryPageShell>
  );
}

