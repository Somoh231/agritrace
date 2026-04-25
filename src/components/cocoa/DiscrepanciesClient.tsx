"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { insertClientAuditLog } from "@/lib/audit/clientAudit";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DiscrepancyIssueStatus } from "@/lib/supabase/types";
import { formatWeight } from "@/lib/utils/formatters";
import { calculateVariancePct } from "@/lib/utils/reconciliation";

const VARIANCE_ALERT_PCT = 3;

type IssueRow = {
  id: string;
  movement_id: string;
  lot_id: string | null;
  status: DiscrepancyIssueStatus;
  assigned_to: string | null;
  title: string | null;
  notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  lot_code?: string;
  from_name?: string;
  to_name?: string;
  dispatched?: number;
  received?: number | null;
};

type ProfileOpt = { id: string; full_name: string };

export default function DiscrepanciesClient() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<IssueRow[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileOpt[]>([]);
  const [tableMissing, setTableMissing] = React.useState(false);

  const [selected, setSelected] = React.useState<IssueRow | null>(null);
  const [notes, setNotes] = React.useState("");
  const [resolution, setResolution] = React.useState("");
  const [assignTo, setAssignTo] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { data: profs } = await supabase.from("profiles").select("id,full_name").order("full_name").limit(200);
      setProfiles((profs as any) ?? []);

      const { data, error: issErr } = await supabase
        .from("discrepancy_issues")
        .select(
          "id,movement_id,lot_id,status,assigned_to,title,notes,resolution_notes,resolved_at,created_at,movements(weight_kg_dispatched,weight_kg_received,lots(lot_code),from:locations!movements_from_location_id_fkey(name),to:locations!movements_to_location_id_fkey(name))",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (issErr) {
        if (issErr.message.includes("does not exist") || issErr.code === "42P01") {
          setTableMissing(true);
          setIssues([]);
          return;
        }
        throw issErr;
      }

      setTableMissing(false);
      const mapped =
        (data as any[])?.map((r) => ({
          id: r.id,
          movement_id: r.movement_id,
          lot_id: r.lot_id,
          status: r.status,
          assigned_to: r.assigned_to,
          title: r.title,
          notes: r.notes,
          resolution_notes: r.resolution_notes,
          resolved_at: r.resolved_at,
          created_at: r.created_at,
          lot_code: r.movements?.lots?.lot_code,
          from_name: r.movements?.from?.name,
          to_name: r.movements?.to?.name,
          dispatched: Number(r.movements?.weight_kg_dispatched ?? 0),
          received: r.movements?.weight_kg_received == null ? null : Number(r.movements.weight_kg_received),
        })) ?? [];
      setIssues(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discrepancies.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const onPrimary = () => load();
    window.addEventListener("agritrace-primary-action", onPrimary);
    return () => window.removeEventListener("agritrace-primary-action", onPrimary);
  }, [load]);

  const saveIssue = async (patch: Partial<IssueRow> & { id: string }) => {
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("discrepancy_issues").update(patch as any).eq("id", patch.id);
      if (error) throw error;
      await insertClientAuditLog({
        action: "DISCREPANCY_UPDATE",
        table_name: "discrepancy_issues",
        record_id: patch.id,
        new_values: patch as any,
      });
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-[16px] text-gray-900">Discrepancy resolution</div>
            <div className="text-[12px] text-gray-500">
              Weight variance alerts · assign owner · notes · resolve · audit trail.
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        {tableMissing ? (
          <div className="mt-3">
            <AlertBanner
              severity="warning"
              message='Run SQL file agritrace/src/lib/supabase/schema.integrity.sql to enable discrepancy_issues.'
            />
          </div>
        ) : null}
        {error ? (
          <div className="mt-3">
            <AlertBanner severity="danger" message={error} actions={[{ label: "Retry", onClick: load }]} />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-[12px] text-gray-600 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : issues.length === 0 && !tableMissing ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <div className="text-[12px] font-medium text-gray-900">No open discrepancy tickets</div>
          <div className="mt-1 text-[11px] text-gray-500">
            Create an issue from a high-variance movement using the button below, or from operations review.
          </div>
          <VarianceSuggest onCreated={load} />
        </div>
      ) : !tableMissing ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-[12px] text-gray-700">
              <span className="font-mono">{issues.length}</span> issues
            </div>
            <VarianceSuggest onCreated={load} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Issue</th>
                  <th className="text-left font-medium px-3 py-3">Movement</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3">Owner</th>
                  <th className="text-left font-medium px-4 py-3"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{it.title ?? "Weight variance"}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{it.lot_code ?? "—"}</div>
                      <div className="text-[11px] text-gray-500">
                        {it.from_name} → {it.to_name}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">
                      {it.dispatched != null && it.received != null ? (
                        <>
                          {formatWeight(it.dispatched)} → {formatWeight(it.received)}{" "}
                          <span className="text-red-700">
                            ({calculateVariancePct(it.dispatched, it.received).toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">{it.status}</td>
                    <td className="px-3 py-3">
                      {it.assigned_to ? profiles.find((p) => p.id === it.assigned_to)?.full_name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(it);
                          setNotes(it.notes ?? "");
                          setResolution(it.resolution_notes ?? "");
                          setAssignTo(it.assigned_to ?? "");
                        }}
                        className="h-8 px-2 rounded-md border border-gray-200 bg-white text-[11px] hover:bg-gray-50"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[120] bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white shadow-xl p-5 space-y-3">
            <div className="font-display text-[16px] text-gray-900">Manage discrepancy</div>
            <div className="text-[11px] text-gray-500 font-mono">{selected.id}</div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Assign to</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="">—</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 p-2 text-[12px]"
              />
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Resolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 p-2 text-[12px]"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  await saveIssue({
                    id: selected.id,
                    assigned_to: assignTo || null,
                    notes: notes || null,
                    status: "in_progress" as any,
                  });
                }}
                className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px]"
              >
                Save
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const supabase = getSupabaseBrowserClient();
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  await saveIssue({
                    id: selected.id,
                    assigned_to: assignTo || null,
                    notes: notes || null,
                    resolution_notes: resolution || null,
                    status: "resolved" as any,
                    resolved_at: new Date().toISOString(),
                    resolved_by: user?.id ?? null,
                  } as any);
                }}
                className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px]"
              >
                Mark resolved
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VarianceSuggest({ onCreated }: { onCreated: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setMsg(null);
          setBusy(true);
          try {
            const supabase = getSupabaseBrowserClient();
            const { data: movs, error } = await supabase
              .from("movements")
              .select("id,lot_id,weight_kg_dispatched,weight_kg_received,status")
              .eq("status", "received")
              .not("weight_kg_received", "is", null)
              .limit(200);
            if (error) throw error;

            const { data: existing } = await supabase.from("discrepancy_issues").select("movement_id").limit(500);
            const existingSet = new Set((existing as any[])?.map((e) => e.movement_id));

            let created = 0;
            for (const m of (movs as any[]) ?? []) {
              const d = Number(m.weight_kg_dispatched ?? 0);
              const r = Number(m.weight_kg_received ?? 0);
              if (d <= 0) continue;
              const pct = Math.abs(calculateVariancePct(d, r));
              if (pct <= VARIANCE_ALERT_PCT) continue;
              if (existingSet.has(m.id)) continue;

              const { error: insErr } = await supabase.from("discrepancy_issues").insert({
                movement_id: m.id,
                lot_id: m.lot_id,
                issue_type: "weight_variance",
                status: "open",
                title: `Variance ${pct.toFixed(1)}%`,
              } as any);
              if (insErr) throw insErr;
              existingSet.add(m.id);
              created++;
              await insertClientAuditLog({
                action: "DISCREPANCY_CREATE",
                table_name: "discrepancy_issues",
                record_id: m.id,
                new_values: { movement_id: m.id, pct },
              });
            }
            setMsg(created ? `Created ${created} issue(s) from high-variance movements.` : "No new issues to create.");
            await onCreated();
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Failed to create issues.");
          } finally {
            setBusy(false);
          }
        }}
        className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] disabled:opacity-50"
      >
        {busy ? "Scanning…" : "Scan movements & create issues"}
      </button>
      {msg ? <div className="mt-2 text-[11px] text-gray-600">{msg}</div> : null}
    </div>
  );
}
