"use client";

import type { ReactNode } from "react";

import MinistryPageShell from "@/components/operations/MinistryPageShell";

export default function MinistryNarrativePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <MinistryPageShell title={title} description={description}>
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/35 px-5 py-6 text-[13px] text-slate-300 leading-relaxed space-y-4">
        {children}
      </div>
    </MinistryPageShell>
  );
}
