"use client";

import * as React from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRoleLabel } from "@/lib/display/role-labels";
import type { UserRole } from "@/lib/supabase/types";

export default function UserWorkspaceMenu({
  name,
  role,
  initials,
}: {
  name: string;
  role: UserRole;
  initials: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 pl-2 pr-2 text-[12px] text-slate-100 hover:bg-slate-800"
        aria-expanded={open}
      >
        <span className="h-7 w-7 rounded-full bg-emerald-700/40 grid place-items-center text-[11px] font-semibold text-emerald-100">
          {initials}
        </span>
        <span className="hidden lg:inline max-w-[120px] truncate">{name}</span>
        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[80] w-56 rounded-xl border border-slate-700 bg-slate-950 py-2 shadow-xl">
          <div className="px-3 pb-2 border-b border-slate-800">
            <div className="text-[12px] font-medium text-white truncate">{name}</div>
            <div className="font-mono text-[10px] text-emerald-200/70 truncate">{formatRoleLabel(role)}</div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
