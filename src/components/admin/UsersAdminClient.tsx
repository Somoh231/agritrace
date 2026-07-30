"use client";

import * as React from "react";
import { ChevronRight, KeyRound, Loader2, Mail, Plus, RefreshCcw, Search } from "lucide-react";

import AdminPageShell, { ADMIN_CARD } from "@/components/admin/AdminPageShell";
import AlertBanner from "@/components/shared/AlertBanner";
import CountySelect from "@/components/shared/CountySelect";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip from "@/components/shared/table/StatusChip";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { PROVISIONABLE_ROLES } from "@/lib/admin/user-provisioning";
import { formatRoleLabel } from "@/lib/display/role-labels";
import type { Organization, ProfileRoleAssignment, UserRole } from "@/lib/supabase/types";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  profile: null | {
    id: string;
    full_name: string;
    role: UserRole;
    organization_id: string | null;
    county: string | null;
    district: string | null;
    clan_or_field_area: string | null;
    phone: string | null;
    employee_or_staff_id: string | null;
    job_title: string | null;
    department: string | null;
    account_status: "incomplete" | "invited" | "active" | "inactive" | "suspended";
    is_active: boolean;
    invited_at: string | null;
    activated_at: string | null;
    deactivated_at: string | null;
    created_at: string;
  };
  role_assignments: ProfileRoleAssignment[];
  warehouse_ids: string[];
  access_history: Array<{
    id: string;
    user_id: string | null;
    action: string;
    record_id: string;
    new_values: Record<string, unknown> | null;
    created_at: string;
  }>;
};

type WarehouseOption = {
  id: string;
  name: string;
  county: string;
};

const ROLE_OPTIONS = PROVISIONABLE_ROLES;

function fmt(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function UsersAdminClient() {
  const toast = useToast();

  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<UserRole | "">("");
  const [active, setActive] = React.useState<"" | "true" | "false">("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [schemaReady, setSchemaReady] = React.useState(true);
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [orgsError, setOrgsError] = React.useState<string | null>(null);

  const [selected, setSelected] = React.useState<AdminUser | null>(null);
  const [showInvite, setShowInvite] = React.useState(false);
  const [confirm, setConfirm] = React.useState<null | { userId: string; nextActive: boolean }>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadOrgs = React.useCallback(async () => {
    setOrgsError(null);
    try {
      const res = await fetch("/api/admin/organizations", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed to load organizations (${res.status}).`);
      setOrgs((j.organizations ?? []) as Organization[]);
    } catch (e) {
      setOrgsError(e instanceof Error ? e.message : "Failed to load organizations.");
    }
  }, []);

  const loadUsers = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (role) sp.set("role", role);
      if (active) sp.set("active", active);

      const res = await fetch(`/api/admin/users?${sp.toString()}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed to load users (${res.status}).`);
      setUsers((j.users ?? []) as AdminUser[]);
      setWarehouses((j.warehouses ?? []) as WarehouseOption[]);
      setSchemaReady(j.schemaReady !== false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [q, role, active]);

  React.useEffect(() => {
    loadUsers();
    loadOrgs();
  }, [loadUsers, loadOrgs]);

  const mutateUser = async (method: "POST" | "PATCH" | "PUT", body: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `User operation failed (${res.status}).`);
      toast.success(
        method === "POST" ? "Invitation sent" : "User updated",
        method === "POST" ? "The user can choose a private password from the secure link." : "Changes saved.",
      );
      await loadUsers();
      return j;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "User operation failed.";
      toast.error("Operation failed", msg);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPageShell
      title="User Management"
      description="Provision unique workforce identities, explicit roles, organizational scope, and account access."
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <button
              type="button"
              disabled={!schemaReady}
              onClick={() => setShowInvite(true)}
              className="h-9 self-end px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Invite user
            </button>
            <div className="relative">
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Search
              </div>
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-[34px]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="name, email, role"
                className="h-9 w-[260px] max-w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-[12px] outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-50"
              />
            </div>

            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Role
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="">All</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Status
              </div>
              <select
                value={active}
                onChange={(e) => setActive(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-[12px]"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Deactivated</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadUsers()}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
      }
    >
      {error ? (
        <AlertBanner
          severity="danger"
          message={error}
          actions={[{ label: "Retry", onClick: loadUsers }]}
        />
      ) : null}

      {orgsError ? (
        <AlertBanner
          severity="warning"
          message={orgsError}
          actions={[{ label: "Retry", onClick: loadOrgs }]}
        />
      ) : null}

      {!schemaReady ? (
        <AlertBanner
          severity="warning"
          message="Read-only legacy mode: the workforce identity migration has not been applied to this environment. Invitations and role changes remain disabled."
        />
      ) : null}

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[12px] text-gray-700">
            Showing <span className="font-mono">{users.length}</span> users
          </div>
          <span className="text-[11px] text-gray-500">Passwords are never visible to administrators.</span>
        </div>

        {isLoading ? (
          <div className="p-5 text-[12px] text-gray-600 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[12px] font-medium text-gray-900">No matching users</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Try a broader query, or seed demo data.
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-[860px] w-full text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">User</th>
                  <th className="text-left font-medium px-3 py-3">Role</th>
                  <th className="text-left font-medium px-3 py-3">Org</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3">Last sign-in</th>
                  <th className="w-10 px-3 py-3" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="group hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(u)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {u.profile?.full_name ?? "(No profile)"}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">{u.email ?? u.id}</div>
                    </td>
                    <td className="px-3 py-3">
                      {u.role_assignments?.length ? (
                        <div className="flex max-w-[280px] flex-wrap gap-1">
                          {u.role_assignments.map((assignment) => (
                            <StatusChip key={assignment.role} tone="neutral" dot={false}>
                              {formatRoleLabel(assignment.role)}
                              {assignment.is_primary ? " · primary" : ""}
                            </StatusChip>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {u.profile?.organization_id
                        ? orgs.find((o) => o.id === u.profile?.organization_id)?.name ??
                          "(Unknown org)"
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {u.profile?.account_status === "invited" ? (
                        <StatusChip tone="warn">Invited</StatusChip>
                      ) : u.profile?.is_active === false ? (
                        <StatusChip tone="danger">{u.profile?.account_status ?? "Inactive"}</StatusChip>
                      ) : (
                        <StatusChip tone="ok">Active</StatusChip>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">
                      {fmt(u.last_sign_in_at)}
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

      {selected ? (
          <UserEditor
            user={selected}
            orgs={orgs}
            warehouses={warehouses}
          onClose={() => setSelected(null)}
          onMutate={mutateUser}
          onToggleActive={(userId, nextActive) => setConfirm({ userId, nextActive })}
          isSaving={isSaving}
        />
      ) : null}

      {showInvite ? (
          <UserProvisioningForm
            orgs={orgs}
            warehouses={warehouses}
          isSaving={isSaving}
          onClose={() => setShowInvite(false)}
          onSubmit={async (payload) => {
            await mutateUser("POST", payload);
            setShowInvite(false);
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.nextActive ? "Reactivate user?" : "Deactivate user?"}
        message={
          confirm?.nextActive
            ? "This user will regain access to protected pages."
            : "This will block access to protected pages for this user without deleting their account."
        }
        confirmLabel={confirm?.nextActive ? "Reactivate" : "Deactivate"}
        tone="danger"
        isBusy={isSaving}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          try {
            const target = users.find((user) => user.id === confirm.userId);
            if (!target?.profile) throw new Error("Profile unavailable.");
            await mutateUser("PATCH", profilePayload(target, { is_active: confirm.nextActive }));
            setConfirm(null);
            setSelected(null);
          } catch {
            // toast already shown
          }
        }}
      />
    </AdminPageShell>
  );
}

type WorkforceFormState = {
  email: string;
  full_name: string;
  roles: UserRole[];
  primary_role: UserRole;
  organization_id: string;
  county: string;
  district: string;
  clan_or_field_area: string;
  phone: string;
  employee_or_staff_id: string;
  job_title: string;
  department: string;
  warehouse_ids: string[];
};

function initialForm(user?: AdminUser): WorkforceFormState {
  const profile = user?.profile;
  const roles = user?.role_assignments?.map((assignment) => assignment.role) ?? ["clan_technician"];
  return {
    email: user?.email ?? "",
    full_name: profile?.full_name ?? "",
    roles,
    primary_role:
      user?.role_assignments?.find((assignment) => assignment.is_primary)?.role ??
      profile?.role ??
      roles[0],
    organization_id: profile?.organization_id ?? "",
    county: profile?.county ?? "",
    district: profile?.district ?? "",
    clan_or_field_area: profile?.clan_or_field_area ?? "",
    phone: profile?.phone ?? "",
    employee_or_staff_id: profile?.employee_or_staff_id ?? "",
    job_title: profile?.job_title ?? "",
    department: profile?.department ?? "",
    warehouse_ids: user?.warehouse_ids ?? [],
  };
}

function formPayload(form: WorkforceFormState) {
  return {
    email: form.email,
    full_name: form.full_name,
    roles: form.roles,
    primary_role: form.primary_role,
    organization_id: form.organization_id,
    county: form.county || null,
    district: form.district || null,
    clan_or_field_area: form.clan_or_field_area || null,
    phone: form.phone || null,
    employee_or_staff_id: form.employee_or_staff_id || null,
    job_title: form.job_title || null,
    department: form.department || null,
    warehouse_ids: form.warehouse_ids,
  };
}

function profilePayload(user: AdminUser, override: Record<string, unknown> = {}) {
  return { userId: user.id, ...formPayload(initialForm(user)), ...override };
}

function UserEditor({
  user,
  orgs,
  warehouses,
  onClose,
  onMutate,
  onToggleActive,
  isSaving,
}: {
  user: AdminUser;
  orgs: Organization[];
  warehouses: WarehouseOption[];
  onClose: () => void;
  onMutate: (method: "POST" | "PATCH" | "PUT", body: Record<string, unknown>) => Promise<unknown>;
  onToggleActive: (userId: string, nextActive: boolean) => void;
  isSaving: boolean;
}) {
  const profile = user.profile;
  const [form, setForm] = React.useState(() => initialForm(user));
  const set = (key: keyof WorkforceFormState, value: WorkforceFormState[typeof key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title="Workforce access" subtitle={user.email ?? user.id} onClose={onClose} width="max-w-[900px]">
      {!profile ? (
        <AlertBanner
          severity="warning"
          message="This Auth identity has no operational profile and cannot access AgriVault workspaces."
        />
      ) : (
        <>
          <WorkforceFields form={form} set={set} orgs={orgs} warehouses={warehouses} emailReadOnly />
          <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Access status</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusChip tone={profile.is_active ? "ok" : "danger"}>
                  {profile.account_status}
                </StatusChip>
                <button
                  type="button"
                  onClick={() => onToggleActive(user.id, !profile.is_active)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-[12px] hover:bg-gray-50"
                >
                  {profile.is_active ? "Deactivate" : "Activate"}
                </button>
                {profile.account_status === "invited" ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void onMutate("PUT", { userId: user.id, action: "resend_invitation" })}
                    className="h-9 rounded-md border border-gray-200 px-3 text-[12px] hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" /> Resend setup link
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void onMutate("PUT", { userId: user.id, action: "password_reset" })}
                  className="h-9 rounded-md border border-gray-200 px-3 text-[12px] hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <KeyRound className="h-4 w-4" /> Password reset
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Last sign-in: {fmt(user.last_sign_in_at)} · Activated: {fmt(profile.activated_at)}
              </p>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Access history</div>
              <div className="mt-2 max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-100 p-2">
                {user.access_history.length ? (
                  user.access_history.map((event) => (
                    <div key={event.id} className="flex justify-between gap-3 text-[11px]">
                      <span>{event.action.replace(/_/g, " ").toLowerCase()}</span>
                      <span className="font-mono text-gray-400">{fmt(event.created_at)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-gray-500">No provisioning history recorded yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border px-3 text-[12px]">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                await onMutate("PATCH", { userId: user.id, ...formPayload(form) });
                onClose();
              }}
              className="h-9 rounded-md bg-forest-700 px-3 text-[12px] text-white disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save access profile"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function UserProvisioningForm({
  orgs,
  warehouses,
  onClose,
  onSubmit,
  isSaving,
}: {
  orgs: Organization[];
  warehouses: WarehouseOption[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = React.useState<WorkforceFormState>(() => initialForm());
  const set = (key: keyof WorkforceFormState, value: WorkforceFormState[typeof key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal
      title="Invite workforce user"
      subtitle="Supabase sends a secure password-setup link; no temporary password is created."
      onClose={onClose}
      width="max-w-[900px]"
    >
      <WorkforceFields form={form} set={set} orgs={orgs} warehouses={warehouses} />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-9 rounded-md border px-3 text-[12px]">
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onSubmit(formPayload(form))}
          className="h-9 rounded-md bg-forest-700 px-3 text-[12px] text-white disabled:opacity-50"
        >
          {isSaving ? "Sending…" : "Create account and send invitation"}
        </button>
      </div>
    </Modal>
  );
}

function WorkforceFields({
  form,
  set,
  orgs,
  warehouses,
  emailReadOnly = false,
}: {
  form: WorkforceFormState;
  set: (key: keyof WorkforceFormState, value: any) => void;
  orgs: Organization[];
  warehouses: WarehouseOption[];
  emailReadOnly?: boolean;
}) {
  const toggleRole = (role: UserRole) => {
    const selected = form.roles.includes(role);
    const roles = selected ? form.roles.filter((item) => item !== role) : [...form.roles, role];
    set("roles", roles);
    if (selected && form.primary_role === role && roles[0]) set("primary_role", roles[0]);
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label="Work email">
        <input
          type="email"
          readOnly={emailReadOnly}
          value={form.email}
          onChange={(event) => set("email", event.target.value)}
          className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px] read-only:bg-gray-50"
        />
      </Field>
      <Field label="Full name">
        <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Employee / staff ID">
        <input value={form.employee_or_staff_id} onChange={(e) => set("employee_or_staff_id", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Job title">
        <input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Department / Ministry unit">
        <input value={form.department} onChange={(e) => set("department", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Organization / Ministry unit">
        <select value={form.organization_id} onChange={(e) => set("organization_id", e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 text-[12px]">
          <option value="">Select required assignment</option>
          {orgs.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </select>
      </Field>
      <Field label="Primary role">
        <select value={form.primary_role} onChange={(e) => set("primary_role", e.target.value as UserRole)} className="h-9 w-full rounded-md border bg-white px-2 text-[12px]">
          {form.roles.map((role) => <option key={role} value={role}>{formatRoleLabel(role)}</option>)}
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Explicit role assignments">
          <div className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_OPTIONS.map((role) => (
              <label key={role} className="flex items-start gap-2 text-[11px] text-gray-700">
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                <span>{formatRoleLabel(role)}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
      <Field label="County">
        <CountySelect value={form.county} onChange={(value) => set("county", value)} allCounties={false} allowAllOption className="h-9 w-full rounded-md border bg-white px-2 text-[12px]" />
      </Field>
      <Field label="District">
        <input value={form.district} onChange={(e) => set("district", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      <Field label="Clan / field area">
        <input value={form.clan_or_field_area} onChange={(e) => set("clan_or_field_area", e.target.value)} className="h-9 w-full rounded-md border px-3 text-[12px]" />
      </Field>
      {form.roles.includes("warehouse_manager") ? (
        <div className="md:col-span-2">
          <Field label="Warehouse assignments">
            <div className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {warehouses.length ? (
                warehouses.map((warehouse) => (
                  <label key={warehouse.id} className="flex items-start gap-2 text-[11px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.warehouse_ids.includes(warehouse.id)}
                      onChange={() =>
                        set(
                          "warehouse_ids",
                          form.warehouse_ids.includes(warehouse.id)
                            ? form.warehouse_ids.filter((id) => id !== warehouse.id)
                            : [...form.warehouse_ids, warehouse.id],
                        )
                      }
                    />
                    <span>
                      {warehouse.name}
                      <span className="block text-gray-400">{warehouse.county}</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-[11px] text-red-700">
                  No warehouses are available. A warehouse manager cannot be provisioned.
                </p>
              )}
            </div>
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  width,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4 py-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`max-h-full w-full ${width} overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white p-5">
          <div><div className="font-display text-[16px] text-gray-900">{title}</div><div className="mt-1 text-[11px] text-gray-500">{subtitle}</div></div>
          <button type="button" onClick={onClose} className="h-9 rounded-md border px-3 text-[12px]">Close</button>
        </div>
        <div className="p-5">{children}</div>
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
