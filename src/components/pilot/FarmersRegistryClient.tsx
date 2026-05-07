"use client";

import * as React from "react";

import {
  farmerRegistrationPipeline,
  farmerRegistrySample,
  type FarmerRegistryDemoRow,
} from "@/lib/demo/agriculture-pilot-data";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import OperationDrawer from "@/components/operations/OperationDrawer";
import FarmerProfileDrawer from "@/components/operations/FarmerProfileDrawer";
import RegisterFarmerForm from "@/components/operations/forms/RegisterFarmerForm";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import { OpsMetric, OpsStatusBadge } from "@/components/pilot/pilot-ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const demoCols: GridColumn<FarmerRegistryDemoRow>[] = [
  { key: "fullName", header: "Farmer" },
  {
    key: "registryPublicId",
    header: "Registry ID",
    render: (r) => <span className="font-mono text-[10px] text-slate-400">{r.registryPublicId ?? "—"}</span>,
  },
  { key: "county", header: "County" },
  { key: "district", header: "District / village" },
  { key: "cooperative", header: "Cooperative" },
  {
    key: "daoOfficerCode",
    header: "DAO",
    render: (r) => <span className="font-mono text-[10px]">{r.daoOfficerCode ?? "—"}</span>,
  },
  {
    key: "primaryWarehouseCode",
    header: "Warehouse",
    render: (r) => <span className="font-mono text-[10px]">{r.primaryWarehouseCode ?? "—"}</span>,
  },
  {
    key: "gpsStatus",
    header: "GPS",
    render: (r) => <span className="font-mono text-[10px] uppercase">{r.gpsStatus}</span>,
  },
  { key: "acreage", header: "Ha" },
  { key: "mainCrop", header: "Crop" },
  {
    key: "subsidyEligible",
    header: "Subsidy",
    render: (r) => (r.subsidyEligible ? "Eligible" : "No"),
  },
  {
    key: "verification",
    header: "Verification",
    render: (r) => (
      <OpsStatusBadge
        status={r.verification === "verified" ? "healthy" : r.verification === "pending" ? "warning" : "critical"}
      />
    ),
  },
  { key: "lastFieldVisit", header: "Last activity" },
];

function mapLiveRow(r: Record<string, unknown>, i: number): FarmerRegistryDemoRow {
  const coop = r.cooperative_name != null ? String(r.cooperative_name) : "—";
  return {
    id: String(r.id ?? `row-${i}`),
    fullName: String(r.full_name ?? "Farmer"),
    registryPublicId: r.registry_public_id != null ? String(r.registry_public_id) : undefined,
    daoOfficerCode: r.dao_officer_code != null ? String(r.dao_officer_code) : undefined,
    primaryWarehouseCode: r.primary_warehouse_code != null ? String(r.primary_warehouse_code) : undefined,
    county: String(r.county ?? "—"),
    district: String(r.village ?? r.district ?? "—"),
    cooperative: coop,
    gpsStatus: r.latitude != null && r.longitude != null ? "verified" : "pending",
    acreage: Number(r.acreage_hectares ?? 0) || 0,
    mainCrop: String(r.main_crop ?? "rice"),
    productionHistorySeasons: 0,
    subsidyEligible: Boolean(r.subsidy_eligible),
    verification: String(r.verification_status ?? "pending") as FarmerRegistryDemoRow["verification"],
    lastFieldVisit: String(r.registration_date ?? r.created_at ?? "").slice(0, 10) || "—",
  };
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function FarmersRegistryClient() {
  const [drawer, setDrawer] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [rows, setRows] = React.useState<FarmerRegistryDemoRow[]>(farmerRegistrySample);
  const [usingDemo, setUsingDemo] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("farmers")
        .select(
          "id,registry_public_id,full_name,county,district,village,latitude,longitude,created_at,registration_date,main_crop,acreage_hectares,subsidy_eligible,verification_status,cooperative_name,dao_officer_code,primary_warehouse_code",
        )
        .limit(500);
      if (error || !data?.length) {
        setRows(farmerRegistrySample);
        setUsingDemo(true);
        return;
      }
      setRows((data as Record<string, unknown>[]).map(mapLiveRow));
      setUsingDemo(false);
    } catch {
      setRows(farmerRegistrySample);
      setUsingDemo(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, reload]);

  React.useEffect(() => {
    const open = () => setDrawer(true);
    window.addEventListener("agritrace-primary-action", open);
    return () => window.removeEventListener("agritrace-primary-action", open);
  }, []);

  const p = farmerRegistrationPipeline;

  return (
    <>
      <MinistryPageShell
        title="Farmer registry"
        description="National agricultural registry — verification, geo readiness, and subsidy eligibility. Live rows load from Supabase when present."
        actions={
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="h-10 px-4 rounded-lg bg-emerald-700 text-[13px] font-medium text-white hover:bg-emerald-600"
          >
            Register farmer
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
          <OpsMetric label="Verified (pipeline)" value={Intl.NumberFormat().format(p.verified)} tone="forest" />
          <OpsMetric label="Pending verification" value={Intl.NumberFormat().format(p.pendingVerification)} tone="amber" />
          <OpsMetric label="Geo completion" value={`${p.geoTaggedPct}%`} tone="navy" />
          <OpsMetric label="Flagged" value={Intl.NumberFormat().format(p.flagged)} tone="rose" />
        </div>

        <EnterpriseDataGrid<FarmerRegistryDemoRow>
          title={usingDemo ? "Operational archive · connect Supabase for national UUID rows" : "National farmer registry"}
          rows={rows}
          columns={demoCols}
          filename="farmers-registry.csv"
          pageSize={30}
          dense
          getRowKey={(r) => r.id}
          renderExpanded={(r) => (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide text-slate-500">Custody chain</div>
                <ul className="mt-1.5 space-y-1 font-mono text-[10px] text-slate-400">
                  <li>
                    <span className="text-slate-600">Registered · </span>
                    {r.lastFieldVisit}
                  </li>
                  <li>
                    <span className="text-slate-600">DAO · </span>
                    {r.daoOfficerCode ?? "Unassigned"}
                  </li>
                  <li>
                    <span className="text-slate-600">Warehouse · </span>
                    {r.primaryWarehouseCode ?? "—"}
                  </li>
                  <li>
                    <span className="text-slate-600">GPS · </span>
                    <span className="uppercase">{r.gpsStatus}</span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide text-slate-500">Operational note</div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  {r.verification === "verified"
                    ? "Verification cleared — eligible movements align with subsidy and warehouse programmes."
                    : "District QA queue — monitor dormant rows beyond 14 days and escalate to county reconciliation."}
                </p>
              </div>
            </div>
          )}
          onRowClick={(r) => {
            if (isUuid(r.id)) setProfileId(r.id);
          }}
        />
      </MinistryPageShell>

      <OperationDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Register farmer"
        subtitle="Creates a ministry registry row attributed to your session."
      >
        <RegisterFarmerForm
          onCancel={() => setDrawer(false)}
          onSuccess={() => {
            setDrawer(false);
            setReload((x) => x + 1);
          }}
        />
      </OperationDrawer>

      <OperationDrawer
        open={Boolean(profileId)}
        onClose={() => setProfileId(null)}
        title="Farmer operational profile"
        subtitle="Registry master · visits · subsidies · production intelligence."
        widthClassName="max-w-2xl"
      >
        <FarmerProfileDrawer farmerId={profileId} onClose={() => setProfileId(null)} />
      </OperationDrawer>
    </>
  );
}
