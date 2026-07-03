"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import {
  farmerRegistrationPipeline,
  farmerRegistrySample,
  type FarmerRegistryDemoRow,
} from "@/lib/demo/agriculture-pilot-data";
import {
  AlertCard,
  DashboardPanel,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import EnterpriseDataGrid, { type GridColumn } from "@/components/operations/EnterpriseDataGrid";
import OperationDrawer from "@/components/operations/OperationDrawer";
import FarmerProfileDrawer from "@/components/operations/FarmerProfileDrawer";
import RegisterFarmerForm from "@/components/operations/forms/RegisterFarmerForm";
import RecordFarmerVerificationDecisionForm from "@/components/operations/forms/RecordFarmerVerificationDecisionForm";
import {
  FarmerRegistryPreview,
  FarmerRegistryRowActions,
  RegistryFilterBar,
  RegistryKpiStrip,
  isRegistryUuid,
  verificationStatusTone,
} from "@/components/registry";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

const nf = (n: number) => Intl.NumberFormat().format(n);

export default function FarmersRegistryClient() {
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [previewRow, setPreviewRow] = React.useState<FarmerRegistryDemoRow | null>(null);
  const [verifyFarmerId, setVerifyFarmerId] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [rows, setRows] = React.useState<FarmerRegistryDemoRow[]>(farmerRegistrySample);
  const [usingDemo, setUsingDemo] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [countyFilter, setCountyFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
        if (error) setLoadError(error.message);
        return;
      }
      setRows((data as Record<string, unknown>[]).map(mapLiveRow));
      setUsingDemo(false);
    } catch {
      setRows(farmerRegistrySample);
      setUsingDemo(true);
      setLoadError("Could not load live registry rows.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, reload]);

  React.useEffect(() => {
    const open = () => setRegisterOpen(true);
    window.addEventListener("agritrace-primary-action", open);
    return () => window.removeEventListener("agritrace-primary-action", open);
  }, []);

  const counties = React.useMemo(
    () => [...new Set(rows.map((r) => r.county).filter(Boolean))].sort(),
    [rows],
  );

  const filteredRows = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (countyFilter && r.county !== countyFilter) return false;
      if (statusFilter && r.verification !== statusFilter) return false;
      if (!needle) return true;
      return [r.fullName, r.registryPublicId, r.id, r.county, r.district, r.cooperative, r.mainCrop]
        .some((v) => String(v ?? "").toLowerCase().includes(needle));
    });
  }, [rows, search, countyFilter, statusFilter]);

  const liveStats = React.useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((r) => r.verification === "verified").length;
    const pending = rows.filter((r) => r.verification === "pending").length;
    const flagged = rows.filter((r) => r.verification === "flagged").length;
    const geoTagged = rows.filter((r) => r.gpsStatus === "verified").length;
    const geoPct = total ? Math.round((geoTagged / total) * 100) : 0;
    return { total, verified, pending, flagged, geoPct };
  }, [rows]);

  const openProfile = React.useCallback((row: FarmerRegistryDemoRow) => {
    if (isRegistryUuid(row.id)) {
      setProfileId(row.id);
      setPreviewRow(null);
    } else {
      setPreviewRow(row);
      setProfileId(null);
    }
  }, []);

  const columns = React.useMemo<GridColumn<FarmerRegistryDemoRow>[]>(
    () => [
      { key: "fullName", header: "Farmer" },
      {
        key: "registryPublicId",
        header: "Registry ID",
        render: (r) => (
          <span className="font-mono text-[10px] text-slate-500">{r.registryPublicId ?? r.id}</span>
        ),
      },
      { key: "county", header: "County" },
      { key: "district", header: "District / village" },
      { key: "cooperative", header: "Cooperative" },
      {
        key: "gpsStatus",
        header: "GPS",
        render: (r) => (
          <StatusBadge tone={r.gpsStatus === "verified" ? "success" : r.gpsStatus === "pending" ? "warning" : "neutral"}>
            {r.gpsStatus}
          </StatusBadge>
        ),
      },
      { key: "acreage", header: "Ha" },
      { key: "mainCrop", header: "Crop" },
      {
        key: "verification",
        header: "Verification",
        render: (r) => <StatusBadge tone={verificationStatusTone(r.verification)}>{r.verification}</StatusBadge>,
      },
      { key: "lastFieldVisit", header: "Last activity" },
      {
        key: "actions",
        header: "Actions",
        render: (r) => (
          <FarmerRegistryRowActions
            row={r}
            onViewProfile={openProfile}
            onVerify={(row) => setVerifyFarmerId(row.id)}
          />
        ),
      },
    ],
    [openProfile],
  );

  const pipeline = farmerRegistrationPipeline;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="National registry · Ministry of Agriculture"
        title="Farmer registry"
        description="National agricultural record system — verification posture, geo readiness, subsidy eligibility, and district custody chain."
        actions={
          <button type="button" onClick={() => setRegisterOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg btn-emerald px-4 text-[13px] font-semibold">
            <UserPlus className="h-4 w-4" aria-hidden />
            Register farmer
          </button>
        }
      />

      {usingDemo ? (
        <AlertCard tone="warning" title="Pilot dataset active">
          Showing illustrative registry rows while live Supabase data loads or when the farmers table is empty. National pipeline metrics remain available for executive context.
        </AlertCard>
      ) : null}

      {loadError && !usingDemo ? (
        <AlertCard tone="danger" title="Registry sync notice">
          {loadError}
        </AlertCard>
      ) : null}

      <RegistryKpiStrip
        items={[
          {
            label: usingDemo ? "Verified (pipeline)" : "Verified in view",
            value: nf(usingDemo ? pipeline.verified : liveStats.verified),
            hint: usingDemo ? "National pipeline aggregate" : `${liveStats.total} rows loaded`,
            deltaTone: "up",
          },
          {
            label: usingDemo ? "Pending verification" : "Pending in view",
            value: nf(usingDemo ? pipeline.pendingVerification : liveStats.pending),
            hint: "Awaiting district or county review",
            deltaTone: "neutral",
          },
          {
            label: usingDemo ? "Geo completion" : "Geo tagged",
            value: usingDemo ? `${pipeline.geoTaggedPct}%` : `${liveStats.geoPct}%`,
            hint: "GPS capture readiness",
          },
          {
            label: usingDemo ? "Flagged" : "Flagged in view",
            value: nf(usingDemo ? pipeline.flagged : liveStats.flagged),
            hint: "Requires supervisory review",
            deltaTone: "down",
          },
        ]}
      />

      <RegistryFilterBar
        search={search}
        onSearchChange={setSearch}
        county={countyFilter}
        onCountyChange={setCountyFilter}
        counties={counties}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "", label: "All statuses" },
          { value: "verified", label: "Verified" },
          { value: "pending", label: "Pending" },
          { value: "flagged", label: "Flagged" },
        ]}
      />

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader
            kicker="Master register"
            title={usingDemo ? "Operational archive" : "National farmer registry"}
            subtitle={
              usingDemo
                ? "Connect Supabase for national UUID rows with full operational profiles."
                : `${nf(filteredRows.length)} records in current filter scope`
            }
            action={
              <Link href="/verification-queue" className="text-[13px] font-medium text-forest-700 hover:text-forest-600">
                Open verification queue →
              </Link>
            }
          />
        </div>

        {loading ? (
          <div className="p-8">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No farmers match the current filters"
              description="Adjust county, verification status, or search terms. New registrations appear here after CLAN capture and DAO review."
              action={
                <button type="button" onClick={() => setRegisterOpen(true)} className="inline-flex h-10 items-center rounded-lg btn-emerald px-4 text-[13px] font-semibold">
                  Register farmer
                </button>
              }
            />
          </div>
        ) : (
          <EnterpriseDataGrid<FarmerRegistryDemoRow>
            rows={filteredRows}
            columns={columns}
            filename="farmers-registry.csv"
            pageSize={30}
            dense
            theme="light"
            getRowKey={(r) => r.id}
            emptyLabel="No farmers match the current filters."
            onRowClick={openProfile}
            renderExpanded={(r) => (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wide text-slate-500">Custody chain</p>
                  <ul className="mt-1.5 space-y-1 font-mono text-[10px] text-slate-600">
                    <li>
                      <span className="text-slate-400">Registered · </span>
                      {r.lastFieldVisit}
                    </li>
                    <li>
                      <span className="text-slate-400">DAO · </span>
                      {r.daoOfficerCode ?? "Unassigned"}
                    </li>
                    <li>
                      <span className="text-slate-400">Warehouse · </span>
                      {r.primaryWarehouseCode ?? "—"}
                    </li>
                    <li>
                      <span className="text-slate-400">Subsidy · </span>
                      {r.subsidyEligible ? "Eligible" : "Not eligible"}
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wide text-slate-500">Operational note</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                    {r.verification === "verified"
                      ? "Verification cleared — eligible movements align with subsidy and warehouse programmes."
                      : "District QA queue — monitor dormant rows beyond 14 days and escalate to county reconciliation."}
                  </p>
                </div>
              </div>
            )}
          />
        )}
      </DashboardPanel>

      <OperationDrawer
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register farmer"
        subtitle="Creates a ministry registry row attributed to your session."
      >
        <RegisterFarmerForm
          onCancel={() => setRegisterOpen(false)}
          onSuccess={() => {
            setRegisterOpen(false);
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

      <OperationDrawer
        open={Boolean(previewRow)}
        onClose={() => setPreviewRow(null)}
        title="Farmer registry preview"
        subtitle="Illustrative pilot row — full profile requires live Supabase UUID."
        widthClassName="max-w-xl"
      >
        {previewRow ? <FarmerRegistryPreview row={previewRow} onClose={() => setPreviewRow(null)} /> : null}
      </OperationDrawer>

      <OperationDrawer
        open={Boolean(verifyFarmerId)}
        onClose={() => setVerifyFarmerId(null)}
        title="Verification decision"
        subtitle="Update verification status and subsidy eligibility."
      >
        <RecordFarmerVerificationDecisionForm
          initialFarmerId={verifyFarmerId ?? ""}
          onCancel={() => setVerifyFarmerId(null)}
          onSuccess={() => {
            setVerifyFarmerId(null);
            setReload((x) => x + 1);
          }}
        />
      </OperationDrawer>
    </div>
  );
}
