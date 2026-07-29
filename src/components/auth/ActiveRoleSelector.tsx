"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import { formatRoleLabel } from "@/lib/display/role-labels";
import type { UserRole } from "@/lib/supabase/types";

export default function ActiveRoleSelector({
  roles,
  currentRole,
}: {
  roles: UserRole[];
  currentRole: UserRole;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<UserRole | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const selectRole = async (role: UserRole) => {
    setPending(role);
    setError(null);
    try {
      const response = await fetch("/api/auth/active-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Role selection failed.");
      router.replace(result.redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Role selection failed.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-[22px] text-slate-950">Choose your workspace</h1>
        <p className="mt-2 text-[13px] text-slate-600">
          Your selected assigned role becomes the active database role for routing and row-level security.
        </p>
        {error ? <div className="mt-4"><AlertBanner severity="danger" message={error} /></div> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              disabled={Boolean(pending)}
              onClick={() => void selectRole(role)}
              className="rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
            >
              <span className="block text-[13px] font-semibold text-slate-900">{formatRoleLabel(role)}</span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {role === currentRole ? "Current workspace" : "Switch to this assigned workspace"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
