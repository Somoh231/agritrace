"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileCheck2, Globe2, MapPin, ShieldCheck, Truck, Users } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-forest-700 grid place-items-center shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
            stroke="#c4edcb"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 17c2-3 6-7 10-9"
            stroke="#c4edcb"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="font-display text-[16px] text-gray-900 leading-tight">Agrivault</div>
        <div className="font-mono text-[10px] text-gray-400">Liberia · Traceability</div>
      </div>
    </div>
  );
}

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-[rgb(var(--surface))]">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="hidden sm:inline-flex h-10 px-4 rounded-xl border border-gray-200 bg-white text-[12px] text-gray-800 hover:bg-gray-50 items-center gap-2"
            >
              Executive demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="h-10 px-4 rounded-xl bg-forest-800 text-white text-[12px] hover:bg-forest-900 inline-flex items-center shadow-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-forest-100 bg-forest-50 px-3 py-1 text-[11px] text-forest-900">
                <span className="h-2 w-2 rounded-full bg-forest-600" aria-hidden="true" />
                Institutional-grade traceability for Liberia
              </div>
              <h1 className="mt-5 font-display text-[42px] sm:text-[54px] leading-[1.02] text-ink-900">
                Premium visibility and compliance—built for executive confidence.
              </h1>
              <p className="mt-5 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed max-w-[56ch]">
                Agrivault helps ministries, cooperatives, and exporters monitor production and chain of custody with
                audit-ready workflows, discrepancy resolution, approvals, and export documentation.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/request-demo"
                  className="av-btn-primary h-12 px-5 text-[13px]"
                >
                  Request demo <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="av-btn-secondary h-12 px-5 text-[13px]"
                >
                  Login
                </Link>
              </div>

              <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label="Modules" value="Rice + Cocoa" />
                <Stat label="Audit events" value="Major actions" />
                <Stat label="Pilot focus" value="Usable in field" />
              </div>
            </div>

            <div className="av-card p-5 sm:p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                Capability highlights
              </div>
              <div className="mt-4 space-y-2.5">
                <Feature icon={Globe2} title="National visibility" detail="County production, demand gap, loss signals." />
                <Feature icon={Users} title="Farmer registry" detail="Geotagged profiles with verification-ready fields." />
                <Feature icon={Truck} title="Chain of custody" detail="Lot → movements → receiver confirmation." />
                <Feature icon={ShieldCheck} title="Compliance outputs" detail="EUDR checklist + audit trail exports." />
                <Feature icon={FileCheck2} title="Integrity workflows" detail="Inventory ledger, approvals, discrepancies." />
                <Feature icon={MapPin} title="Maps" detail="County heatmap and operational views for pilots." />
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-900 leading-relaxed">
                Calm confidence for stakeholders: clear hierarchy, defensible lineage, and audit-ready outputs.
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-paper-50">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-[26px] text-ink-900">Designed for boardrooms and field teams</h2>
                <p className="mt-2 text-[13px] text-slate-600 max-w-[72ch]">
                  Polished dashboards and audit-ready workflows designed for decision-makers.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Mock previews (swap in real screenshots anytime)
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Preview
                title="Rice national dashboard"
                subtitle="KPIs + county breakdown + loss signals"
                accent="forest"
              />
              <Preview
                title="Cocoa integrity workflows"
                subtitle="Lots · movements · discrepancies · approvals"
                accent="amber"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniPreview title="Inventory ledger" lines={6} />
              <MiniPreview title="Discrepancy resolution" lines={6} />
              <MiniPreview title="Export compliance (EUDR)" lines={6} />
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-[22px] text-gray-900">Executive demo scenarios</h2>
                <p className="mt-1 text-[13px] text-gray-600">
                  A guided flow that tells the story: visibility → traceability → integrity → compliance.
                </p>
              </div>
              <Link
                href="/demo"
                className="h-10 px-4 rounded-lg bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center gap-2"
              >
                Start guided demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <DemoCard step="01" title="Rice production visibility" detail="National dashboard KPIs by county." />
              <DemoCard step="02" title="Cocoa lot tracking" detail="Lot register + movement ledger trace." />
              <DemoCard step="03" title="Discrepancy resolution" detail="Variance alerts → assign → resolve." />
              <DemoCard step="04" title="Export compliance report" detail="EUDR checklist + audit-ready outputs." />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-[20px] text-gray-900">Ready for a pilot briefing?</h3>
              <p className="mt-1 text-[13px] text-gray-600 leading-relaxed max-w-2xl">
                We can tailor the demo to ministry oversight, cooperative operations, or exporter compliance,
                and provide a pilot readiness checklist for deployment.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/request-demo"
                className="h-10 px-4 rounded-lg bg-forest-800 text-white text-[12px] hover:bg-forest-900 inline-flex items-center"
              >
                Request demo
              </Link>
              <Link
                href="/login"
                className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-800 hover:bg-gray-50 inline-flex items-center"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono">Agrivault · Liberia</div>
          <div className="flex items-center gap-3">
            <Link href="/request-demo" className="hover:underline underline-offset-2">
              Request demo
            </Link>
            <Link href="/login" className="hover:underline underline-offset-2">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-1 font-medium text-gray-900 text-[13px]">{value}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="h-9 w-9 rounded-lg bg-forest-50 border border-forest-100 grid place-items-center text-forest-800 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-gray-900">{title}</div>
        <div className="text-[11px] text-gray-500 leading-relaxed">{detail}</div>
      </div>
    </div>
  );
}

function DemoCard({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Step {step}</div>
      <div className="mt-2 font-display text-[16px] text-gray-900">{title}</div>
      <div className="mt-1 text-[12px] text-gray-600 leading-relaxed">{detail}</div>
    </div>
  );
}

function Preview({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: "forest" | "amber";
}) {
  const ring =
    accent === "forest"
      ? "border-forest-100 bg-forest-50/40"
      : "border-amber-200 bg-amber-50/60";
  const bar =
    accent === "forest" ? "from-forest-700 to-forest-500" : "from-amber-500 to-amber-200";

  return (
    <div className={`rounded-2xl border ${ring} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[16px] text-gray-900">{title}</div>
          <div className="mt-1 text-[12px] text-gray-600">{subtitle}</div>
        </div>
        <div className="font-mono text-[10px] text-gray-400">Preview</div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-10 border-b border-gray-100 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${bar}`} />
            <div className="text-[11px] font-medium text-gray-800">Agrivault</div>
          </div>
          <div className="text-[10px] font-mono text-gray-400">Live</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <KpiMock />
            <KpiMock />
            <KpiMock />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              County chart
            </div>
            <div className="mt-3 grid grid-cols-12 gap-1 items-end h-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm bg-gradient-to-t ${bar}`}
                  style={{ height: `${20 + ((i * 7) % 60)}%`, opacity: 0.15 + (i % 4) * 0.18 }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Recent activity
            </div>
            <div className="mt-2 space-y-2">
              <RowMock />
              <RowMock />
              <RowMock />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniPreview({ title, lines }: { title: string; lines: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="font-medium text-[12px] text-gray-900">{title}</div>
        <div className="font-mono text-[10px] text-gray-400">Mock</div>
      </div>
      <div className="p-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-md bg-gray-100"
            style={{ width: `${70 + ((i * 11) % 30)}%` }}
          />
        ))}
        <div className="pt-1">
          <div className="h-8 rounded-lg bg-forest-700/10 border border-forest-100" />
        </div>
      </div>
    </div>
  );
}

function KpiMock() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="h-2 w-[70%] rounded bg-gray-100" />
      <div className="mt-2 h-5 w-[45%] rounded bg-gray-200" />
      <div className="mt-2 h-2 w-[55%] rounded bg-gray-100" />
    </div>
  );
}

function RowMock() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-3 w-[70%] rounded bg-gray-100" />
        <div className="mt-1 h-2 w-[45%] rounded bg-gray-50" />
      </div>
      <div className="h-6 w-16 rounded-md bg-gray-50 border border-gray-100" />
    </div>
  );
}

