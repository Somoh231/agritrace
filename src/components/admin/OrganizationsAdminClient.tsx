"use client";

import * as React from "react";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/toast/ToastProvider";
import type { Organization, OrgType } from "@/lib/supabase/types";

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
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-lg text-gray-900">Organizations</div>
            <div className="mt-1 text-[12px] text-gray-600">
              Create/edit organizations and manage pilot structure. (Super admin only)
            </div>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <AlertBanner severity="danger" message={error} actions={[{ label: "Retry", onClick: load }]} />
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Organization</th>
                  <th className="text-left font-medium px-3 py-3">Type</th>
                  <th className="text-left font-medium px-3 py-3">County</th>
                  <th className="text-left font-medium px-3 py-3">License</th>
                  <th className="text-left font-medium px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{o.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{o.id}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">{o.type}</td>
                    <td className="px-3 py-3">{o.county ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{o.license_number ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">
                      {new Date(o.created_at).toLocaleDateString()}
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
    </div>
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

  return (
    <div className="fixed inset-0 z-[110] bg-black/30 flex items-center justify-center px-4">
      <div className="w-full max-w-[760px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[16px] text-gray-900">{org ? "Edit organization" : "New organization"}</div>
            <div className="mt-1 text-[11px] text-gray-500">Pilot-ready organization record</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <input value={country} onChange={(e) => setCountry(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" />
          </Field>
          <Field label="County">
            <input value={county} onChange={(e) => setCounty(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" placeholder="optional" />
          </Field>
          <Field label="License #">
            <input value={license} onChange={(e) => setLicense(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" placeholder="optional" />
          </Field>
          <div />
          <Field label="Contact name">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" placeholder="optional" />
          </Field>
          <Field label="Contact phone">
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]" placeholder="optional" />
          </Field>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onSave({
                id: org?.id,
                name: name.trim(),
                type,
                country: country.trim() || "Liberia",
                county: county.trim() || null,
                license_number: license.trim() || null,
                contact_name: contactName.trim() || null,
                contact_phone: contactPhone.trim() || null,
              })
            }
            disabled={!name.trim()}
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

