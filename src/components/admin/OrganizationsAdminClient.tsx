"use client";

import * as React from "react";
import { ChevronRight, Loader2, Plus, RefreshCcw } from "lucide-react";

import AdminPageShell, { ADMIN_CARD } from "@/components/admin/AdminPageShell";
import {
  EnterpriseFormActions,
  EnterpriseFormField,
  EnterpriseFormSection,
} from "@/components/enterprise";
import AlertBanner from "@/components/shared/AlertBanner";
import CountySelect from "@/components/shared/CountySelect";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip, { type ChipTone } from "@/components/shared/table/StatusChip";
import { useToast } from "@/components/shared/toast/ToastProvider";
import type { Organization, OrgType } from "@/lib/supabase/types";

const ORG_TYPE_TONE: Record<string, ChipTone> = {
  government: "info",
  exporter: "warn",
  cooperative: "ok",
  ngo: "neutral",
  certifier: "info",
};

type OrgWithStats = Organization & {
  stats?: {
    users: number;
    farmers: number;
    lots: number;
    movements: number;
  };
};

const ORG_TYPES: OrgType[] = ["cooperative", "exporter", "government", "ngo", "certifier"];

export default function OrganizationsAdminClient() {
  const toast = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [orgs, setOrgs] = React.useState<OrgWithStats[]>([]);

  const [isCreating, setIsCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<OrgWithStats | null>(null);
  const [confirmClose, setConfirmClose] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/organizations", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed to load organizations (${res.status}).`);

      // Stats are derived client-side (pilot-friendly; no schema changes).
      const base = (j.organizations ?? []) as Organization[];
      setOrgs(base.map((o) => ({ ...o })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminPageShell
      title="Organizations"
      description="Create/edit organizations and manage pilot structure. (Super admin only)"
      actions={
        <>
          <button
            type="button"
            onClick={() => load()}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setSelected(null);
            }}
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New org
          </button>
        </>
      }
    >
      {error ? (
        <AlertBanner severity="danger" message={error} actions={[{ label: "Retry", onClick: load }]} />
      ) : null}

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[12px] text-gray-700">
            Showing <span className="font-mono">{orgs.length}</span> organizations
          </div>
          <a href="/admin/users" className="text-[12px] text-forest-800 hover:underline">
            Manage users →
          </a>
        </div>

        {isLoading ? (
          <div className="p-5 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading organizations…
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[12px] font-medium text-gray-900">No organizations yet</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Create a cooperative/exporter/government org to structure pilot access.
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-[860px] w-full text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Organization</th>
                  <th className="text-left font-medium px-3 py-3">Type</th>
                  <th className="text-left font-medium px-3 py-3">County</th>
                  <th className="text-left font-medium px-3 py-3">License</th>
                  <th className="text-left font-medium px-3 py-3">Created</th>
                  <th className="w-10 px-3 py-3" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((o) => (
                  <tr key={o.id} className="group hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{o.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{o.id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip tone={ORG_TYPE_TONE[o.type] ?? "neutral"}>{o.type}</StatusChip>
                    </td>
                    <td className="px-3 py-3">{o.county ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{o.license_number ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-forest-700" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(isCreating || selected) && (
        <OrgEditor
          org={selected}
          onClose={() => setConfirmClose(true)}
          onSave={async (payload) => {
            try {
              const res = await fetch("/api/admin/organizations", {
                method: payload.id ? "PATCH" : "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              });
              const j = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(j.error ?? `Save failed (${res.status}).`);
              toast.success(payload.id ? "Organization updated" : "Organization created");
              setIsCreating(false);
              setSelected(null);
              setConfirmClose(false);
              await load();
            } catch (e) {
              toast.error("Save failed", e instanceof Error ? e.message : "Unable to save.");
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmClose}
        title="Discard changes?"
        message="Close without saving changes?"
        confirmLabel="Discard"
        tone="neutral"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          setIsCreating(false);
          setSelected(null);
        }}
      />
    </AdminPageShell>
  );
}

function OrgEditor({
  org,
  onClose,
  onSave,
}: {
  org: OrgWithStats | null;
  onClose: () => void;
  onSave: (payload: Partial<Organization> & { id?: string }) => void;
}) {
  const [name, setName] = React.useState(org?.name ?? "");
  const [type, setType] = React.useState<OrgType>(org?.type ?? "cooperative");
  const [country, setCountry] = React.useState(org?.country ?? "Liberia");
  const [county, setCounty] = React.useState(org?.county ?? "");
  const [license, setLicense] = React.useState(org?.license_number ?? "");
  const [contactName, setContactName] = React.useState(org?.contact_name ?? "");
  const [contactPhone, setContactPhone] = React.useState(org?.contact_phone ?? "");
  const [district, setDistrict] = React.useState("");
  const [taxId, setTaxId] = React.useState("");

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-ink-900">{org ? "Edit organization" : "New organization"}</h2>
            <p className="mt-1 text-[13px] text-slate-600">National organization record with ministry identifiers and contact routing.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-gov-outline h-9 rounded-lg px-3 text-[12px]">
            Close
          </button>
        </div>

        <form
          className="space-y-5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onSave({
              id: org?.id,
              name: name.trim(),
              type,
              country: country.trim() || "Liberia",
              county: county.trim() || null,
              license_number: license.trim() || null,
              contact_name: contactName.trim() || null,
              contact_phone: contactPhone.trim() || null,
            });
          }}
        >
          <EnterpriseFormSection title="Organization identity">
            <div className="grid gap-4 md:grid-cols-2">
              <EnterpriseFormField id="org-name" label="Legal name" required>
                <input id="org-name" required value={name} onChange={(e) => setName(e.target.value)} className="av-input" />
              </EnterpriseFormField>
              <EnterpriseFormField id="org-type" label="Organization type" required>
                <select id="org-type" value={type} onChange={(e) => setType(e.target.value as OrgType)} className="av-input">
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </EnterpriseFormField>
              <EnterpriseFormField id="org-license" label="License / registration number" helper="Cooperative registration, export license, or ministry permit.">
                <input id="org-license" value={license} onChange={(e) => setLicense(e.target.value)} className="av-input" placeholder="Optional" />
              </EnterpriseFormField>
              <EnterpriseFormField id="org-tax" label="Tax identification number (TIN)" hint="Future-ready field — not persisted until schema column is provisioned.">
                <input id="org-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="av-input" placeholder="Optional" />
              </EnterpriseFormField>
            </div>
          </EnterpriseFormSection>

          <EnterpriseFormSection title="Location">
            <div className="grid gap-4 md:grid-cols-2">
              <EnterpriseFormField id="org-country" label="Country">
                <input id="org-country" value={country} onChange={(e) => setCountry(e.target.value)} className="av-input" />
              </EnterpriseFormField>
              <EnterpriseFormField id="org-county" label="County">
                <CountySelect value={county} onChange={setCounty} allCounties={false} allowAllOption className="av-input" />
              </EnterpriseFormField>
              <EnterpriseFormField id="org-district" label="District" hint="Recorded locally for routing — not yet a database column.">
                <input id="org-district" value={district} onChange={(e) => setDistrict(e.target.value)} className="av-input" placeholder="Optional" />
              </EnterpriseFormField>
            </div>
          </EnterpriseFormSection>

          <EnterpriseFormSection title="Primary contact">
            <div className="grid gap-4 md:grid-cols-2">
              <EnterpriseFormField id="org-contact" label="Contact person">
                <input id="org-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className="av-input" placeholder="Full name" />
              </EnterpriseFormField>
              <EnterpriseFormField id="org-phone" label="Phone number" helper="Liberia format: +231 …">
                <input id="org-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="av-input" placeholder="+231 77 000 0000" />
              </EnterpriseFormField>
            </div>
          </EnterpriseFormSection>

          <EnterpriseFormActions onCancel={onClose} submitLabel="Save organization" />
        </form>
      </div>
    </div>
  );
}

