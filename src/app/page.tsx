import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import PublicSiteShell from "@/components/agrivault/site/PublicSiteShell";

export const metadata: Metadata = {
  title: "Agrivault Data — National agricultural intelligence",
  description:
    "Government-grade registry, operational reporting, warehouse traceability, and ministry coordination — the data backbone for national food security and trusted exports.",
};

const METRICS = [
  { label: "Pilot counties", value: "3", note: "Nimba · Bong · Lofa" },
  { label: "Geotagged profiles", value: "38,214+", note: "registry + plots" },
  { label: "Production tracked (YTD)", value: "482,940 MT", note: "season 2025/26" },
  { label: "Post-harvest loss (avg.)", value: "14.2%", note: "national target <10%" },
] as const;

const PILLARS = [
  {
    title: "Reporting & verification",
    body: "DAO capture through CAO review to ministry consolidation — one pipeline for defensible national numbers and audit-ready workflows.",
    href: "/platform",
  },
  {
    title: "GIS & operational maps",
    body: "Plot anchors, corridor posture, and district cadence visualised from the same reporting fabric — not decorative mapping.",
    href: "/platform",
  },
  {
    title: "Warehouses & custody",
    body: "Inventory pressure, transfers, and chain-of-custody signals tied to field reporting and national oversight desks.",
    href: "/platform",
  },
] as const;

function MapVisual() {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.12) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-950/90 to-slate-950" />
      <div className="absolute left-[12%] top-[22%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
      <div className="absolute left-[38%] top-[48%] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.5)]" />
      <div className="absolute right-[28%] top-[34%] h-3 w-3 rounded-full bg-amber-400/90 shadow-[0_0_18px_rgba(251,191,36,0.45)]" />
      <div className="absolute bottom-[18%] left-[22%] right-[18%] h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Operational layer · anonymised
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <PublicSiteShell>
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
          <div className="container py-14 sm:py-20 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-400/90">
                  National infrastructure · Liberia pilot
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                  Agricultural intelligence and coordination for{" "}
                  <span className="text-emerald-300/95">ministry-grade</span> operations.
                </h1>
                <p className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-slate-400 sm:text-base">
                  Agrivault Data is the reporting and traceability backbone: field capture, verification queues, warehouse
                  posture, and consolidated national visibility — built for intermittent connectivity and sovereign governance.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/request-demo"
                    className="inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-[14px] font-medium text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500"
                  >
                    Request demo
                  </Link>
                  <Link
                    href="/government"
                    className="inline-flex h-11 items-center rounded-lg border border-white/15 bg-white/5 px-5 text-[14px] font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Government partnership
                  </Link>
                </div>
                <p className="mt-6 text-[12px] text-slate-500">
                  Offline-capable field capture · signed audit exports · role-based access aligned to DAO / CAO / national desks.
                </p>
              </div>
              <MapVisual />
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="border-b border-[var(--border)] bg-[var(--warm)] py-12 sm:py-16">
          <div className="container">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {METRICS.map((m) => (
                <article
                  key={m.label}
                  className="rounded-xl border border-[var(--border)] bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="text-2xl font-semibold tracking-tight text-[var(--forest)] sm:text-[1.65rem]">{m.value}</div>
                  <div className="mt-1 text-[13px] text-[var(--mid)]">{m.label}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">{m.note}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="border-b border-[var(--border)] bg-white py-14 sm:py-20">
          <div className="container">
            <span className="section-tag">Operational backbone</span>
            <h2 className="section-h mt-3 max-w-3xl text-[var(--forest)]">Reporting is the core. Everything else derives from it.</h2>
            <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-[var(--mid)]">
              Dashboards, maps, alerts, and exports are projections of the same institutional pipeline — not disconnected modules.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PILLARS.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--warm)] p-6 transition hover:border-emerald-800/25 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-[var(--forest)] group-hover:text-emerald-900">{p.title}</h3>
                  <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--mid)]">{p.body}</p>
                  <span className="mt-4 inline-block text-[12px] font-medium text-emerald-800">View platform →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow strip */}
        <section className="border-b border-[var(--border)] bg-[var(--warm)] py-14 sm:py-20">
          <div className="container">
            <span className="section-tag">National workflow</span>
            <h2 className="section-h mt-3 max-w-2xl">Field → county → ministry → intelligence</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "01", title: "Field capture", body: "Offline-first forms, timestamps, and evidence stubs for DAO-led collection." },
                { step: "02", title: "County review", body: "CAO verification, escalations, and compliance posture within county scope." },
                { step: "03", title: "Ministry consolidation", body: "National registries, transfers, warehouses, and subsidy signals in one ledger." },
                { step: "04", title: "Operational intelligence", body: "Heat maps, queues, and cabinet-ready exports from the same source of truth." },
              ].map((s) => (
                <article key={s.step} className="rounded-xl border border-[var(--border)] bg-white p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{s.step}</div>
                  <h3 className="mt-2 text-base font-semibold text-[var(--forest)]">{s.title}</h3>
                  <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--mid)]">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quote + CTA */}
        <section className="bg-[var(--navy)] py-16 text-white sm:py-20">
          <div className="container max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Institutional posture</p>
            <blockquote className="mt-6 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              “A single defensible number for national production — by county, by season, by farmer — is not a dashboard feature.
              It is sovereignty.”
            </blockquote>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/request-demo"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg transition hover:bg-emerald-500"
              >
                Request demo →
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/15"
              >
                Platform overview
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicSiteShell>
  );
}
