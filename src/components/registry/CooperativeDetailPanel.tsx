"use client";

import { AlertCard, EnterpriseDetailTile, StatusBadge } from "@/components/enterprise";

export default function CooperativeDetailPanel({
  row,
  onClose,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
}) {
  const license = row.license_number != null ? String(row.license_number) : null;
  const created = row.created_at != null ? String(row.created_at).slice(0, 10) : "—";
  const contactName = row.contact_name != null ? String(row.contact_name) : null;
  const contactPhone = row.contact_phone != null ? String(row.contact_phone) : null;

  return (
    <div className="space-y-5 text-[13px] text-ink-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Cooperative registry record</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">{String(row.name ?? "—")}</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{String(row.id ?? "")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-gov-outline h-9 rounded-lg px-3 text-[12px]"
        >
          Close
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EnterpriseDetailTile label="Organization type" value={String(row.type ?? "cooperative")} />
        <EnterpriseDetailTile label="County" value={String(row.county ?? "—")} />
        <EnterpriseDetailTile label="Country" value={String(row.country ?? "Liberia")} />
        <EnterpriseDetailTile
          label="Cooperative registration / license"
          value={
            license ? (
              <StatusBadge tone="success">Active · {license}</StatusBadge>
            ) : (
              <StatusBadge tone="warning">No license on file</StatusBadge>
            )
          }
        />
        <EnterpriseDetailTile label="Contact person" value={contactName ?? "—"} />
        <EnterpriseDetailTile label="Phone" value={contactPhone ?? "—"} />
        <EnterpriseDetailTile label="Registered" value={created} />
        <EnterpriseDetailTile label="District / clan" value="— (future registry field)" />
      </div>

      <AlertCard tone="info" title="Read-only institutional record">
        New cooperatives append to the organizations table with audit log entries on create. District, tax ID, and membership
        numbers will surface when dedicated columns are provisioned nationally.
      </AlertCard>
    </div>
  );
}
