"use client";

import * as React from "react";
import { Loader2, RefreshCcw, Search } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/toast/ToastProvider";
import type { Organization, UserRole } from "@/lib/supabase/types";

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
    phone: string | null;
    is_active: boolean;
    deactivated_at: string | null;
    created_at: string;
  };
};

const ROLE_OPTIONS: UserRole[] = [
  "super_admin",
  "government_officer",
  "county_officer",
  "exporter",
  "cooperative_manager",
  "field_agent",
  "call_center_agent",
  "auditor",
];

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

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [orgsError, setOrgsError] = React.useState<string | null>(null);

  const [selected, setSelected] = React.useState<AdminUser | null>(null);
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

  const onSave = async (patch: {
    userId: string;
    role?: UserRole;
    organization_id?: string | null;
    full_name?: string;
    county?: string | null;
    phone?: string | null;
    is_active?: boolean;
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed to update user (${res.status}).`);
      toast.success("User updated", "Changes saved.");
      await loadUsers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update user.";
      toast.error("Update failed", msg);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div>
            <div className="font-display text-lg text-gray-900">User Management</div>
            <div className="mt-1 text-[12px] text-gray-600">
              Search users, assign roles, and activate/deactivate accounts. (Super admin only)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
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
        </div>

        {error ? (
          <div className="mt-4">
            <AlertBanner
              severity="danger"
              message={error}
              actions={[{ label: "Retry", onClick: loadUsers }]}
            />
          </div>
        ) : null}

        {orgsError ? (
          <div className="mt-2">
            <AlertBanner
              severity="warning"
              message={orgsError}
              actions={[{ label: "Retry", onClick: loadOrgs }]}
            />
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[12px] text-gray-700">
            Showing <span className="font-mono">{users.length}</span> users
          </div>
          <a href="/setup" className="text-[12px] text-forest-800 hover:underline">
            Setup help
          </a>
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
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-5 py-3">User</th>
                  <th className="text-left font-medium px-3 py-3">Role</th>
                  <th className="text-left font-medium px-3 py-3">Org</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3">Last sign-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(u)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {u.profile?.full_name ?? "(No profile)"}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">{u.email ?? u.id}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">{u.profile?.role ?? "—"}</td>
                    <td className="px-3 py-3">
                      {u.profile?.organization_id
                        ? orgs.find((o) => o.id === u.profile?.organization_id)?.name ??
                          "(Unknown org)"
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {u.profile?.is_active === false ? (
                        <span className="font-mono text-[11px] text-red-700">deactivated</span>
                      ) : (
                        <span className="font-mono text-[11px] text-green-700">active</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">
                      {fmt(u.last_sign_in_at)}
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
          onClose={() => setSelected(null)}
          onSave={onSave}
          onToggleActive={(userId, nextActive) => setConfirm({ userId, nextActive })}
          isSaving={isSaving}
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
            await onSave({ userId: confirm.userId, is_active: confirm.nextActive });
            setConfirm(null);
            setSelected(null);
          } catch {
            // toast already shown
          }
        }}
      />
    </div>
  );
}

function UserEditor({
  user,
  orgs,
  onClose,
  onSave,
  onToggleActive,
  isSaving,
}: {
  user: AdminUser;
  orgs: Organization[];
  onClose: () => void;
  onSave: (patch: {
    userId: string;
    role?: UserRole;
    organization_id?: string | null;
    full_name?: string;
    county?: string | null;
    phone?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onToggleActive: (userId: string, nextActive: boolean) => void;
  isSaving: boolean;
}) {
  const p = user.profile;

  const [fullName, setFullName] = React.useState(p?.full_name ?? "");
  const [role, setRole] = React.useState<UserRole>(p?.role ?? "field_agent");
  const [orgId, setOrgId] = React.useState<string>(p?.organization_id ?? "");
  const [county, setCounty] = React.useState(p?.county ?? "");
  const [phone, setPhone] = React.useState(p?.phone ?? "");

  return (
    <div className="fixed inset-0 z-[110] bg-black/30 flex items-center justify-center px-4">
      <div className="w-full max-w-[720px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[16px] text-gray-900">Edit user</div>
            <div className="mt-1 text-[11px] text-gray-500 font-mono">{user.email ?? user.id}</div>
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
          {!p ? (
            <div className="md:col-span-2">
              <AlertBanner
                severity="warning"
                message="This user has no profile row yet. Create a matching profiles row before assigning roles/org."
              />
            </div>
          ) : null}

          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
            />
          </Field>

          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Organization">
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]"
            >
              <option value="">—</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="County">
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
              placeholder="optional"
            />
          </Field>

          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px]"
              placeholder="optional"
            />
          </Field>

          <Field label="Status">
            <div className="h-9 w-full rounded-md border border-gray-200 px-3 text-[12px] flex items-center justify-between">
              <span className={p?.is_active === false ? "text-red-700" : "text-green-700"}>
                {p?.is_active === false ? "deactivated" : "active"}
              </span>
              <button
                type="button"
                disabled={!p}
                onClick={() => onToggleActive(user.id, p?.is_active === false)}
                className="text-[12px] text-gray-700 hover:underline disabled:opacity-50"
              >
                {p?.is_active === false ? "Reactivate" : "Deactivate"}
              </button>
            </div>
          </Field>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!p) return;
              await onSave({
                userId: user.id,
                full_name: fullName.trim(),
                role,
                organization_id: orgId || null,
                county: county.trim() || null,
                phone: phone.trim() || null,
              });
              onClose();
            }}
            disabled={!p || isSaving}
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
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

