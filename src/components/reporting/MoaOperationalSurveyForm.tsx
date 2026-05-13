"use client";

import * as React from "react";

import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistMoaOperationalSurvey } from "@/lib/dao/dao-workflow-writers";
import { MINISTRY_FARMERS, MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import {
  emptyMoaSurveyPayload,
  type MoaOperationalSurveyKind,
  type MoaOperationalSurveyPayload,
  type MoaWorkflowStatus,
} from "@/lib/reporting/moa-operational-payload";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

const WORKFLOW_OPTIONS: { id: MoaWorkflowStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "saved_offline", label: "Saved Offline" },
  { id: "pending_submission", label: "Pending Submission" },
  { id: "submitted", label: "Submitted" },
  { id: "under_dao_review", label: "Under DAO Review" },
  { id: "under_cac_verification", label: "Under CAC Verification" },
  { id: "escalated", label: "Escalated" },
  { id: "verified", label: "Verified" },
  { id: "archived", label: "Archived" },
];

const sectionClass = "rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3";
const labelClass = "block text-[12px] font-medium text-slate-300";
const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-50";

export function titleForMoaOperationalSurveyKind(k: MoaOperationalSurveyKind): string {
  switch (k) {
    case "clan_crop_monitoring":
      return "Crop monitoring (CLAN)";
    case "clan_field_activity_report":
      return "Field activity report (CLAN)";
    case "dao_district_summary":
      return "District operational summary (DAO)";
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
      return "Operational survey";
  }
}

export type MoaOperationalSurveyFormProps = {
  kind: MoaOperationalSurveyKind;
  countyDefault: string | null;
  districtDefault: string | null;
  officerName: string;
  officerRoleLabel: string;
  readOnly?: boolean;
  daoWorkflow?: DaoWorkflowFormBindings;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function MoaOperationalSurveyForm({
  kind,
  countyDefault,
  districtDefault,
  officerName,
  officerRoleLabel,
  readOnly,
  daoWorkflow,
  onCancel,
  onSuccess,
}: MoaOperationalSurveyFormProps) {
  const [p, setP] = React.useState<MoaOperationalSurveyPayload>(() =>
    emptyMoaSurveyPayload(kind, {
      county: countyDefault,
      district: districtDefault,
      officerName,
      officerRole: officerRoleLabel,
    }),
  );
  const disabled = Boolean(readOnly);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const online = typeof navigator !== "undefined" && navigator.onLine;
  const pRef = React.useRef(p);
  pRef.current = p;

  React.useEffect(() => {
    if (disabled || !daoWorkflow?.enabled || !daoWorkflow.saveDraft) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const snap = { ...pRef.current, workflow_status: pRef.current.workflow_status };
          await daoWorkflow.saveDraft!(snap as Record<string, unknown>);
        } catch {
          /* never break form typing */
        }
      })();
    }, 2200);
    return () => window.clearTimeout(t);
  }, [p, disabled, daoWorkflow]);

  React.useEffect(() => {
    setP((prev) => ({
      ...prev,
      report_kind: kind,
      county: (countyDefault ?? prev.county).trim(),
      district: districtDefault?.trim() || prev.district || null,
      officer_display_name: officerName || prev.officer_display_name,
      officer_role_label: officerRoleLabel || prev.officer_role_label,
    }));
  }, [kind, countyDefault, districtDefault, officerName, officerRoleLabel]);

  const patch = (partial: Partial<MoaOperationalSurveyPayload>) => setP((x) => ({ ...x, ...partial }));

  const queueSnapshot = (): Record<string, unknown> => ({
    ...p,
    workflow_status: "submitted" as MoaWorkflowStatus,
    submitted_at_client: new Date().toISOString(),
  });

  const saveDraftLocal = async () => {
    setError(null);
    const snap = { ...p, workflow_status: "draft" as const };
    if (daoWorkflow?.enabled && daoWorkflow.saveDraft) await daoWorkflow.saveDraft(snap as Record<string, unknown>);
  };

  const syncLater = async () => {
    setError(null);
    if (!p.county.trim()) {
      setError("County is required.");
      return;
    }
    const snap = queueSnapshot();
    if (daoWorkflow?.enabled) {
      await daoWorkflow.queuePending(snap);
      onSuccess();
    } else {
      setError("Offline queue is not wired for this form.");
    }
  };

  const captureGps = () => {
    if (readOnly || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patch({
          gps_latitude: String(pos.coords.latitude),
          gps_longitude: String(pos.coords.longitude),
          gps_accuracy_m: pos.coords.accuracy != null ? String(Math.round(pos.coords.accuracy)) : null,
          gps_captured_at: new Date().toISOString(),
        });
      },
      () => setError("Could not read GPS — check permissions."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!p.county.trim()) {
      setError("County is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const snap = queueSnapshot();
    try {
      const res = await persistMoaOperationalSurvey(kind, snap as Record<string, unknown>);
      if (!res.ok) {
        setError(`${res.error} — saved to offline queue when available.`);
        if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap as Record<string, unknown>, res.error);
      } else {
        if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ report_kind: kind });
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  };

  const showPest = p.pest_issue_observed === "yes";
  const showWarehouse = p.warehouse_linked === "yes";
  const showInputs = p.inputs_distributed === "yes";
  const showSubsidy = p.subsidy_distributed === "yes";

  return (
    <form onSubmit={submit} className="space-y-5 text-[13px] text-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">MoA operational survey</div>
          <h2 className="mt-1 font-display text-[16px] font-semibold text-white">{titleForMoaOperationalSurveyKind(kind)}</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
            Enumerator-led capture aligned to the ministry pilot registry (county · district · cooperative · warehouse codes).
            Evidence is traceability support — not legal certification.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncStatusIndicator />
          <span
            className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase ${
              online ? "border-slate-700 bg-slate-900 text-slate-400" : "border-amber-800/60 bg-amber-950/40 text-amber-100"
            }`}
          >
            {online ? "Online" : "Offline — queue then sync"}
          </span>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-100">{error}</div> : null}

      {daoWorkflow?.enabled && daoWorkflow.saveDraft && !disabled ? (
        <p className="text-[11px] text-slate-500">Draft autosaves to this device every few seconds while you edit (operational reporting queue).</p>
      ) : null}

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Officer identity & posting</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Officer name
            <input disabled className={inputClass} value={p.officer_display_name ?? ""} readOnly />
          </label>
          <label className={labelClass}>
            Role on this posting
            <input disabled className={inputClass} value={p.officer_role_label ?? ""} readOnly />
          </label>
          <label className={labelClass}>
            Workflow status
            <select
              disabled={disabled}
              className={inputClass}
              value={p.workflow_status}
              onChange={(e) => patch({ workflow_status: e.target.value as MoaWorkflowStatus })}
            >
              {WORKFLOW_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Verification outcome (field desk)
            <input
              disabled={disabled}
              className={inputClass}
              value={p.verification_status ?? ""}
              onChange={(e) => patch({ verification_status: e.target.value })}
              placeholder="e.g. pending / verified / flagged"
            />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Geographic scope</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            County *
            <input required disabled={disabled} className={inputClass} value={p.county} onChange={(e) => patch({ county: e.target.value })} />
          </label>
          <label className={labelClass}>
            District
            <input disabled={disabled} className={inputClass} value={p.district ?? ""} onChange={(e) => patch({ district: e.target.value })} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Clan / community
            <input
              disabled={disabled}
              className={inputClass}
              value={p.clan_or_community ?? ""}
              onChange={(e) => patch({ clan_or_community: e.target.value })}
              placeholder="Town, clan section, or community name"
            />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Farmer (registry linkage)</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Registry public ID
            <input
              disabled={disabled}
              className={inputClass}
              list="moa-registry-ids"
              value={p.farmer_registry_id ?? ""}
              onChange={(e) => patch({ farmer_registry_id: e.target.value })}
              placeholder="e.g. NIM-0001"
            />
            <datalist id="moa-registry-ids">
              {MINISTRY_FARMERS.map((f) => (
                <option key={f.registryPublicId} value={f.registryPublicId} />
              ))}
            </datalist>
          </label>
          <label className={labelClass}>
            Farmer name (as stated)
            <input disabled={disabled} className={inputClass} value={p.farmer_full_name ?? ""} onChange={(e) => patch({ farmer_full_name: e.target.value })} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Phone (optional)
            <input disabled={disabled} className={inputClass} value={p.farmer_phone ?? ""} onChange={(e) => patch({ farmer_phone: e.target.value })} />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Farm & crop</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Plot / farm label
            <input disabled={disabled} className={inputClass} value={p.farm_plot_label ?? ""} onChange={(e) => patch({ farm_plot_label: e.target.value })} />
          </label>
          <label className={labelClass}>
            Main crop
            <input disabled={disabled} className={inputClass} value={p.main_crop ?? ""} onChange={(e) => patch({ main_crop: e.target.value })} placeholder="Rice, cassava…" />
          </label>
          <label className={labelClass}>
            Area (ha, reported)
            <input disabled={disabled} className={inputClass} value={p.area_hectares_reported ?? ""} onChange={(e) => patch({ area_hectares_reported: e.target.value })} />
          </label>
          <label className={labelClass}>
            Growth stage
            <input disabled={disabled} className={inputClass} value={p.crop_growth_stage ?? ""} onChange={(e) => patch({ crop_growth_stage: e.target.value })} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Crop stress / vigour notes
            <textarea disabled={disabled} rows={2} className={inputClass} value={p.crop_stress_notes ?? ""} onChange={(e) => patch({ crop_stress_notes: e.target.value })} />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">GPS & polygon reference</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Latitude
            <input disabled={disabled} className={`${inputClass} font-mono text-[12px]`} value={p.gps_latitude ?? ""} onChange={(e) => patch({ gps_latitude: e.target.value })} />
          </label>
          <label className={labelClass}>
            Longitude
            <input disabled={disabled} className={`${inputClass} font-mono text-[12px]`} value={p.gps_longitude ?? ""} onChange={(e) => patch({ gps_longitude: e.target.value })} />
          </label>
          <label className={labelClass}>
            Accuracy (m)
            <input disabled={disabled} className={inputClass} value={p.gps_accuracy_m ?? ""} onChange={(e) => patch({ gps_accuracy_m: e.target.value })} />
          </label>
          <label className={labelClass}>
            Captured at (UTC)
            <input disabled={disabled} className={`${inputClass} font-mono text-[11px]`} value={p.gps_captured_at ?? ""} onChange={(e) => patch({ gps_captured_at: e.target.value })} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Operational boundary / visit ref
            <input
              disabled={disabled}
              className={inputClass}
              value={p.operational_boundary_ref ?? ""}
              onChange={(e) => patch({ operational_boundary_ref: e.target.value })}
              placeholder="Visit UUID, offline packet id, or polygon capture batch ref"
            />
          </label>
        </div>
        {!disabled ? (
          <button type="button" onClick={captureGps} className="h-10 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 text-[12px] text-emerald-100 hover:bg-emerald-950/50">
            Capture GPS now
          </button>
        ) : null}
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Photos & evidence</div>
        <p className="text-[11px] text-slate-500">Paste ministry media IDs or HTTPS URLs (comma-separated). Full camera upload pipeline can bind to these refs later.</p>
        <label className={labelClass}>
          Farm / plot photo refs
          <textarea disabled={disabled} rows={2} className={inputClass} value={p.evidence_farm_photo_refs ?? ""} onChange={(e) => patch({ evidence_farm_photo_refs: e.target.value })} />
        </label>
        <label className={labelClass}>
          Officer / attendance photo refs
          <textarea disabled={disabled} rows={2} className={inputClass} value={p.evidence_officer_photo_refs ?? ""} onChange={(e) => patch({ evidence_officer_photo_refs: e.target.value })} />
        </label>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-[12px] text-slate-300">
          Evidence verification status:{" "}
          <span className="font-semibold capitalize text-emerald-300">{p.evidence_verification_status ?? "pending"}</span>
          <span className="text-slate-500"> — desk review updates this in national workflows.</span>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Inputs distributed</div>
        <label className={labelClass}>
          Inputs distributed on this visit?
          <select
            disabled={disabled}
            className={inputClass}
            value={p.inputs_distributed}
            onChange={(e) => patch({ inputs_distributed: e.target.value as "yes" | "no" | "" })}
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {showInputs ? (
          <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-800 pt-3">
            <label className={labelClass}>
              Input type
              <input disabled={disabled} className={inputClass} value={p.input_type ?? ""} onChange={(e) => patch({ input_type: e.target.value })} />
            </label>
            <label className={labelClass}>
              Quantity
              <input disabled={disabled} className={inputClass} value={p.input_quantity ?? ""} onChange={(e) => patch({ input_quantity: e.target.value })} />
            </label>
            <label className={labelClass}>
              Unit
              <input disabled={disabled} className={inputClass} value={p.input_unit ?? ""} onChange={(e) => patch({ input_unit: e.target.value })} placeholder="kg, bags…" />
            </label>
          </div>
        ) : null}
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Pest / disease</div>
        <label className={labelClass}>
          Pest or disease issue observed?
          <select
            disabled={disabled}
            className={inputClass}
            value={p.pest_issue_observed}
            onChange={(e) => patch({ pest_issue_observed: e.target.value as "yes" | "no" | "" })}
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {showPest ? (
          <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-800 pt-3">
            <label className={labelClass}>
              Pest / pathogen
              <input disabled={disabled} className={inputClass} value={p.pest_type ?? ""} onChange={(e) => patch({ pest_type: e.target.value })} />
            </label>
            <label className={labelClass}>
              Severity
              <input disabled={disabled} className={inputClass} value={p.pest_severity ?? ""} onChange={(e) => patch({ pest_severity: e.target.value })} />
            </label>
            <label className={labelClass}>
              Affected area (ha)
              <input disabled={disabled} className={inputClass} value={p.pest_affected_area_ha ?? ""} onChange={(e) => patch({ pest_affected_area_ha: e.target.value })} />
            </label>
          </div>
        ) : null}
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Warehouse linkage</div>
        <label className={labelClass}>
          Link to ministry warehouse?
          <select
            disabled={disabled}
            className={inputClass}
            value={p.warehouse_linked}
            onChange={(e) => patch({ warehouse_linked: e.target.value as "yes" | "no" | "" })}
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {showWarehouse ? (
          <label className={labelClass}>
            Warehouse ministry code
            <input
              disabled={disabled}
              className={inputClass}
              list="moa-warehouse-codes"
              value={p.warehouse_ministry_code ?? ""}
              onChange={(e) => patch({ warehouse_ministry_code: e.target.value })}
              placeholder="e.g. WH-NIM-001"
            />
            <datalist id="moa-warehouse-codes">
              {MINISTRY_WAREHOUSES.map((w) => (
                <option key={w.ministryCode} value={w.ministryCode} />
              ))}
            </datalist>
          </label>
        ) : null}
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Subsidy / programme</div>
        <label className={labelClass}>
          Subsidy or programme inputs distributed?
          <select
            disabled={disabled}
            className={inputClass}
            value={p.subsidy_distributed}
            onChange={(e) => patch({ subsidy_distributed: e.target.value as "yes" | "no" | "" })}
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {showSubsidy ? (
          <label className={labelClass}>
            Subsidy / programme notes
            <textarea disabled={disabled} rows={3} className={inputClass} value={p.subsidy_notes ?? ""} onChange={(e) => patch({ subsidy_notes: e.target.value })} />
          </label>
        ) : null}
      </div>

      <div className={sectionClass}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Operational notes</div>
        <textarea
          disabled={disabled}
          rows={4}
          className={inputClass}
          value={p.operational_notes ?? ""}
          onChange={(e) => patch({ operational_notes: e.target.value })}
          placeholder="Route conditions, enumerator observations, follow-up required…"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-4">
        {daoWorkflow?.enabled && daoWorkflow.saveDraft && !disabled ? (
          <button type="button" onClick={() => void saveDraftLocal()} className="h-10 rounded-lg border border-slate-600 px-4 text-[12px] text-slate-200 hover:bg-slate-900">
            Save draft (local)
          </button>
        ) : null}
        {daoWorkflow?.enabled && !disabled ? (
          <button type="button" onClick={() => void syncLater()} className="h-10 rounded-lg border border-amber-700/60 px-4 text-[12px] text-amber-100 hover:bg-amber-950/40">
            Queue for sync
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg text-[12px] text-slate-400 hover:text-white">
          Cancel
        </button>
        {!disabled ? (
          <button type="submit" disabled={saving} className="h-10 px-5 rounded-lg bg-emerald-700 text-[12px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {saving ? "Submitting…" : "Submit to national log"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
