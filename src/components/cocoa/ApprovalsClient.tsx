"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { insertClientAuditLog } from "@/lib/audit/clientAudit";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { LotExportApprovalStatus, Profile, UserRole, VarianceReviewStatus } from "@/lib/supabase/types";
import { formatWeight } from "@/lib/utils/formatters";
import { calculateVariancePct } from "@/lib/utils/reconciliation";

const VARIANCE_SUPERVISOR_PCT = 3;

function canSupervise(role: UserRole) {
  return (
    role === "super_admin" ||
    role === "admin" || // TEMP DEMO FALLBACK
    role === "ministry_officer" ||
    role === "government_officer" ||
    role === "cooperative_manager" ||
    role === "exporter"
  );
}

export default function ApprovalsClient() {
  const [profile, setProfile] = React.useState<Pick<Profile, "id" | "role"> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [lots, setLots] = React.useState<any[]>([]);
  const [movements, setMovements] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: me } = await supabase.from("profiles").select("id,role").eq("id", user.id).single();
      // TEMP DEMO FALLBACK — missing profiles row
      const resolved =
        me ??
        ({
          id: user.id,
          role: buildDemoProfileForAuthUser(user).role,
        } as Pick<Profile, "id" | "role">);
      setProfile(resolved as any);

      const { data: lotRows, error: lotErr } = await supabase
        .from("lots")
        .select("id,lot_code,status,commodity,export_approval_status,organization_id")
        .eq("commodity", "cocoa")
        .order("created_at", { ascending: false })
        .limit(200);
      if (lotErr) throw lotErr;

      const { data: movRows, error: movErr } = await supabase
        .from("movements")
        .select(
          "id,lot_id,status,weight_kg_dispatched,weight_kg_received,variance_review_status,receiver_confirmed_at,lots(lot_code)",
        )
        .order("created_at", { ascending: false })
        .limit(400);
      if (movErr) throw movErr;

      setLots(lotRows ?? []);
      setMovements(movRows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load approvals.");
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

  const exportPendingLots = lots.filter(
    (l) =>
      (l.export_approval_status === "pending" || l.export_approval_status === "none" || !l.export_approval_status) &&
      (l.status === "at_warehouse" || l.status === "processed" || l.status === "in_transit"),
  );

  const receiverPending = movements.filter(
    (m) => m.status === "received" && (m.receiver_confirmed_at == null || m.receiver_confirmed_at === ""),
  );

  const variancePending = movements.filter((m) => {
    if (m.status !== "received" || m.weight_kg_received == null) return false;
    const d = Number(m.weight_kg_dispatched ?? 0);
    const r = Number(m.weight_kg_received ?? 0);
    if (d <= 0) return false;
    const pct = Math.abs(calculateVariancePct(d, r));
    const st = (m.variance_review_status ?? "not_required") as VarianceReviewStatus;
    return pct > VARIANCE_SUPERVISOR_PCT && st !== "approved";
  });

  const supervisor = profile ? canSupervise(profile.role) : false;

  const setLotExportApproval = async (lotId: string, status: LotExportApprovalStatus) => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patch: any = {
      export_approval_status: status,
      export_approved_by: status === "approved" ? user?.id : null,
      export_approved_at: status === "approved" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("lots").update(patch).eq("id", lotId);
    if (error) throw error;
    await insertClientAuditLog({
      action: "LOT_EXPORT_APPROVAL",
      table_name: "lots",
      record_id: lotId,
      new_values: patch,
    });
    await load();
  };

  const confirmReceiver = async (movementId: string) => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patch = {
      receiver_confirmed_at: new Date().toISOString(),
      receiver_confirmed_by: user?.id ?? null,
    };
    const { error } = await supabase.from("movements").update(patch as any).eq("id", movementId);
    if (error) throw error;
    await insertClientAuditLog({
      action: "MOVEMENT_RECEIVER_CONFIRMED",
      table_name: "movements",
      record_id: movementId,
      new_values: patch,
    });
    await load();
  };

  const setVarianceReview = async (movementId: string, status: VarianceReviewStatus) => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patch: any = {
      variance_review_status: status,
      variance_reviewed_by: user?.id ?? null,
      variance_reviewed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("movements").update(patch).eq("id", movementId);
    if (error) throw error;
    await insertClientAuditLog({
      action: "MOVEMENT_VARIANCE_REVIEW",
      table_name: "movements",
      record_id: movementId,
      new_values: patch,
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-[16px] text-gray-900">Approvals</div>
            <div className="text-[12px] text-gray-500">
              Export readiness for lots · receiver confirmation · supervisor variance approval.
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
        {error ? (
          <div className="mt-3">
            <AlertBanner severity="danger" message={error} actions={[{ label: "Retry", onClick: load }]} />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 flex items-center gap-2 text-[12px] text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <Section title="Lot export approval" subtitle="Approve lots before marking export-ready in operations.">
            {exportPendingLots.length === 0 ? (
              <EmptyRow message="No lots awaiting export approval." />
            ) : (
              <div className="divide-y divide-gray-100">
                {exportPendingLots.map((l) => (
                  <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-mono text-[12px] text-blue-700">{l.lot_code}</div>
                      <div className="text-[11px] text-gray-500">
                        status: {l.status} · approval: {l.export_approval_status ?? "none"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!supervisor}
                        onClick={() => setLotExportApproval(l.id, "approved")}
                        className="h-8 px-3 rounded-md bg-forest-700 text-white text-[11px] disabled:opacity-50"
                      >
                        Approve export
                      </button>
                      <button
                        type="button"
                        disabled={!supervisor}
                        onClick={() => setLotExportApproval(l.id, "rejected")}
                        className="h-8 px-3 rounded-md border border-gray-200 bg-white text-[11px] disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={!supervisor}
                        onClick={() => setLotExportApproval(l.id, "pending")}
                        className="h-8 px-3 rounded-md border border-gray-200 bg-white text-[11px] disabled:opacity-50"
                      >
                        Mark pending
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!supervisor ? (
              <div className="mt-2 text-[11px] text-gray-500">Supervisor roles: exporter, cooperative manager, super admin.</div>
            ) : null}
          </Section>

          <Section title="Receiver confirmation" subtitle="Confirm physical receipt for completed movements.">
            {receiverPending.length === 0 ? (
              <EmptyRow message="All received movements are confirmed (or none pending)." />
            ) : (
              <div className="divide-y divide-gray-100">
                {receiverPending.map((m) => (
                  <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-mono text-[12px]">{m.lots?.lot_code ?? m.lot_id}</div>
                      <div className="text-[11px] text-gray-500">movement {m.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmReceiver(m.id)}
                      className="h-8 px-3 rounded-md bg-forest-700 text-white text-[11px]"
                    >
                      Confirm receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="High variance supervisor review" subtitle={`Threshold: > ${VARIANCE_SUPERVISOR_PCT}% absolute variance.`}>
            {variancePending.length === 0 ? (
              <EmptyRow message="No high-variance movements pending review." />
            ) : (
              <div className="divide-y divide-gray-100">
                {variancePending.map((m) => {
                  const d = Number(m.weight_kg_dispatched ?? 0);
                  const r = Number(m.weight_kg_received ?? 0);
                  const pct = calculateVariancePct(d, r);
                  return (
                    <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-mono text-[12px]">{m.lots?.lot_code ?? m.lot_id}</div>
                        <div className="text-[11px] text-gray-500">
                          {formatWeight(d)} → {formatWeight(r)} · {pct.toFixed(1)}% · review:{" "}
                          {m.variance_review_status ?? "not_required"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!supervisor}
                          onClick={() => setVarianceReview(m.id, "approved")}
                          className="h-8 px-3 rounded-md bg-forest-700 text-white text-[11px] disabled:opacity-50"
                        >
                          Approve variance
                        </button>
                        <button
                          type="button"
                          disabled={!supervisor}
                          onClick={() => setVarianceReview(m.id, "rejected")}
                          className="h-8 px-3 rounded-md border border-gray-200 bg-white text-[11px] disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-display text-[15px] text-gray-900">{title}</div>
      <div className="text-[12px] text-gray-500">{subtitle}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-600">{message}</div>;
}
