"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  LineChart,
  Map,
  ShieldCheck,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";

import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-paper-50">
      <MarketingNav />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.25]" aria-hidden="true">
            <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100/60 via-paper-50 to-transparent blur-2xl" />
          </div>

          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-18 pb-10 sm:pb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-[11px] text-slate-700 shadow-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-navy-950)] text-white font-mono text-[10px]">
                ★
              </span>
              Selected by the Ministry of Agriculture • Republic of Liberia •{" "}
              <span className="font-mono text-[10px] text-[var(--color-red-600)]">Pilot 2025–26</span>
            </div>

            <h1 className="mt-8 font-display text-[46px] sm:text-[74px] leading-[0.98] tracking-[-0.03em] text-ink-900">
              Real-time data infrastructure for Liberia&apos;s{" "}
              <span className="italic text-[var(--color-red-600)]">rice economy</span>.
            </h1>

            <p className="mt-6 mx-auto max-w-3xl text-[14px] sm:text-[16px] text-slate-600 leading-relaxed">
              Agrivault is the operational backbone for national food sovereignty — geotagged farmer registry,
              county-level production telemetry, and the audit trail ministries, donors, and exporters can rely on.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-demo" className="av-btn-red h-11 px-5 text-[12px] shadow-sm">
                Request a demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/rice" className="av-btn-outline h-11 px-5 text-[12px]">
                See the live dashboard
              </Link>
            </div>

            <div className="mt-5 text-[11px] text-slate-400">
              Used by ministries, cooperatives, and exporters across 15 counties. No card required.
            </div>
          </div>

          {/* PRODUCT MOCKUP */}
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-14 sm:pb-16">
            <BrowserMock />
          </div>
        </section>

        {/* NATIONAL PRIORITY */}
        <section className="border-t border-gray-100 bg-paper-50">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-18">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-red-600)]">
                  The national priority
                </div>
                <h2 className="mt-4 font-display text-[40px] sm:text-[54px] leading-[1.02] tracking-[-0.03em] text-ink-900">
                  Liberia imports <span className="italic text-[var(--color-red-600)]">59%</span> of its rice.
                  <br />
                  We make every kilogram count.
                </h2>
                <p className="mt-5 text-[13px] sm:text-[14px] text-slate-600 leading-relaxed max-w-[60ch]">
                  Rice is the political and nutritional backbone of Liberia. Cutting import dependence requires
                  defensible data — not estimates. Agrivault instruments the full chain: planting → harvest → loss →
                  market.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <StatCard value="59%" label="Rice import share" sub="down from 82% in 2022" />
                  <StatCard value="38,214" label="Geotagged farmers" sub="across 15 counties" />
                  <StatCard value="482,940 MT" label="Production YTD 2025/26" sub="+12.4% YoY" />
                  <StatCard value="14.2%" label="Avg post-harvest loss" sub="target: <10% by 2027" />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Path to self-sufficiency
                    </div>
                    <div className="mt-1 font-display text-[18px] text-ink-900">Imports vs. domestic production</div>
                  </div>
                  <div className="rounded-full bg-forest-50 border border-forest-100 px-3 py-1 text-[11px] text-forest-800">
                    ↓ −23 pts
                  </div>
                </div>
                <div className="p-5">
                  <MiniLineChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-18">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-red-600)]">
                  The platform
                </div>
                <h2 className="mt-4 font-display text-[36px] sm:text-[46px] leading-[1.05] tracking-[-0.03em] text-ink-900">
                  One stack. Rice first — built to extend.
                </h2>
              </div>
              <p className="max-w-sm text-[12px] text-slate-500 leading-relaxed">
                Rice ships with the platform. Cocoa, palm, coffee, and EUDR-grade exports plug into the same registry,
                ledger, and audit trail.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <CapabilityCard
                tag="Primary"
                tagTone="amber"
                title="Rice National Dashboard"
                detail="Production by county, yield gap, post-harvest loss attribution. The Minister’s Monday-morning view."
                icon={LineChart}
              />
              <CapabilityCard
                tag="Primary"
                tagTone="navy"
                title="Farmer Registry"
                detail="38,214 geotagged profiles. Plot boundaries, season records, subsidy targeting."
                icon={Users}
              />
              <CapabilityCard
                tag="Operations"
                tagTone="navy"
                title="Inventory & Movement Ledger"
                detail="Lot → movement → receiver confirmation, with discrepancies routed to approvals."
                icon={Wallet}
              />
              <CapabilityCard
                tag="Compliance"
                tagTone="amber"
                title="Audit Trail & Compliance Exports"
                detail="Every state change captured, signed, exportable. EUDR-ready chain of custody."
                icon={ShieldCheck}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                <CapabilityCard
                  tag="Maps"
                  tagTone="navy"
                  title="County Heatmaps"
                  detail="Operational geography for production, loss, and farmer density."
                  icon={Map}
                />
                <CapabilityCard
                  tag="Records"
                  tagTone="navy"
                  title="Farm Document Vault"
                  detail="Land titles, cooperative charters, permits, subsidy receipts — signed and exportable."
                  icon={FileText}
                />
                <CapabilityCard
                  tag="Reporting"
                  tagTone="navy"
                  title="Donor & Ministry Reports"
                  detail="Audit-ready PDFs and structured exports for World Bank, USAID, and parliament."
                  icon={Wheat}
                />
                <div className="rounded-2xl border border-gray-200 bg-paper-50 p-6 flex items-center justify-between">
                  <div>
                    <div className="font-display text-[18px] text-ink-900">Ready to see the stack live?</div>
                    <div className="mt-1 text-[12px] text-slate-600">
                      Explore rice dashboards, field workflows, and exports.
                    </div>
                  </div>
                  <Link href="/rice" className="av-btn-navy h-10 px-4 text-[12px]">
                    Open dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AUDIENCES */}
        <section className="border-t border-gray-100 bg-paper-50">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-18">
            <h2 className="text-center font-display text-[34px] sm:text-[44px] leading-[1.05] tracking-[-0.03em] text-ink-900">
              One source of truth. Five different audiences.
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <AudienceCard title="Minister of Agriculture" detail="Daily national rice picture, defensible against parliament." />
              <AudienceCard title="Donors" detail="Verified field activity, transparent KPI reporting." />
              <AudienceCard title="Investors" detail="Live ag‑economy data for capital allocation decisions." />
              <AudienceCard title="Cooperatives" detail="Farmer registry, plot tools, season records." />
              <AudienceCard title="Exporters" detail="Commodity chain‑of‑custody, document‑of‑record, EUDR‑ready." />
            </div>
          </div>
        </section>

        {/* TRUST / TESTIMONIAL */}
        <section className="relative overflow-hidden bg-[var(--color-navy-950)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true">
            <div className="absolute -right-10 -top-24 h-[420px] w-[420px] rotate-12 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-10 top-16 text-[240px] font-display opacity-[0.08] select-none">★</div>
          </div>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
            <div className="max-w-4xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">Trust</div>
              <blockquote className="mt-6 font-display text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em]">
                “For the first time, we have a single number for national rice production that we can defend — by
                county, by season, by farmer.”
              </blockquote>
              <div className="mt-7 flex items-center gap-3 text-white/70">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10" />
                <div>
                  <div className="text-[12px] text-white">Senior Advisor, Food Security</div>
                  <div className="text-[11px] text-white/60">Ministry of Agriculture · Republic of Liberia</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-18 text-center">
            <h2 className="font-display text-[34px] sm:text-[44px] leading-[1.05] tracking-[-0.03em] text-ink-900">
              Brief us. We’ll bring the numbers.
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-[12px] sm:text-[13px] text-slate-600 leading-relaxed">
              90-minute walkthrough tailored to ministry oversight, donor reporting, or commercial deployment. Monrovia
              or remote.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-demo" className="av-btn-red h-11 px-5 text-[12px] shadow-sm">
                Request demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/request-demo" className="av-btn-outline h-11 px-5 text-[12px]">
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="font-display text-[22px] text-ink-900">{value}</div>
      <div className="mt-2 text-[11px] text-slate-600">{label}</div>
      <div className="mt-1 text-[10px] text-slate-400">{sub}</div>
    </div>
  );
}

function BrowserMock() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-soft overflow-hidden">
      <div className="h-10 border-b border-gray-100 bg-paper-50 flex items-center gap-2 px-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
        </div>
        <div className="ml-3 flex-1">
          <div className="h-6 rounded-lg bg-white border border-gray-200 px-3 flex items-center text-[11px] text-slate-500">
            agrivault.gov.lr / rice / national
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-paper-50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--color-navy-950)] text-white grid place-items-center font-mono text-[10px]">
                ★
              </div>
              <div>
                <div className="font-display text-[14px] text-ink-900">Agrivault</div>
                <div className="font-mono text-[9px] text-slate-400">RICE · SEASON 2025/26</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-[12px] text-slate-600">
              <div className="font-medium text-ink-900">Rice National</div>
              <div>Farmer Registry</div>
              <div>Loss & Demand Gap</div>
              <div>Counties</div>
              <div>Farm Documents</div>
              <div>Compliance</div>
              <div>Audit Trail</div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-[22px] text-ink-900">National production overview</div>
                <div className="mt-1 text-[12px] text-slate-500">Defensible numbers by county, by season, by farmer.</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                  Q1 2026
                </div>
                <div className="rounded-lg bg-[var(--color-navy-950)] text-white px-3 py-2 text-[11px]">
                  Export PDF
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Production YTD" value="482,940" suffix="MT" delta="+12.4%" />
              <Kpi label="Import dependence" value="59" suffix="%" delta="−2pt" tone="red" />
              <Kpi label="Farmers registered" value="38,214" suffix="" delta="+1,840" tone="green" />
              <Kpi label="Avg loss" value="14.2" suffix="%" delta="−0.6pt" tone="green" />
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-[12px] font-medium text-ink-900">Production by county · MT</div>
                <div className="mt-4 space-y-3">
                  <BarRow name="Lofa" value="18,420" pct={86} />
                  <BarRow name="Bong" value="15,630" pct={78} />
                  <BarRow name="Nimba" value="14,180" pct={72} />
                  <BarRow name="Grand Bassa" value="9,420" pct={56} />
                  <BarRow name="Margibi" value="7,110" pct={44} />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-ink-900">Post-harvest loss alerts</div>
                  <div className="text-[11px] text-slate-400">Top 5 of 15</div>
                </div>
                <div className="mt-4 space-y-3">
                  <AlertRow county="Lofa" issue="drying delay" value="14.2%" tone="red" />
                  <AlertRow county="Bomi" issue="storage moisture" value="11.8%" tone="amber" />
                  <AlertRow county="Montserrado" issue="transport gap" value="9.4%" tone="green" />
                  <AlertRow county="Margibi" issue="milling losses" value="8.1%" tone="green" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-5 text-center">
          <div className="font-mono text-[10px] tracking-[0.24em] text-slate-400">
            OPERATIONAL ACROSS INSTITUTIONS THAT MOVE LIBERIAN AGRICULTURE
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-[11px] text-slate-500">
            <div>Ministry of Agriculture</div>
            <div>LACRA</div>
            <div>World Bank · STAR‑P</div>
            <div>USAID Feed the Future</div>
            <div>Cooperative Union</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  delta,
  tone = "slate",
}: {
  label: string;
  value: string;
  suffix: string;
  delta: string;
  tone?: "slate" | "red" | "green";
}) {
  const cls =
    tone === "red"
      ? "text-[var(--color-red-600)]"
      : tone === "green"
        ? "text-forest-700"
        : "text-slate-500";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="font-display text-[22px] text-ink-900">{value}</div>
        {suffix ? <div className="text-[11px] text-slate-400">{suffix}</div> : null}
      </div>
      <div className={`mt-1 text-[11px] ${cls}`}>{delta}</div>
    </div>
  );
}

function BarRow({ name, value, pct }: { name: string; value: string; pct: number }) {
  return (
    <div className="grid grid-cols-[90px_1fr_64px] items-center gap-3">
      <div className="text-[11px] text-slate-600">{name}</div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-amber-400/80" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-[11px] text-slate-500">{value}</div>
    </div>
  );
}

function AlertRow({
  county,
  issue,
  value,
  tone,
}: {
  county: string;
  issue: string;
  value: string;
  tone: "red" | "amber" | "green";
}) {
  const pill =
    tone === "red"
      ? "bg-red-50 text-[var(--color-red-600)] border-red-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800 border-amber-100"
        : "bg-forest-50 text-forest-800 border-forest-100";
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[12px] font-medium text-ink-900">{county}</div>
        <div className="mt-0.5 font-mono text-[10px] text-slate-400">{issue}</div>
      </div>
      <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${pill}`}>{value}</div>
    </div>
  );
}

function MiniLineChart() {
  return (
    <div className="rounded-xl border border-gray-100 bg-paper-50 p-4">
      <div className="h-[180px] w-full rounded-lg bg-gradient-to-b from-red-50 to-white border border-gray-100 relative overflow-hidden">
        <svg viewBox="0 0 520 180" className="absolute inset-0 h-full w-full">
          <path
            d="M0,40 C60,45 110,52 160,55 C220,60 280,70 340,82 C410,96 460,108 520,112"
            fill="none"
            stroke="rgba(204,17,51,0.9)"
            strokeWidth="3"
          />
          <path
            d="M0,130 C70,128 130,120 190,112 C250,104 310,95 370,88 C430,80 470,72 520,66"
            fill="none"
            stroke="rgba(200,154,31,0.95)"
            strokeWidth="3"
          />
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-red-600)]" />
          Imports % of supply
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Domestic production index
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({
  tag,
  tagTone,
  title,
  detail,
  icon: Icon,
}: {
  tag: string;
  tagTone: "navy" | "amber";
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const chip =
    tagTone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-slate-50 border-slate-200 text-slate-700";
  const dot = tagTone === "amber" ? "bg-amber-400" : "bg-[var(--color-navy-950)]";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm hover:shadow-soft transition">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-mono ${chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {tag.toUpperCase()}
        </div>
        <div className="h-8 w-8 rounded-xl border border-gray-200 bg-paper-50 grid place-items-center text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-6 font-display text-[18px] text-ink-900">{title}</div>
      <div className="mt-2 text-[12px] text-slate-600 leading-relaxed">{detail}</div>
    </div>
  );
}

function AudienceCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-[12px] font-medium text-ink-900">{title}</div>
      <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">{detail}</div>
    </div>
  );
}

// (Old homepage mock preview helpers removed)

