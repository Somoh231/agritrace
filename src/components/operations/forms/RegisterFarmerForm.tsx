"use client";

import * as React from "react";

import {
  AlertCard,
  EnterpriseFormField,
  EnterpriseFormSection,
} from "@/components/enterprise";
import type { DaoWorkflowFormBindings } from "@/lib/dao/dao-workflow-types";
import { persistRegisterFarmerPayload } from "@/lib/dao/dao-workflow-writers";

import FarmBoundaryCapture from "@/components/gis/FarmBoundaryCapture";
import type { OperationalFarmBoundary } from "@/lib/gis/operational-boundary-types";

const DRAFT_KEY = "agritrace-draft-register-farmer";

export default function RegisterFarmerForm({
  onSuccess,
  onCancel,
  countyDefault,
  districtDefault,
  readOnly,
  onQueueForSync,
  daoWorkflow,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  countyDefault?: string;
  districtDefault?: string;
  readOnly?: boolean;
  /** @deprecated Prefer `daoWorkflow.queuePending` (IndexedDB DAO queue). */
  onQueueForSync?: (snapshot: Record<string, unknown>) => void;
  daoWorkflow?: DaoWorkflowFormBindings;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    full_name: "",
    county: countyDefault ?? "",
    district: districtDefault ?? "",
    village: "",
    clan_community: "",
    phone: "",
    national_id: "",
    voter_id: "",
    ministry_registry_id: "",
    tax_id: "",
    cooperative: "",
    cooperative_membership_no: "",
    plot_id: "",
    dao_assignment: "",
    cac_jurisdiction: "",
    main_crop: "rice",
    acreage_hectares: "",
    gender: "",
    latitude: "",
    longitude: "",
    profile_photo_url: "",
    notes: "",
  });
  const [operationalBoundary, setOperationalBoundary] = React.useState<OperationalFarmBoundary | null>(null);

  const seededRef = React.useRef(false);
  React.useEffect(() => {
    if (seededRef.current) return;
    if (countyDefault || districtDefault) {
      setForm((f) => ({
        ...f,
        county: countyDefault ?? f.county,
        district: districtDefault ?? f.district,
      }));
      seededRef.current = true;
    }
  }, [countyDefault, districtDefault]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  const buildNotes = () => {
    const parts: string[] = [];
    if (form.cooperative.trim()) parts.push(`Cooperative: ${form.cooperative.trim()}`);
    if (form.cooperative_membership_no.trim()) parts.push(`Co-op membership #: ${form.cooperative_membership_no.trim()}`);
    if (form.voter_id.trim()) parts.push(`Voter ID: ${form.voter_id.trim()}`);
    if (form.ministry_registry_id.trim()) parts.push(`Ministry farmer ID: ${form.ministry_registry_id.trim()}`);
    if (form.tax_id.trim()) parts.push(`TIN: ${form.tax_id.trim()}`);
    if (form.clan_community.trim()) parts.push(`Clan/community: ${form.clan_community.trim()}`);
    if (form.plot_id.trim()) parts.push(`Plot ID: ${form.plot_id.trim()}`);
    if (form.dao_assignment.trim()) parts.push(`DAO assignment: ${form.dao_assignment.trim()}`);
    if (form.cac_jurisdiction.trim()) parts.push(`CAC jurisdiction: ${form.cac_jurisdiction.trim()}`);
    if (form.profile_photo_url.trim()) parts.push(`Profile photo ref: ${form.profile_photo_url.trim()}`);
    if (form.notes.trim()) parts.push(form.notes.trim());
    return parts.length ? parts.join("\n") : null;
  };

  const queueSnapshot = (): Record<string, unknown> => ({
    ...form,
    notes_composed: buildNotes(),
    queued_at: new Date().toISOString(),
    operational_boundary: operationalBoundary,
  });

  const saveDraft = async () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
    if (daoWorkflow?.enabled && daoWorkflow.saveDraft) {
      await daoWorkflow.saveDraft(queueSnapshot());
    }
  };

  const syncLater = async () => {
    setError(null);
    if (!form.full_name.trim() || !form.county.trim()) {
      setError("Full name and county are required before queueing.");
      return;
    }
    const snap = queueSnapshot();
    if (daoWorkflow?.enabled) {
      await daoWorkflow.queuePending(snap);
      onSuccess();
    } else {
      onQueueForSync?.(snap);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError(null);
    if (!form.full_name.trim() || !form.county.trim()) {
      setError("Full name and county are required.");
      setSaving(false);
      return;
    }
    try {
      const snap = queueSnapshot();
      const res = await persistRegisterFarmerPayload(snap);
      if (!res.ok) {
        setError(`${res.error} — saved to DAO offline queue.`);
        if (daoWorkflow?.enabled) await daoWorkflow.onSubmitFailure(snap, res.error);
      } else {
        if (daoWorkflow?.enabled) await daoWorkflow.markSynced({ full_name: form.full_name.trim(), county: form.county.trim() });
        localStorage.removeItem(DRAFT_KEY);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const disabled = Boolean(readOnly);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <AlertCard tone="danger" title="Registration issue">
          {error}
        </AlertCard>
      ) : null}

      <EnterpriseFormSection title="Farmer identity" description="Legal name and national identifiers for registry deduplication.">
        <EnterpriseFormField id="rf-name" label="Farmer full name" required>
          <input id="rf-name" required disabled={disabled} value={form.full_name} onChange={set("full_name")} className="av-input" />
        </EnterpriseFormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-gender" label="Gender">
            <select id="rf-gender" disabled={disabled} value={form.gender} onChange={set("gender")} className="av-input">
              <option value="">—</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-phone" label="Phone number" helper="Liberia format: +231 …">
            <input id="rf-phone" disabled={disabled} value={form.phone} onChange={set("phone")} className="av-input" placeholder="+231 77 000 0000" />
          </EnterpriseFormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-national-id" label="National ID number">
            <input id="rf-national-id" disabled={disabled} value={form.national_id} onChange={set("national_id")} className="av-input" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-voter-id" label="Voter ID" hint="Stored in registration notes until dedicated column is provisioned.">
            <input id="rf-voter-id" disabled={disabled} value={form.voter_id} onChange={set("voter_id")} className="av-input" />
          </EnterpriseFormField>
        </div>
        <EnterpriseFormField id="rf-ministry-id" label="Ministry farmer registry ID" hint="e.g. NIM-0001 — captured in notes if not yet synced.">
          <input id="rf-ministry-id" disabled={disabled} value={form.ministry_registry_id} onChange={set("ministry_registry_id")} className="av-input font-mono text-[12px]" />
        </EnterpriseFormField>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Location" description="County, district, and community anchors for DAO routing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-county" label="County" required>
            <input id="rf-county" required disabled={disabled} value={form.county} onChange={set("county")} className="av-input" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-district" label="District">
            <input id="rf-district" disabled={disabled} value={form.district} onChange={set("district")} className="av-input" />
          </EnterpriseFormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-village" label="Town / village">
            <input id="rf-village" disabled={disabled} value={form.village} onChange={set("village")} className="av-input" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-clan" label="Clan / community">
            <input id="rf-clan" disabled={disabled} value={form.clan_community} onChange={set("clan_community")} className="av-input" />
          </EnterpriseFormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <EnterpriseFormField id="rf-lat" label="GPS latitude">
            <input id="rf-lat" disabled={disabled} value={form.latitude} onChange={set("latitude")} placeholder="e.g. 6.3156" className="av-input font-mono text-[12px]" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-lng" label="GPS longitude">
            <input id="rf-lng" disabled={disabled} value={form.longitude} onChange={set("longitude")} placeholder="e.g. -10.8074" className="av-input font-mono text-[12px]" />
          </EnterpriseFormField>
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Cooperative & jurisdiction" description="Membership spine and officer assignment.">
        <EnterpriseFormField id="rf-coop" label="Cooperative / farmer group">
          <input id="rf-coop" disabled={disabled} value={form.cooperative} onChange={set("cooperative")} className="av-input" />
        </EnterpriseFormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-coop-no" label="Cooperative membership number" hint="Stored in registration notes.">
            <input id="rf-coop-no" disabled={disabled} value={form.cooperative_membership_no} onChange={set("cooperative_membership_no")} className="av-input" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-plot" label="Plot ID" hint="Field parcel identifier when assigned.">
            <input id="rf-plot" disabled={disabled} value={form.plot_id} onChange={set("plot_id")} className="av-input font-mono text-[12px]" />
          </EnterpriseFormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-dao" label="DAO assignment">
            <input id="rf-dao" disabled={disabled} value={form.dao_assignment} onChange={set("dao_assignment")} className="av-input" placeholder="Officer code" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-cac" label="CAC jurisdiction">
            <input id="rf-cac" disabled={disabled} value={form.cac_jurisdiction} onChange={set("cac_jurisdiction")} className="av-input" />
          </EnterpriseFormField>
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Production profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <EnterpriseFormField id="rf-crop" label="Main crop">
            <input id="rf-crop" disabled={disabled} value={form.main_crop} onChange={set("main_crop")} className="av-input" />
          </EnterpriseFormField>
          <EnterpriseFormField id="rf-acreage" label="Acreage (hectares)">
            <input id="rf-acreage" disabled={disabled} type="number" step="0.01" value={form.acreage_hectares} onChange={set("acreage_hectares")} className="av-input" />
          </EnterpriseFormField>
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Farm boundary" description="Operational outline from field capture — approximate, not cadastral.">
        <div className="rounded-xl border border-slate-100 bg-white p-2">
          <FarmBoundaryCapture disabled={disabled} readOnly={disabled} value={operationalBoundary} onChange={setOperationalBoundary} />
        </div>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Additional references">
        <EnterpriseFormField id="rf-photo" label="Profile photo (URL or ministry media id)">
          <input id="rf-photo" disabled={disabled} value={form.profile_photo_url} onChange={set("profile_photo_url")} className="av-input" />
        </EnterpriseFormField>
        <EnterpriseFormField id="rf-notes" label="Officer notes">
          <textarea id="rf-notes" disabled={disabled} value={form.notes} onChange={set("notes")} rows={2} className="av-input min-h-[72px]" />
        </EnterpriseFormField>
        <p className="text-[12px] text-slate-500">Timestamp and officer attribution are recorded from your authenticated session on submit.</p>
      </EnterpriseFormSection>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" disabled={disabled} onClick={() => void saveDraft()} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px] disabled:opacity-50">
          Save draft
        </button>
        {(daoWorkflow?.enabled || onQueueForSync) && !disabled ? (
          <button type="button" onClick={() => void syncLater()} className="h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-[13px] font-medium text-amber-900 hover:bg-amber-100">
            Queue sync
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className="btn-gov-outline h-10 rounded-lg px-4 text-[13px]">
          Cancel
        </button>
        {!disabled ? (
          <button type="submit" disabled={saving} className="btn-emerald h-10 rounded-lg px-5 text-[13px] disabled:opacity-50">
            {saving ? "Saving…" : "Submit registration"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
