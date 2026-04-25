"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";

type Step = {
  id: string;
  title: string;
  summary: string;
  href: string;
  label: string;
};

const STEPS: Step[] = [
  {
    id: "rice",
    title: "Rice production visibility",
    summary: "National dashboard: production vs demand, loss signals, county charts.",
    href: "/rice?present=1&demo=1&step=rice",
    label: "Open Rice dashboard",
  },
  {
    id: "cocoa",
    title: "Cocoa lot tracking",
    summary: "Lot register and movement ledger: chain-of-custody traceability.",
    href: "/cocoa/lots?present=1&demo=1&step=cocoa",
    label: "Open Cocoa lots",
  },
  {
    id: "discrepancy",
    title: "Discrepancy resolution",
    summary: "Weight variance alerts: assign owner, notes, resolve with audit trail.",
    href: "/cocoa/discrepancies?present=1&demo=1&step=discrepancy",
    label: "Open Discrepancies",
  },
  {
    id: "compliance",
    title: "Export compliance report",
    summary: "EUDR checklist and export-ready evidence views for partners.",
    href: "/cocoa/eudr?present=1&demo=1&step=compliance",
    label: "Open EUDR checklist",
  },
];

export default function DemoGuideClient() {
  const router = useRouter();
  const [idx, setIdx] = React.useState(0);
  const step = STEPS[idx]!;

  return (
    <div className="min-h-screen bg-[rgb(var(--surface))]">
      <header className="border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-[12px] text-forest-700 hover:underline underline-offset-2">
            ← Back to home
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            Executive demo mode
          </div>
          <Link
            href="/login"
            className="h-10 px-4 rounded-xl bg-forest-800 text-white text-[12px] hover:bg-forest-900 inline-flex items-center shadow-sm"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        <div className="av-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-400">
                Step {String(idx + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </div>
              <h1 className="mt-2 font-display text-[28px] sm:text-[34px] text-ink-900 leading-tight">
                {step.title}
              </h1>
              <p className="mt-2 text-[13px] text-slate-600 leading-relaxed max-w-2xl">
                {step.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(step.href)}
              className="av-btn-primary h-12 px-5 text-[13px] inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {step.label}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="Presentation mode" detail="Opens dashboards full-screen (no sidebar/topbar) for meetings." />
            <Card title="Next-step walkthrough" detail="Use the buttons below to advance the story in order." />
          </div>
        </div>

        <div className="av-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="font-display text-[16px] text-ink-900">Walkthrough</div>
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-[2px]">
              Next step
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {STEPS.map((s, i) => {
              const done = i < idx;
              const active = i === idx;
              return (
                <li key={s.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700" />
                      ) : (
                        <span
                          className={`h-4 w-4 rounded-full border ${active ? "border-forest-300 bg-forest-50" : "border-gray-200"}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="text-[13px] font-medium text-ink-900">{s.title}</div>
                    </div>
                    <div className="mt-1 text-[12px] text-slate-600 leading-relaxed">{s.summary}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIdx(i)}
                      className="av-btn-secondary h-10 px-4"
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(s.href)}
                      className="av-btn-primary h-10 px-4"
                    >
                      Open
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            disabled={idx === 0}
            className="av-btn-secondary h-11 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setIdx((v) => Math.min(STEPS.length - 1, v + 1))}
            disabled={idx === STEPS.length - 1}
            className="av-btn-primary h-11 px-5 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            Next step <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

function Card({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-[13px] font-medium text-ink-900">{title}</div>
      <div className="mt-1 text-[12px] text-slate-600 leading-relaxed">{detail}</div>
    </div>
  );
}

