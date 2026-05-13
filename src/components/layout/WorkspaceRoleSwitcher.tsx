"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { WORKSPACE_PREVIEW_ROLES } from "@/lib/auth/workspace-demo-role";
import type { UserRole } from "@/lib/supabase/types";

const LABELS: Partial<Record<UserRole, string>> = {
  ministry_admin: "Ministry Admin",
  ministry_officer: "Ministry Officer",
  government_officer: "Ministry Officer (legacy)",
  county_agriculture_coordinator: "CAC · County Agriculture Coordinator",
  county_officer: "CAC · County Agriculture Coordinator (legacy)",
  dao_officer: "DAO · District Agriculture Officer",
  district_officer: "DAO · District Officer (legacy)",
  clan_technician: "CLAN · Clan Agriculture Crops Technician",
  field_agent: "CLAN / field capture (legacy)",
  warehouse_manager: "Warehouse Manager",
  donor_observer: "Donor observer",
  donor_partner: "Donor partner (legacy)",
  auditor: "Auditor",
  admin: "System Administrator",
};

export default function WorkspaceRoleSwitcher({
  effectiveRole,
  authenticRole,
}: {
  effectiveRole: UserRole;
  authenticRole: UserRole;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const previewActive = effectiveRole !== authenticRole;

  const applyRole = async (next: UserRole | "authentic") => {
    setPending(true);
    try {
      if (next === "authentic") {
        await fetch("/api/workspace-demo-role", { method: "DELETE" });
      } else {
        const res = await fetch("/api/workspace-demo-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: next }),
        });
        if (!res.ok) return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      <label htmlFor="ais-workspace-role" className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
        Workspace preview
      </label>
      <select
        id="ais-workspace-role"
        disabled={pending}
        value={previewActive ? effectiveRole : "authentic"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "authentic") void applyRole("authentic");
          else void applyRole(v as UserRole);
        }}
        className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-[12px] text-slate-100 outline-none focus:border-emerald-600 disabled:opacity-60 max-w-[280px]"
      >
        <option value="authentic">Signed-in identity ({LABELS[authenticRole] ?? authenticRole})</option>
        {WORKSPACE_PREVIEW_ROLES.map((r) => (
          <option key={r} value={r}>
            Preview · {LABELS[r] ?? r}
          </option>
        ))}
      </select>
      {previewActive ? (
        <p className="text-[10px] text-amber-200/85 leading-snug max-w-[300px]">
          UI routing only — Supabase policies still enforce your signed-in role ({authenticRole}).
        </p>
      ) : null}
    </div>
  );
}
