"use client";

import * as React from "react";

import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import DataTable from "@/components/shared/DataTable";
import Drawer from "@/components/shared/Drawer";
import StatusPill from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ComplianceStatus, LotStatus } from "@/lib/supabase/types";
import { formatDate, formatWeight } from "@/lib/utils/formatters";
import { generateLotCode } from "@/lib/utils/lot-codes";
import { calculateVariancePct, getVarianceSeverity } from "@/lib/utils/reconciliation";
import { PILOT_SEASON } from "@/lib/utils/pilot-config";

type LotRow = {
  id: string;
  lot_code: string;
  origin_name: string;
  origin_county: string | null;
  weight_kg_in: number;
  weight_kg_current: number;
  status: LotStatus;
  compliance_status: ComplianceStatus;
  created_at: string;
};

function lotStatusPill(status: LotStatus) {
  switch (status) {
    case "created":
      return { status: "neutral" as const, label: "Created" };
    case "in_transit":
      return { status: "info" as const, label: "In transit" };
    case "at_warehouse":
      return { status: "ok" as const, label: "At warehouse" };
    case "processed":
      return { status: "ok" as const, label: "Processed" };
    case "exported":
      return { status: "neutral" as const, label: "Exported" };
    case "rejected":
      return { status: "error" as const, label: "Rejected" };
  }
}

function compliancePill(status: ComplianceStatus) {
  switch (status) {
    case "compliant":
      return { status: "ok" as const, label: "Clear" };
    case "non_compliant":
      return { status: "error" as const, label: "Flagged" };
    case "pending_verification":
      return { status: "warning" as const, label: "Pending" };
    case "unchecked":
      return { status: "neutral" as const, label: "Unchecked" };
  }
}

export default function LotRegisterTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [complianceFilter, setComplianceFilter] = React.useState<string>("");
  const [rows, setRows] = React.useState<LotRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selected, setSelected] = React.useState<LotRow | null>(null);
  const [isNewOpen, setIsNewOpen] = React.useState(false);

  const [locations, setLocations] = React.useState<Array<{ id: string; name: string; county: string | null }>>([]);

  const loadLocations = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("locations")
      .select("id,name,county")
      .eq("is_active", true)
      .order("name");
    setLocations((data as any) ?? []);
  }, []);

  const loadLots = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let q = supabase
        .from("lots")
        .select("id, lot_code, weight_kg_in, weight_kg_current, status, compliance_status, created_at, origin_location_id, locations(name, county)")
        .eq("commodity", "cocoa")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter) q = q.eq("status", statusFilter);
      if (complianceFilter) q = q.eq("compliance_status", complianceFilter);

      const { data } = await q;
      const mapped: LotRow[] =
        (data as any[])?.map((r) => ({
          id: r.id,
          lot_code: r.lot_code,
          origin_name: r.locations?.name ?? "—",
          origin_county: r.locations?.county ?? null,
          weight_kg_in: Number(r.weight_kg_in ?? 0),
          weight_kg_current: Number(r.weight_kg_current ?? 0),
          status: r.status,
          compliance_status: r.compliance_status,
          created_at: r.created_at,
        })) ?? [];

      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, complianceFilter]);

  React.useEffect(() => {
    loadLocations();
    loadLots();
  }, [loadLocations, loadLots]);

  const columns = [
    {
      key: "lot_code",
      label: "Lot ID",
      width: "150px",
      render: (v: unknown, row: Record<string, unknown>) => {
        const c = row.compliance_status as ComplianceStatus;
        const cls = c === "non_compliant" ? "text-red-700" : "text-blue-700";
        return <span className={`font-mono text-[11px] ${cls}`}>{String(v ?? "")}</span>;
      },
    },
    {
      key: "origin",
      label: "Origin",
      width: "160px",
      render: (_: unknown, row: Record<string, unknown>) => {
        return (
          <div className="min-w-0">
            <div className="truncate">{String(row.origin_name ?? "—")}</div>
            <div className="text-[11px] text-gray-500 truncate">{String(row.origin_county ?? "")}</div>
          </div>
        );
      },
    },
    {
      key: "weight_kg_in",
      label: "Weight in",
      width: "90px",
      render: (v: unknown) => formatWeight(Number(v ?? 0)),
    },
    {
      key: "weight_kg_current",
      label: "Weight now",
      width: "90px",
      render: (v: unknown) => formatWeight(Number(v ?? 0)),
    },
    {
      key: "variance",
      label: "Var %",
      width: "70px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const dispatched = Number(row.weight_kg_in ?? 0);
        const received = Number(row.weight_kg_current ?? 0);
        const pct = calculateVariancePct(dispatched, received);
        const sev = getVarianceSeverity(pct, dispatched, received);
        const cls =
          sev === "normal" ? "text-green-700" : sev === "warning" ? "text-amber-700" : "text-red-700";
        return <span className={`font-mono ${cls}`}>{pct.toFixed(1)}%</span>;
      },
    },
    {
      key: "status",
      label: "Lot status",
      width: "100px",
      render: (v: unknown) => {
        const p = lotStatusPill(v as LotStatus);
        return <StatusPill status={p.status} label={p.label} />;
      },
    },
    {
      key: "compliance_status",
      label: "EUDR",
      width: "90px",
      render: (v: unknown) => {
        const p = compliancePill(v as ComplianceStatus);
        return <StatusPill status={p.status} label={p.label} />;
      },
    },
    {
      key: "age",
      label: "Age",
      width: "60px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const createdAt = new Date(String(row.created_at ?? ""));
        const days = Number.isNaN(createdAt.getTime())
          ? "—"
          : Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
        return <span className="font-mono">{days}</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardWidgets module="cocoa" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
            <div>
              <div className="font-display text-[16px] text-gray-900">Lot management</div>
              <div className="text-[12px] text-gray-500">Organization-scoped cocoa lots.</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                  Status
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">All</option>
                  {["created", "in_transit", "at_warehouse", "processed", "exported", "rejected"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                  Compliance
                </div>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
                >
                  <option value="">All</option>
                  {["unchecked", "pending_verification", "compliant", "non_compliant"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOpen(true)}
                className="h-9 self-end px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
              >
                + Create lot
              </button>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={isLoading ? [] : (rows as any)}
          emptyMessage={isLoading ? "Loading…" : "No lots found. Create the first lot to start traceability."}
          onRowClick={(r) => setSelected(r as unknown as LotRow)}
        />
      </div>

      <div className="space-y-4">
        <Drawer
          title={selected ? "Lot detail" : "Lot detail"}
          isOpen={Boolean(selected)}
          onClose={() => setSelected(null)}
        >
          {selected ? (
            <div className="space-y-3 text-[12px] text-gray-700">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  Lot
                </div>
                <div className="mt-1 font-mono text-[12px] text-blue-700">{selected.lot_code}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    Created
                  </div>
                  <div className="mt-1">{formatDate(selected.created_at)}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    Origin
                  </div>
                  <div className="mt-1">{selected.origin_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill {...lotStatusPill(selected.status)} />
                <StatusPill {...compliancePill(selected.compliance_status)} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="/cocoa/movements"
                  className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
                >
                  Log movement
                </a>
                <a
                  href="/cocoa/eudr"
                  className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center"
                >
                  Generate DDS
                </a>
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">Select a lot to view details.</div>
          )}
        </Drawer>

        <Drawer title="Create lot" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
          <CreateLotForm
            locations={locations}
            onCreated={() => {
              setIsNewOpen(false);
              loadLots();
            }}
          />
        </Drawer>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">
              Loading
            </div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function CreateLotForm({
  locations,
  onCreated,
}: {
  locations: Array<{ id: string; name: string; county: string | null }>;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [originId, setOriginId] = React.useState<string>(locations[0]?.id ?? "");
  const [weightIn, setWeightIn] = React.useState<string>("1200");
  const [moisture, setMoisture] = React.useState<string>("8.5");
  const [grade, setGrade] = React.useState<string>("Grade 1");
  const [season, setSeason] = React.useState<string>(PILOT_SEASON);
  const [notes, setNotes] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!originId && locations[0]?.id) setOriginId(locations[0].id);
  }, [originId, locations]);

  return (
    <div className="space-y-3">
      {error ? <div className="text-[12px] text-red-700">{error}</div> : null}
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
          Origin location
        </div>
        <select
          value={originId}
          onChange={(e) => setOriginId(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} {l.county ? `· ${l.county}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
            Weight in (kg)
          </div>
          <input
            value={weightIn}
            onChange={(e) => setWeightIn(e.target.value)}
            inputMode="decimal"
            className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]"
          />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
            Moisture (%)
          </div>
          <input
            value={moisture}
            onChange={(e) => setMoisture(e.target.value)}
            inputMode="decimal"
            className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
            Grade
          </div>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
          >
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Reject</option>
          </select>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
            Season
          </div>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]"
          />
        </div>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
          Notes
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-20 w-full rounded-md border border-gray-200 px-2 py-2 text-[12px]"
        />
      </div>
      <button
        type="button"
        disabled={isSaving || !originId}
        onClick={async () => {
          setError(null);
          setIsSaving(true);
          try {
            const supabase = getSupabaseBrowserClient();
            const { data: me } = await supabase.auth.getUser();
            const { data: profile } = await supabase
              .from("profiles")
              .select("organization_id")
              .eq("id", me.user?.id ?? "")
              .single();

            const { data: lastLots } = await supabase
              .from("lots")
              .select("id")
              .eq("commodity", "cocoa")
              .order("created_at", { ascending: false })
              .limit(1);
            const seq = (lastLots?.length ?? 0) + Math.floor(Math.random() * 500 + 1);

            const w = Number(weightIn);
            if (!Number.isFinite(w) || w <= 0) throw new Error("Weight in must be a number > 0.");
            const m = Number(moisture);
            if (!Number.isFinite(m) || m < 0 || m > 30) throw new Error("Moisture must be between 0 and 30.");
            const lotCode = generateLotCode("cocoa", seq);
            const { error: insErr } = await supabase.from("lots").insert({
              lot_code: lotCode,
              commodity: "cocoa",
              origin_location_id: originId,
              organization_id: (profile as any)?.organization_id ?? null,
              weight_kg_in: w,
              weight_kg_current: w,
              moisture_content: m,
              quality_grade: grade,
              status: "created",
              season,
              compliance_status: "unchecked",
              notes: notes || null,
              created_by: me.user?.id ?? null,
            } as any);
            if (insErr) throw insErr;
            toast.success("Lot created", lotCode);
            onCreated();
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to create lot.";
            setError(msg);
            toast.error("Couldn’t create lot", msg);
          } finally {
            setIsSaving(false);
          }
        }}
        className="h-9 w-full rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Create lot"}
      </button>
      <div className="text-[11px] text-gray-500">
        Lot codes use <span className="font-mono">LIB-COC-YYYY-00000</span>.
      </div>
    </div>
  );
}

