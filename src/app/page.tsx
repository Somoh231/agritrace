import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgriVault — National agricultural data infrastructure",
  description:
    "Government-grade registry, mapping, and production intelligence for national food sovereignty and trusted reporting.",
};

const METRICS = [
  { label: "Pilot counties live", value: "3", note: "Nimba · Bong · Lofa" },
  { label: "Geotagged farmer profiles", value: "38,214", note: "registry + plots" },
  { label: "Production tracked (YTD)", value: "482,940 MT", note: "season 2025/26" },
  { label: "Avg post-harvest loss", value: "14.2%", note: "target <10%" },
] as const;

const CAPABILITIES = [
  {
    title: "National farmer registry",
    body: "Permanent IDs, county coverage, household profiles, and auditable registration history.",
    tag: "Registry",
  },
  {
    title: "Farm geo-mapping",
    body: "Plot records, GPS references, and operational geography for field planning and verification.",
    tag: "Mapping",
  },
  {
    title: "Production intelligence",
    body: "County comparisons, yield signals, loss alerts, and season-by-season performance.",
    tag: "Dashboards",
  },
  {
    title: "Audit trail & exports",
    body: "Every change is logged and exportable for ministry oversight, donors, and compliance workflows.",
    tag: "Governance",
  },
  {
    title: "Offline-first field operations",
    body: "Mobile-friendly forms that work without internet and sync automatically when connected.",
    tag: "Field",
  },
  {
    title: "Programme operations",
    body: "Coverage, beneficiary targeting, and reporting surfaces for subsidy and programme execution.",
    tag: "Programmes",
  },
] as const;

const STAKEHOLDERS = [
  {
    title: "Ministry leadership",
    body: "Defensible national numbers by county, by season, by farmer — ready for cabinet and parliament.",
  },
  { title: "County agriculture offices", body: "Work queues, coverage visibility, and operational follow-up in one system." },
  { title: "Donors & DFIs", body: "Audit-ready reporting, transparent KPIs, and traceable field activity." },
  { title: "Cooperatives & exporters", body: "Registry + records + compliance artifacts packaged for market access." },
] as const;

export default function Page() {
  return (
    <div className="min-h-screen bg-[color:var(--warm)] text-ink-900">
      <HomeNav />

      <main>
        <Hero />

        <section className="border-y border-gray-100 bg-white/60">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {METRICS.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--warm)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-18">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-red-600)]">
                  System capabilities
                </div>
                <h2 className="mt-4 font-display text-[34px] sm:text-[46px] leading-[1.05] tracking-[-0.03em] text-ink-900">
                  A government-grade stack for food sovereignty.
                </h2>
              </div>
              <p className="max-w-xl text-[12px] sm:text-[13px] text-slate-600 leading-relaxed">
                Built for field reality and ministry oversight: registry, mapping, intelligence, governance, and export
                surfaces — delivered with enterprise UX and auditability.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((c) => (
                <CapabilityCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-18">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-red-600)]">
                  Stakeholders
                </div>
                <h2 className="mt-4 font-display text-[34px] sm:text-[46px] leading-[1.05] tracking-[-0.03em] text-ink-900">
                  One source of truth across institutions.
                </h2>
                <p className="mt-4 text-[13px] sm:text-[14px] text-slate-600 leading-relaxed max-w-[65ch]">
                  AgriVault is designed to support government governance, donor reporting, and market readiness — with a
                  single operational system and a consistent audit trail.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  <Link href="/governance" className="av-btn-outline h-10 px-4 text-[12px]">
                    Governance
                  </Link>
                  <Link href="/capabilities" className="av-btn-outline h-10 px-4 text-[12px]">
                    Capabilities
                  </Link>
                  <Link href="/integrations" className="av-btn-outline h-10 px-4 text-[12px]">
                    Integrations
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAKEHOLDERS.map((s) => (
                  <StakeholderCard key={s.title} {...s} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[var(--color-navy-950)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true">
            <div className="absolute -right-10 -top-24 h-[420px] w-[420px] rotate-12 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-10 top-16 text-[240px] font-display opacity-[0.08] select-none">★</div>
          </div>
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
            <div className="max-w-4xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">Credibility</div>
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

        <section className="border-t border-gray-100 bg-[color:var(--warm)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-18">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-soft">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-red-600)]">
                    Ministry briefing
                  </div>
                  <h2 className="mt-4 font-display text-[30px] sm:text-[40px] leading-[1.08] tracking-[-0.03em] text-ink-900">
                    Brief us. We’ll bring the numbers.
                  </h2>
                  <p className="mt-3 text-[13px] sm:text-[14px] text-slate-600 leading-relaxed">
                    A 90-minute walkthrough tailored to ministry oversight, donor reporting, or commercial deployment —
                    Monrovia or remote.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Link href="/request-demo" className="av-btn-red h-11 px-5 text-[12px] shadow-sm justify-center">
                    Request Demo
                  </Link>
                  <Link href="/platform-preview" className="av-btn-outline h-11 px-5 text-[12px] justify-center">
                    View Platform
                  </Link>
                </div>
              </div>
              <div className="mt-8 border-t border-gray-100 pt-5 text-[11px] text-slate-500 font-mono">
                Government owns the data · Role-based access · Audit trails · Offline-first field execution
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}

function HomeNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/70 backdrop-blur">
      <div className="h-[3px] w-full bg-[var(--color-red-600)]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[var(--color-navy-950)] grid place-items-center shadow-sm">
            <span className="text-white font-mono text-[10px]">AV</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-[16px] text-ink-900 leading-tight">AgriVault</div>
            <div className="font-mono text-[10px] text-slate-400">Liberia · Data infrastructure</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-600">
          <Link href="/capabilities" className="hover:text-ink-900">
            Capabilities
          </Link>
          <Link href="/governance" className="hover:text-ink-900">
            Governance
          </Link>
          <Link href="/integrations" className="hover:text-ink-900">
            Integrations
          </Link>
          <Link href="/news" className="hover:text-ink-900">
            News
          </Link>
          <Link href="/docs" className="hover:text-ink-900">
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="av-btn-ghost h-9 px-3 text-[12px]">
            Sign in
          </Link>
          <Link href="/request-demo" className="hidden sm:inline-flex av-btn-navy h-9 px-3 text-[12px]">
            Contact Sales
          </Link>
          <Link href="/request-demo" className="av-btn-red h-9 px-3 text-[12px]">
            Request Demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.28]" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100/60 via-[color:var(--warm)] to-transparent blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-14 sm:pt-18 pb-10 sm:pb-14">
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

        <p className="mt-6 max-w-3xl text-[14px] sm:text-[16px] text-slate-600 leading-relaxed">
          AgriVault is the operational backbone for national food sovereignty — geotagged farmer registry, county-level
          production telemetry, and the audit trail ministries, donors, and exporters can rely on.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link href="/request-demo" className="av-btn-red h-11 px-5 text-[12px] shadow-sm">
            Request a demo →
          </Link>
          <Link href="/platform-preview" className="av-btn-outline h-11 px-5 text-[12px]">
            View platform
          </Link>
          <Link href="/governance" className="av-btn-outline h-11 px-5 text-[12px]">
            Data governance
          </Link>
        </div>

        <div className="mt-5 text-[11px] text-slate-400">
          Used by ministries, cooperatives, and exporters across 15 counties. No card required.
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="font-display text-[22px] text-ink-900">{value}</div>
      <div className="mt-2 text-[11px] text-slate-600">{label}</div>
      <div className="mt-1 text-[10px] text-slate-400">{note}</div>
    </div>
  );
}

function CapabilityCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm hover:shadow-soft transition">
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-mono text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-navy-950)]" />
        {tag.toUpperCase()}
      </div>
      <div className="mt-6 font-display text-[18px] text-ink-900">{title}</div>
      <div className="mt-2 text-[12px] text-slate-600 leading-relaxed">{body}</div>
    </div>
  );
}

function StakeholderCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-[color:var(--warm)] p-6">
      <div className="text-[12px] font-medium text-ink-900">{title}</div>
      <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">{body}</div>
    </div>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-display text-[16px] text-ink-900">AgriVault</div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">Liberia · National data infrastructure</div>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-slate-600">
            <Link href="/request-demo" className="hover:text-ink-900">
              Request demo
            </Link>
            <Link href="/platform-preview" className="hover:text-ink-900">
              View platform
            </Link>
            <Link href="/contact" className="hover:text-ink-900">
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono">
            <span>AgriVault · Liberia</span>
            <span>SOC2 in progress</span>
            <span>ISO 19115</span>
            <span>Data residency: ECOWAS</span>
          </div>
          <div className="font-mono">© 2026</div>
        </div>
      </div>
    </footer>
  );
}
